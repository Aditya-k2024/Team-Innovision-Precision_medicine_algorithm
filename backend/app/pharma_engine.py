"""Pharmacogenomic Risk Prediction Engine for PharmaGuard.

Cross-references patient VCF variants against the drug-gene interaction
database to produce per-drug risk assessments in the required output schema.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from .models import (
    AnalysisResult,
    ClinicalRecommendation,
    DetectedVariant,
    DrugRiskResult,
    PharmaGuardResult,
    PharmacogenomicProfile,
    QualityMetrics,
    RiskAssessment,
    RiskLevel,
    Variant,
)

# ── Load drug-gene database at module level ────────────────────────────

_DB_PATH = Path(__file__).parent / "data" / "drug_gene_db.json"
_drug_gene_db: dict = {}


def _load_db() -> dict:
    """Load the drug-gene database JSON file."""
    global _drug_gene_db
    if not _drug_gene_db:
        with open(_DB_PATH, "r") as f:
            _drug_gene_db = json.load(f)
    return _drug_gene_db


def get_supported_drugs() -> list[dict]:
    """Return a list of all supported drugs with metadata."""
    db = _load_db()
    return [
        {"id": drug_id, "name": info["name"], "category": info["category"]}
        for drug_id, info in db["drugs"].items()
    ]


# ── Risk level ordering for worst-case selection ───────────────────────

_RISK_ORDER = {
    RiskLevel.NORMAL: 0,
    RiskLevel.MODERATE: 1,
    RiskLevel.HIGH: 2,
    RiskLevel.CRITICAL: 3,
}

# ── Mapping from internal risk level to required schema labels ─────────

_RISK_LABEL_MAP = {
    RiskLevel.NORMAL: "Safe",
    RiskLevel.MODERATE: "Adjust Dosage",
    RiskLevel.HIGH: "Toxic",
    RiskLevel.CRITICAL: "Critical Risk",
}

_SEVERITY_MAP = {
    RiskLevel.NORMAL: "none",
    RiskLevel.MODERATE: "moderate",
    RiskLevel.HIGH: "high",
    RiskLevel.CRITICAL: "critical",
}

_CONFIDENCE_MAP = {
    RiskLevel.NORMAL: 0.95,
    RiskLevel.MODERATE: 0.85,
    RiskLevel.HIGH: 0.80,
    RiskLevel.CRITICAL: 0.90,
}

# ── Phenotype abbreviation map ────────────────────────────────────────

def _abbreviate_phenotype(phenotype: str) -> str:
    """Map full phenotype names to standard abbreviations."""
    p = phenotype.lower()
    if "ultra" in p and "rapid" in p:
        return "URM"
    if "rapid" in p and "metabolizer" in p:
        return "RM"
    if "poor" in p or "deficien" in p:
        return "PM"
    if "intermediate" in p:
        return "IM"
    if "normal" in p:
        return "NM"
    if "non-expressor" in p:
        return "NM"
    if "expressor" in p:
        return "IM" if "intermediate" in p else "RM"
    if "negative" in p:
        return "NM"
    if "carrier" in p or "homozygous" in p:
        return "PM"
    return "Unknown"


def analyze_variants(
    variants: list[Variant], drug_names: list[str]
) -> list[AnalysisResult]:
    """Analyze patient variants against requested drugs (internal format)."""
    db = _load_db()
    results: list[AnalysisResult] = []

    variant_map: dict[str, Variant] = {}
    for v in variants:
        if v.rsid:
            variant_map[v.rsid] = v

    for drug_name in drug_names:
        drug_key = drug_name.lower().strip()
        drug_info = db["drugs"].get(drug_key)

        if not drug_info:
            results.append(
                AnalysisResult(
                    drug_risk=DrugRiskResult(
                        drug_name=drug_name,
                        gene="N/A",
                        recommendation=f"No pharmacogenomic data available for '{drug_name}'.",
                    )
                )
            )
            continue

        worst_result: Optional[DrugRiskResult] = None

        for interaction in drug_info["interactions"]:
            rsid = interaction["rsid"]
            gene = interaction["gene"]
            risk_allele = interaction["risk_allele"]
            phenotypes = interaction["phenotypes"]
            evidence = interaction.get("evidence", [])

            patient_variant = variant_map.get(rsid)

            if patient_variant is None:
                genotype_key = "0/0"
            else:
                genotype_key = _classify_genotype(
                    patient_variant, risk_allele, interaction.get("normal_allele", "")
                )

            pheno_data = phenotypes.get(genotype_key, phenotypes.get("0/0", {}))
            risk_level = RiskLevel(pheno_data.get("level", "NORMAL"))

            result = DrugRiskResult(
                drug_name=drug_info["name"],
                gene=gene,
                variant=f"{patient_variant.ref}>{patient_variant.alt}" if patient_variant else None,
                rsid=rsid,
                genotype=patient_variant.genotype if patient_variant else None,
                risk_level=risk_level,
                phenotype=pheno_data.get("phenotype", "Unknown"),
                recommendation=pheno_data.get("recommendation", "No recommendation available."),
                evidence_sources=evidence,
            )

            if worst_result is None or _RISK_ORDER[result.risk_level] > _RISK_ORDER[worst_result.risk_level]:
                worst_result = result

        results.append(AnalysisResult(drug_risk=worst_result or DrugRiskResult(drug_name=drug_info["name"], gene="N/A")))

    return results


def convert_to_required_schema(
    results: list[AnalysisResult],
    variants: list[Variant],
    sample_id: str = "PATIENT_001",
) -> list[PharmaGuardResult]:
    """Convert internal AnalysisResult list to the required output schema."""
    db = _load_db()
    variant_map: dict[str, Variant] = {}
    for v in variants:
        if v.rsid:
            variant_map[v.rsid] = v

    timestamp = datetime.now(timezone.utc).isoformat()
    output: list[PharmaGuardResult] = []
    total_variants = len(variants)
    pgx_variants_found = sum(1 for v in variants if v.rsid and _is_pharmacogenomic_rsid(v.rsid))

    for result in results:
        dr = result.drug_risk
        drug_key = dr.drug_name.lower().replace(" ", "").replace("(5-fu)", "")
        drug_info = db["drugs"].get(drug_key, {})

        # Collect all detected variants for this drug
        detected: list[DetectedVariant] = []
        if drug_info:
            for interaction in drug_info.get("interactions", []):
                rsid = interaction["rsid"]
                pv = variant_map.get(rsid)
                if pv:
                    detected.append(DetectedVariant(
                        rsid=rsid,
                        gene=interaction["gene"],
                        allele_change=f"{pv.ref}>{pv.alt}",
                        genotype=pv.genotype,
                        quality=pv.quality,
                        filter_status=pv.filter_status,
                    ))

        # Build diplotype string from phenotype
        diplotype = _extract_diplotype(dr.phenotype)

        pharma_result = PharmaGuardResult(
            patient_id=sample_id,
            drug=dr.drug_name,
            timestamp=timestamp,
            risk_assessment=RiskAssessment(
                risk_label=_RISK_LABEL_MAP.get(dr.risk_level, "Safe"),
                confidence_score=_CONFIDENCE_MAP.get(dr.risk_level, 0.85),
                severity=_SEVERITY_MAP.get(dr.risk_level, "none"),
            ),
            pharmacogenomic_profile=PharmacogenomicProfile(
                primary_gene=dr.gene,
                diplotype=diplotype,
                phenotype=_abbreviate_phenotype(dr.phenotype),
                detected_variants=detected,
            ),
            clinical_recommendation=ClinicalRecommendation(
                action=dr.recommendation,
                dosage_adjustment=_extract_dosage_adjustment(dr.recommendation),
                alternative_drugs=_extract_alternatives(dr.recommendation),
                monitoring=_extract_monitoring(dr.recommendation),
                evidence_sources=dr.evidence_sources,
            ),
            llm_generated_explanation=result.llm_explanation,
            quality_metrics=QualityMetrics(
                vcf_parsing_success=True,
                total_variants_parsed=total_variants,
                pharmacogenomic_variants_found=pgx_variants_found,
                analysis_confidence=_CONFIDENCE_MAP.get(dr.risk_level, 0.85),
                gene_coverage=1.0 if detected else 0.0,
            ),
        )
        output.append(pharma_result)

    return output


def _is_pharmacogenomic_rsid(rsid: str) -> bool:
    """Check if an rsID is in our drug-gene database."""
    db = _load_db()
    for drug_info in db["drugs"].values():
        for interaction in drug_info["interactions"]:
            if interaction["rsid"] == rsid:
                return True
    return False


def _extract_diplotype(phenotype: str) -> str:
    """Extract diplotype string from phenotype description."""
    import re
    match = re.search(r'\(\*\d+/\*\d+\w?\)', phenotype)
    if match:
        return match.group(0).strip("()")
    p = phenotype.lower()
    if "poor" in p or "deficien" in p:
        return "*2/*2"
    if "intermediate" in p:
        return "*1/*2"
    return "*1/*1"


def _extract_dosage_adjustment(recommendation: str) -> Optional[str]:
    """Extract dosage adjustment info from recommendation text."""
    import re
    match = re.search(r'(\d+[-–]\d+%\s*(?:dose reduction|lower|higher))', recommendation, re.IGNORECASE)
    if match:
        return match.group(0)
    if "reduce dose" in recommendation.lower():
        match2 = re.search(r'[Rr]educe dose\s+by\s+[\d\-–%\s]+', recommendation)
        if match2:
            return match2.group(0)
    return None


def _extract_alternatives(recommendation: str) -> list[str]:
    """Extract alternative drug suggestions."""
    alternatives = []
    keywords = ["prasugrel", "ticagrelor", "pravastatin", "rosuvastatin"]
    for drug in keywords:
        if drug.lower() in recommendation.lower():
            alternatives.append(drug.capitalize())
    if "alternative" in recommendation.lower() and not alternatives:
        alternatives.append("Consult prescriber for alternatives")
    return alternatives


def _extract_monitoring(recommendation: str) -> Optional[str]:
    """Extract monitoring instructions."""
    rec_lower = recommendation.lower()
    if "monitor" in rec_lower:
        if "inr" in rec_lower:
            return "Monitor INR closely"
        if "cbc" in rec_lower:
            return "Monitor CBC weekly"
        if "trough" in rec_lower:
            return "Monitor trough levels"
        return "Close clinical monitoring required"
    return None


def _classify_genotype(
    variant: Variant, risk_allele: str, normal_allele: str
) -> str:
    """Classify a patient's genotype into 0/0, 0/1, or 1/1 relative to the risk allele."""
    gt = variant.genotype
    if not gt:
        if variant.alt.upper() == risk_allele.upper():
            return "0/1"
        return "0/0"

    alleles_idx = gt.replace("|", "/").split("/")
    allele_list = [variant.ref] + variant.alt.split(",")

    risk_count = 0
    for idx_str in alleles_idx:
        if idx_str == ".":
            continue
        try:
            idx = int(idx_str)
            if idx < len(allele_list) and allele_list[idx].upper() == risk_allele.upper():
                risk_count += 1
        except ValueError:
            continue

    if risk_count == 0:
        return "0/0"
    elif risk_count == 1:
        return "0/1"
    else:
        return "1/1"
