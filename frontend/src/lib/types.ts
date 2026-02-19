/**
 * Shared TypeScript types for PharmaGuard.
 * Matches the EXACT output schema from the problem statement.
 */

// ── Enums & Basics ─────────────────────────────────────────────────

export type RiskLevel = "NORMAL" | "MODERATE" | "HIGH" | "CRITICAL";

export interface DrugInfo {
    id: string;
    name: string;
    category: string;
}

export interface Variant {
    chrom: string;
    pos: number;
    rsid?: string;
    ref: string;
    alt: string;
    quality?: number;
    filter_status?: string;
    info?: Record<string, string>;
    genotype?: string;
}

// ── Required Output Schema ─────────────────────────────────────────

export interface DetectedVariant {
    rsid: string;
    gene: string;
    allele_change?: string;
    genotype?: string;
    quality?: number;
    filter_status: string;
}

export interface RiskAssessment {
    risk_label: string;  // "Safe" | "Adjust Dosage" | "Toxic" | "Critical Risk"
    confidence_score: number;
    severity: string;    // "none" | "low" | "moderate" | "high" | "critical"
}

export interface PharmacogenomicProfile {
    primary_gene: string;
    diplotype: string;
    phenotype: string;   // "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown"
    detected_variants: DetectedVariant[];
}

export interface ClinicalRecommendation {
    action: string;
    dosage_adjustment?: string;
    alternative_drugs: string[];
    monitoring?: string;
    evidence_sources: string[];
}

export interface LLMExplanation {
    summary: string;
    biological_mechanism: string;
    clinical_significance: string;
    variant_citations: string[];
}

export interface QualityMetrics {
    vcf_parsing_success: boolean;
    total_variants_parsed: number;
    pharmacogenomic_variants_found: number;
    analysis_confidence: number;
    gene_coverage: number;
}

export interface PharmaGuardResult {
    patient_id: string;
    drug: string;
    timestamp: string;
    risk_assessment: RiskAssessment;
    pharmacogenomic_profile: PharmacogenomicProfile;
    clinical_recommendation: ClinicalRecommendation;
    llm_generated_explanation?: LLMExplanation;
    quality_metrics: QualityMetrics;
}

// ── API Response ──────────────────────────────────────────────────

export interface AnalyzeResponse {
    results: PharmaGuardResult[];
    metadata: {
        timestamp: string;
        variant_count: number;
        drug_count: number;
    };
}

// Legacy types kept for compatibility with internal engine output
export interface DrugRiskResult {
    drug_name: string;
    gene: string;
    variant?: string;
    rsid?: string;
    genotype?: string;
    risk_level: RiskLevel;
    phenotype: string;
    recommendation: string;
    evidence_sources: string[];
}

export interface AnalysisResult {
    drug_risk: DrugRiskResult;
    llm_explanation?: LLMExplanation;
}
