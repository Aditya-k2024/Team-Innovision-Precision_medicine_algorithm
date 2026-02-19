/**
 * Groq LLM client for PharmaGuard.
 *
 * Calls the Groq API (llama-3.3-70b-versatile) to generate clinical
 * pharmacogenomic explanations. Falls back to rule-based text if
 * no API key is set or on error.
 */

import type { LLMExplanation, PharmaGuardResult } from "./types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

function buildSystemPrompt(): string {
    return `You are a clinical pharmacogenomics expert. Given a drug–gene interaction analysis, provide a clear, accurate explanation for healthcare professionals.

Respond ONLY in valid JSON with this exact schema:
{
  "summary": "One-paragraph summary of the pharmacogenomic interaction",
  "biological_mechanism": "How the genetic variant affects drug metabolism/response at the molecular level",
  "clinical_significance": "What this means for patient care, dosing, and monitoring",
  "variant_citations": ["Array of relevant PMIDs, CPIC guidelines, or PharmGKB references"]
}

Be precise, evidence-based, and clinically actionable. Do not include any text outside the JSON object.`;
}

function buildUserPrompt(result: PharmaGuardResult): string {
    return `Analyze this pharmacogenomic finding:

Drug: ${result.drug}
Gene: ${result.pharmacogenomic_profile.primary_gene}
Diplotype: ${result.pharmacogenomic_profile.diplotype}
Phenotype: ${result.pharmacogenomic_profile.phenotype}
Risk Label: ${result.risk_assessment.risk_label}
Severity: ${result.risk_assessment.severity}
Clinical Action: ${result.clinical_recommendation.action}
Evidence: ${result.clinical_recommendation.evidence_sources.join(", ")}
Detected Variants: ${result.pharmacogenomic_profile.detected_variants.map(v => `${v.rsid} (${v.gene}, ${v.allele_change || "N/A"})`).join("; ") || "None"}

Provide a detailed clinical explanation.`;
}

function fallbackExplanation(result: PharmaGuardResult): LLMExplanation {
    return {
        summary: `Patient carries a ${result.risk_assessment.severity}-severity variant in ${result.pharmacogenomic_profile.primary_gene} affecting ${result.drug} metabolism. Phenotype: ${result.pharmacogenomic_profile.phenotype}.`,
        biological_mechanism: `The variant in ${result.pharmacogenomic_profile.primary_gene} (${result.pharmacogenomic_profile.diplotype}) alters enzyme activity, potentially affecting the pharmacokinetics and/or pharmacodynamics of ${result.drug}.`,
        clinical_significance: result.clinical_recommendation.action,
        variant_citations: result.clinical_recommendation.evidence_sources,
    };
}

export async function generateLLMExplanation(
    result: PharmaGuardResult
): Promise<LLMExplanation> {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return fallbackExplanation(result);
    }

    try {
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "system", content: buildSystemPrompt() },
                    { role: "user", content: buildUserPrompt(result) },
                ],
                temperature: 0.3,
                max_tokens: 800,
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            console.error(`Groq API error: ${response.status} ${response.statusText}`);
            return fallbackExplanation(result);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return fallbackExplanation(result);
        }

        const parsed = JSON.parse(content) as LLMExplanation;

        // Validate the response has required fields
        if (!parsed.summary || !parsed.biological_mechanism || !parsed.clinical_significance) {
            return fallbackExplanation(result);
        }

        return {
            summary: parsed.summary,
            biological_mechanism: parsed.biological_mechanism,
            clinical_significance: parsed.clinical_significance,
            variant_citations: parsed.variant_citations || [],
        };
    } catch (error) {
        console.error("LLM explanation generation failed:", error);
        return fallbackExplanation(result);
    }
}
