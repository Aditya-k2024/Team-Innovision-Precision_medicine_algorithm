"""Tests for the VCF v4.2 parser."""

import os
from pathlib import Path

import pytest

from app.vcf_parser import parse_vcf

FIXTURES = Path(__file__).parent / "fixtures"
SAMPLE_VCF = FIXTURES / "sample.vcf"


class TestParseVCF:
    """Test suite for VCF parsing."""

    def test_parse_sample_file(self):
        """Parse the sample VCF and verify basic structure."""
        with open(SAMPLE_VCF, "r") as f:
            result = parse_vcf(f.read())

        assert result["total_variants"] > 0
        assert len(result["variants"]) == result["total_variants"]
        assert "PATIENT_001" in result["sample_ids"]

    def test_meta_info_extraction(self):
        """Verify meta-information lines are parsed."""
        with open(SAMPLE_VCF, "r") as f:
            result = parse_vcf(f.read())

        assert "fileformat" in result["meta_info"]
        assert result["meta_info"]["fileformat"] == "VCFv4.2"

    def test_variant_fields(self):
        """Verify individual variant fields are populated correctly."""
        with open(SAMPLE_VCF, "r") as f:
            result = parse_vcf(f.read())

        # Find the CYP2C9 rs1799853 variant
        v = next((v for v in result["variants"] if v.rsid == "rs1799853"), None)
        assert v is not None
        assert v.chrom == "chr10"
        assert v.pos == 96702047
        assert v.ref == "C"
        assert v.alt == "T"
        assert v.quality == 99.0
        assert v.filter_status == "PASS"
        assert v.genotype == "0/1"

    def test_info_field_parsing(self):
        """Verify INFO field key=value pairs are parsed."""
        with open(SAMPLE_VCF, "r") as f:
            result = parse_vcf(f.read())

        v = next((v for v in result["variants"] if v.rsid == "rs1799853"), None)
        assert v is not None
        assert v.info.get("DP") == "120"
        assert v.info.get("GENE") == "CYP2C9"

    def test_multi_allelic_splitting(self):
        """Verify multi-allelic variants are split into separate records."""
        with open(SAMPLE_VCF, "r") as f:
            result = parse_vcf(f.read())

        # rs100005 has ALT=G,T — should be split into two variants
        multi = [v for v in result["variants"] if v.rsid == "rs100005"]
        assert len(multi) == 2
        alts = {v.alt for v in multi}
        assert "G" in alts
        assert "T" in alts

    def test_bytes_input(self):
        """Verify parser accepts bytes input."""
        with open(SAMPLE_VCF, "rb") as f:
            content = f.read()
        result = parse_vcf(content)
        assert result["total_variants"] > 0

    def test_missing_rsid(self):
        """Variants with '.' as ID should have rsid=None."""
        vcf_text = (
            "##fileformat=VCFv4.2\n"
            "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\n"
            "chr1\t100\t.\tA\tG\t50\tPASS\tDP=30\n"
        )
        result = parse_vcf(vcf_text)
        assert len(result["variants"]) == 1
        assert result["variants"][0].rsid is None

    def test_empty_file(self):
        """Empty file should return zero variants."""
        result = parse_vcf("")
        assert result["total_variants"] == 0
        assert result["variants"] == []

    def test_large_file_generation(self):
        """Generate and parse a VCF with 2000+ records."""
        header = (
            "##fileformat=VCFv4.2\n"
            "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSAMPLE1\n"
        )
        lines = [header]
        for i in range(2500):
            lines.append(
                f"chr1\t{1000 + i}\trs{900000 + i}\tA\tG\t50\tPASS\tDP=30\tGT:DP\t0/1:30\n"
            )
        vcf_text = "".join(lines)
        result = parse_vcf(vcf_text)
        assert result["total_variants"] == 2500
