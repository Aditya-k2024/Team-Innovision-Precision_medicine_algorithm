"""Pydantic models for PharmaGuard API request/response schemas.

Output follows the EXACT schema required by the problem statement.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums ──────────────────────────────────────────────────────────────

class RiskLevel(str, Enum):
    NORMAL = "NORMAL"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ── VCF / Variant Models ──────────────────────────────────────────────

class Variant(BaseModel):
    """A single parsed VCF variant."""
    chrom: str
    pos: int
    rsid: Optional[str] = None
    ref: str
    alt: str
    quality: Optional[float] = None
    filter_status: str = "."
    info: dict = Field(default_factory=dict)
    genotype: Optional[str] = None


class ParseVCFResponse(BaseModel):
    """Response from /parse-vcf endpoint."""
    variants: list[Variant]
    sample_ids: list[str] = Field(default_factory=list)
    total_variants: int
    meta_info: dict = Field(default_factory=dict)


# ── Required Output Schema (matches problem statement EXACTLY) ────────

class DetectedVariant(BaseModel):
    """A detected pharmacogenomic variant."""
    rsid: str
    gene: str
    allele_change: Optional[str] = None
    genotype: Optional[str] = None
    quality: Optional[float] = None
    filter_status: str = "PASS"


class RiskAssessment(BaseModel):
    """Risk assessment block."""
    risk_label: str  # "Safe" | "Adjust Dosage" | "Toxic" | "Ineffective" | "Critical Risk"
    confidence_score: float = 0.85
    severity: str = "none"  # "none" | "low" | "moderate" | "high" | "critical"


class PharmacogenomicProfile(BaseModel):
    """Pharmacogenomic profile block."""
    primary_gene: str
    diplotype: str = "*1/*1"
    phenotype: str = "NM"  # "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown"
    detected_variants: list[DetectedVariant] = Field(default_factory=list)


class ClinicalRecommendation(BaseModel):
    """Clinical recommendation block."""
    action: str = "Use standard dosing guidelines."
    dosage_adjustment: Optional[str] = None
    alternative_drugs: list[str] = Field(default_factory=list)
    monitoring: Optional[str] = None
    evidence_sources: list[str] = Field(default_factory=list)


class LLMExplanation(BaseModel):
    """LLM-generated clinical explanation."""
    summary: str
    biological_mechanism: str
    clinical_significance: str
    variant_citations: list[str] = Field(default_factory=list)


class QualityMetrics(BaseModel):
    """Quality metrics block."""
    vcf_parsing_success: bool = True
    total_variants_parsed: int = 0
    pharmacogenomic_variants_found: int = 0
    analysis_confidence: float = 0.85
    gene_coverage: float = 1.0


class PharmaGuardResult(BaseModel):
    """Single drug result — matches the EXACT schema from the problem statement."""
    patient_id: str = "PATIENT_001"
    drug: str
    timestamp: str
    risk_assessment: RiskAssessment
    pharmacogenomic_profile: PharmacogenomicProfile
    clinical_recommendation: ClinicalRecommendation
    llm_generated_explanation: Optional[LLMExplanation] = None
    quality_metrics: QualityMetrics


# ── Legacy models (still used internally by the engine) ────────────────

class DrugGeneInteraction(BaseModel):
    drug: str
    gene: str
    rsid: str
    risk_allele: str
    risk_level: RiskLevel
    phenotype: str
    recommendation: str
    evidence_sources: list[str] = Field(default_factory=list)


class DrugRiskResult(BaseModel):
    """Internal risk assessment for one drug in a patient."""
    drug_name: str
    gene: str
    variant: Optional[str] = None
    rsid: Optional[str] = None
    genotype: Optional[str] = None
    risk_level: RiskLevel = RiskLevel.NORMAL
    phenotype: str = "Normal Metabolizer"
    recommendation: str = "Use standard dosing guidelines."
    evidence_sources: list[str] = Field(default_factory=list)


class AnalysisResult(BaseModel):
    """Combined result for one drug — rule-based + LLM."""
    drug_risk: DrugRiskResult
    llm_explanation: Optional[LLMExplanation] = None


# ── Request / Response ─────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    """Request to /analyze endpoint."""
    variants: list[Variant]
    drug_names: list[str]


class AnalyzeResponse(BaseModel):
    """Response from /analyze endpoint — uses the required schema."""
    results: list[PharmaGuardResult]
    metadata: dict = Field(default_factory=dict)
