"""Tests for the Pharmacogenomic Risk Prediction Engine."""

from pathlib import Path

import pytest

from app.models import Variant, RiskLevel
from app.pharma_engine import analyze_variants, get_supported_drugs
from app.vcf_parser import parse_vcf

FIXTURES = Path(__file__).parent / "fixtures"
SAMPLE_VCF = FIXTURES / "sample.vcf"


def _load_sample_variants() -> list[Variant]:
    """Load variants from the sample VCF fixture."""
    with open(SAMPLE_VCF, "r") as f:
        result = parse_vcf(f.read())
    return result["variants"]


class TestGetSupportedDrugs:
    def test_returns_drugs(self):
        drugs = get_supported_drugs()
        assert len(drugs) >= 10
        names = {d["id"] for d in drugs}
        assert "warfarin" in names
        assert "clopidogrel" in names

    def test_drug_has_metadata(self):
        drugs = get_supported_drugs()
        for drug in drugs:
            assert "id" in drug
            assert "name" in drug
            assert "category" in drug


class TestAnalyzeVariants:
    def test_warfarin_moderate_risk(self):
        """Patient has CYP2C9 rs1799853 0/1 → MODERATE for warfarin."""
        variants = _load_sample_variants()
        results = analyze_variants(variants, ["warfarin"])
        assert len(results) == 1
        r = results[0].drug_risk
        assert r.drug_name == "Warfarin"
        assert r.risk_level in (RiskLevel.MODERATE, RiskLevel.HIGH, RiskLevel.CRITICAL)
        assert r.gene in ("CYP2C9", "VKORC1")

    def test_clopidogrel_critical_risk(self):
        """Patient has CYP2C19 rs4244285 1/1 → CRITICAL for clopidogrel."""
        variants = _load_sample_variants()
        results = analyze_variants(variants, ["clopidogrel"])
        assert len(results) == 1
        r = results[0].drug_risk
        assert r.drug_name == "Clopidogrel"
        assert r.risk_level == RiskLevel.CRITICAL

    def test_codeine_moderate_risk(self):
        """Patient has CYP2D6 rs3892097 0/1 → MODERATE for codeine."""
        variants = _load_sample_variants()
        results = analyze_variants(variants, ["codeine"])
        assert len(results) == 1
        r = results[0].drug_risk
        assert r.drug_name == "Codeine"
        assert r.risk_level == RiskLevel.MODERATE

    def test_simvastatin_moderate_risk(self):
        """Patient has SLCO1B1 rs4149056 0/1 → MODERATE for simvastatin."""
        variants = _load_sample_variants()
        results = analyze_variants(variants, ["simvastatin"])
        assert len(results) == 1
        r = results[0].drug_risk
        assert r.drug_name == "Simvastatin"
        assert r.risk_level == RiskLevel.MODERATE

    def test_fluorouracil_normal(self):
        """Patient has DPYD rs3918290 0/0 → NORMAL for fluorouracil."""
        variants = _load_sample_variants()
        results = analyze_variants(variants, ["fluorouracil"])
        assert len(results) == 1
        r = results[0].drug_risk
        assert r.risk_level == RiskLevel.NORMAL

    def test_unknown_drug(self):
        """Unknown drug returns default normal result."""
        variants = _load_sample_variants()
        results = analyze_variants(variants, ["unknowndrug123"])
        assert len(results) == 1
        r = results[0].drug_risk
        assert r.risk_level == RiskLevel.NORMAL
        assert "No pharmacogenomic data" in r.recommendation

    def test_multiple_drugs(self):
        """Multiple drugs return one result each."""
        variants = _load_sample_variants()
        drugs = ["warfarin", "clopidogrel", "codeine", "simvastatin"]
        results = analyze_variants(variants, drugs)
        assert len(results) == 4
        drug_names = [r.drug_risk.drug_name for r in results]
        assert "Warfarin" in drug_names
        assert "Clopidogrel" in drug_names

    def test_empty_variants(self):
        """No variants → all drugs return NORMAL."""
        results = analyze_variants([], ["warfarin", "clopidogrel"])
        assert len(results) == 2
        for r in results:
            assert r.drug_risk.risk_level == RiskLevel.NORMAL

    def test_result_has_evidence(self):
        """Results should include evidence sources."""
        variants = _load_sample_variants()
        results = analyze_variants(variants, ["warfarin"])
        r = results[0].drug_risk
        assert len(r.evidence_sources) > 0

    def test_azathioprine_high_risk(self):
        """Patient has TPMT rs1800460 0/1 → HIGH for azathioprine."""
        variants = _load_sample_variants()
        results = analyze_variants(variants, ["azathioprine"])
        assert len(results) == 1
        r = results[0].drug_risk
        assert r.risk_level == RiskLevel.HIGH
