"""PharmaGuard — FastAPI backend entry point.

Endpoints:
  GET  /                → Health check
  GET  /drugs           → List supported drugs
  POST /parse-vcf       → Parse an uploaded VCF file
  POST /analyze         → Run pharmacogenomic risk analysis
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import AnalyzeRequest, AnalyzeResponse, ParseVCFResponse
from app.vcf_parser import parse_vcf
from app.pharma_engine import analyze_variants, convert_to_required_schema, get_supported_drugs

app = FastAPI(
    title="PharmaGuard API",
    description="Pharmacogenomic Risk Prediction System — Backend",
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ─────────────────────────────────────────────────────────────

@app.get("/")
async def health():
    """Health check."""
    return {"status": "ok", "service": "PharmaGuard API", "version": "1.0.0"}


@app.get("/drugs")
async def list_drugs():
    """Return list of supported drugs."""
    return {"drugs": get_supported_drugs()}


@app.post("/parse-vcf", response_model=ParseVCFResponse)
async def parse_vcf_endpoint(file: UploadFile = File(...)):
    """Parse an uploaded VCF file and return structured variant data."""
    if not file.filename or not file.filename.lower().endswith(".vcf"):
        raise HTTPException(status_code=400, detail="File must be a .vcf file.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = parse_vcf(content)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse VCF file: {str(e)}")

    return ParseVCFResponse(
        variants=result["variants"],
        sample_ids=result["sample_ids"],
        total_variants=result["total_variants"],
        meta_info=result["meta_info"],
    )


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_endpoint(request: AnalyzeRequest):
    """Run pharmacogenomic risk analysis on parsed variants + drug list.

    Returns results in the EXACT required output schema.
    """
    if not request.drug_names:
        raise HTTPException(status_code=400, detail="At least one drug name is required.")

    # Run the internal analysis
    internal_results = analyze_variants(request.variants, request.drug_names)

    # Convert to the required output schema
    schema_results = convert_to_required_schema(
        results=internal_results,
        variants=request.variants,
        sample_id="PATIENT_001",
    )

    return AnalyzeResponse(
        results=schema_results,
        metadata={
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "variant_count": len(request.variants),
            "drug_count": len(request.drug_names),
        },
    )
