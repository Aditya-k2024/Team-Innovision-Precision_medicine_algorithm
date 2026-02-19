"""VCF v4.2 file parser for PharmaGuard.

Parses Variant Call Format files, extracting variant records with
chromosome, position, rsID, ref/alt alleles, quality, filter, INFO,
and sample genotype information.
"""

from __future__ import annotations

import io
import re
from typing import BinaryIO

from .models import Variant


def parse_vcf(file_content: str | bytes | BinaryIO) -> dict:
    """Parse a VCF v4.2 file and return structured variant data.

    Args:
        file_content: VCF file content as string, bytes, or file-like object.

    Returns:
        dict with keys: variants, sample_ids, total_variants, meta_info.
    """
    # Normalize input to list of lines
    if isinstance(file_content, bytes):
        lines = file_content.decode("utf-8", errors="replace").splitlines()
    elif hasattr(file_content, "read"):
        raw = file_content.read()
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8", errors="replace")
        lines = raw.splitlines()
    else:
        lines = file_content.splitlines()

    meta_info: dict = {}
    header_cols: list[str] = []
    sample_ids: list[str] = []
    variants: list[Variant] = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # ── Meta-information lines (##)
        if line.startswith("##"):
            _parse_meta_line(line, meta_info)
            continue

        # ── Header line (#CHROM ...)
        if line.startswith("#CHROM") or line.startswith("#chrom"):
            header_cols = line.lstrip("#").split("\t")
            # Sample IDs are columns after FORMAT (index 8)
            if len(header_cols) > 9:
                sample_ids = header_cols[9:]
            elif len(header_cols) > 8:
                sample_ids = header_cols[9:] if len(header_cols) > 9 else []
            continue

        # ── Data lines
        fields = line.split("\t")
        if len(fields) < 8:
            continue  # Malformed line

        variant = _parse_variant_line(fields, sample_ids)
        if variant:
            # Handle multi-allelic: split into separate Variant records
            alts = variant.alt.split(",")
            if len(alts) > 1:
                for alt in alts:
                    v = variant.model_copy(update={"alt": alt.strip()})
                    variants.append(v)
            else:
                variants.append(variant)

    return {
        "variants": variants,
        "sample_ids": sample_ids,
        "total_variants": len(variants),
        "meta_info": meta_info,
    }


def _parse_meta_line(line: str, meta_info: dict) -> None:
    """Parse a ## meta-information line into the meta_info dict."""
    # e.g., ##fileformat=VCFv4.2
    match = re.match(r"^##(\w+)=(.+)$", line)
    if match:
        key, value = match.group(1), match.group(2)
        if key in meta_info:
            if not isinstance(meta_info[key], list):
                meta_info[key] = [meta_info[key]]
            meta_info[key].append(value)
        else:
            meta_info[key] = value


def _parse_variant_line(
    fields: list[str], sample_ids: list[str]
) -> Variant | None:
    """Parse a single data line into a Variant object."""
    try:
        chrom = fields[0]
        pos = int(fields[1])
        rsid = fields[2] if fields[2] != "." else None
        ref = fields[3]
        alt = fields[4]
        quality = float(fields[5]) if fields[5] != "." else None
        filter_status = fields[6]

        # Parse INFO field
        info = _parse_info(fields[7])

        # Parse genotype from first sample if available
        genotype = None
        if len(fields) > 9:
            format_field = fields[8]
            sample_field = fields[9]
            genotype = _extract_genotype(format_field, sample_field)

        return Variant(
            chrom=chrom,
            pos=pos,
            rsid=rsid,
            ref=ref,
            alt=alt,
            quality=quality,
            filter_status=filter_status,
            info=info,
            genotype=genotype,
        )
    except (ValueError, IndexError):
        return None


def _parse_info(info_str: str) -> dict:
    """Parse the INFO field (key=value;key=value)."""
    if info_str == ".":
        return {}
    info = {}
    for item in info_str.split(";"):
        if "=" in item:
            k, v = item.split("=", 1)
            info[k] = v
        else:
            info[item] = True
    return info


def _extract_genotype(format_field: str, sample_field: str) -> str | None:
    """Extract the GT (genotype) value from FORMAT and sample columns."""
    fmt_keys = format_field.split(":")
    sample_vals = sample_field.split(":")
    try:
        gt_idx = fmt_keys.index("GT")
        return sample_vals[gt_idx]
    except (ValueError, IndexError):
        return None
