/**
 * POST /api/analyze
 *
 * Accepts a multipart form with:
 *   - file: VCF file
 *   - drugs: JSON array of drug IDs
 *
 * Forwards to the Python backend for parsing + analysis,
 * then enhances results with Groq LLM explanations.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateLLMExplanation } from "@/lib/llm";
import type { PharmaGuardResult } from "@/lib/types";

let backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
if (!backendUrl.startsWith("http")) {
    backendUrl = `http://${backendUrl}`;
}
const BACKEND_URL = backendUrl;

export async function POST(request: NextRequest) {
    console.log("Analyzing with backend:", BACKEND_URL);
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const drugsJson = formData.get("drugs") as string | null;

        if (!file) {
            return NextResponse.json({ detail: "No VCF file provided." }, { status: 400 });
        }

        if (!drugsJson) {
            return NextResponse.json({ detail: "No drugs selected." }, { status: 400 });
        }

        let drugIds: string[];
        try {
            drugIds = JSON.parse(drugsJson);
        } catch {
            return NextResponse.json({ detail: "Invalid drug list format." }, { status: 400 });
        }

        // 1. Parse VCF via Python backend
        const vcfFormData = new FormData();
        vcfFormData.append("file", file);

        const parseRes = await fetch(`${BACKEND_URL}/parse-vcf`, {
            method: "POST",
            body: vcfFormData,
        });

        if (!parseRes.ok) {
            const errorText = await parseRes.text();
            console.error("VCF Parsing Error Status:", parseRes.status);
            console.error("VCF Parsing Error Body:", errorText);

            let errorDetail = "VCF parsing failed";
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.detail) {
                    // key "detail" can be string or array (FastAPI validation error)
                    errorDetail = typeof errorJson.detail === 'string'
                        ? errorJson.detail
                        : JSON.stringify(errorJson.detail);
                }
            } catch (e) {
                // ignore json parse error
            }

            return NextResponse.json({ detail: errorDetail }, { status: parseRes.status });
        }

        const parseData = await parseRes.json();

        // 2. Run pharmacogenomic analysis via Python backend (returns required schema)
        const analyzeRes = await fetch(`${BACKEND_URL}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                variants: parseData.variants,
                drug_names: drugIds,
            }),
        });

        if (!analyzeRes.ok) {
            const err = await analyzeRes.json().catch(() => ({ detail: "Analysis failed" }));
            return NextResponse.json({ detail: err.detail || "Analysis failed" }, { status: analyzeRes.status });
        }

        const analyzeData = await analyzeRes.json();

        // 3. Enhance results with LLM explanations (in parallel)
        const enhancedResults: PharmaGuardResult[] = await Promise.all(
            analyzeData.results.map(async (result: PharmaGuardResult) => {
                const llmExplanation = await generateLLMExplanation(result);
                return {
                    ...result,
                    llm_generated_explanation: llmExplanation,
                };
            })
        );

        return NextResponse.json({
            results: enhancedResults,
            metadata: analyzeData.metadata,
        });
    } catch (error) {
        console.error("Analysis endpoint error:", error);
        return NextResponse.json(
            { detail: "Internal server error. Make sure the Python backend is running on port 8000." },
            { status: 500 }
        );
    }
}
