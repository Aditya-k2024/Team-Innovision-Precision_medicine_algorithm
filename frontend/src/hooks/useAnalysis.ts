"use client";

import { useCallback, useState } from "react";
import type { AnalyzeResponse } from "@/lib/types";

export type AnalysisStage = "idle" | "parsing" | "analyzing" | "llm" | "complete" | "error";

interface UseAnalysisReturn {
    loading: boolean;
    stage: AnalysisStage;
    stageMessage: string;
    error: string | null;
    results: AnalyzeResponse | null;
    analyze: (file: File, drugIds: string[]) => Promise<void>;
    reset: () => void;
}

const STAGE_MESSAGES: Record<AnalysisStage, string> = {
    idle: "",
    parsing: "Parsing VCF file and extracting variants…",
    analyzing: "Running pharmacogenomic risk analysis…",
    llm: "Generating AI clinical insights with Groq…",
    complete: "Analysis complete!",
    error: "An error occurred during analysis.",
};

export function useAnalysis(): UseAnalysisReturn {
    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState<AnalysisStage>("idle");
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<AnalyzeResponse | null>(null);

    const analyze = useCallback(async (file: File, drugIds: string[]) => {
        setLoading(true);
        setError(null);
        setResults(null);

        try {
            // Stage 1: Parsing
            setStage("parsing");
            await delay(400); // Short delay to show the stage

            // Stage 2: Analyzing
            setStage("analyzing");

            const formData = new FormData();
            formData.append("file", file);
            formData.append("drugs", JSON.stringify(drugIds));

            const res = await fetch("/api/analyze", {
                method: "POST",
                body: formData,
            });

            // Stage 3: LLM
            setStage("llm");

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({ detail: res.statusText }));
                throw new Error(errBody.detail || `Analysis failed (${res.status})`);
            }

            const data: AnalyzeResponse = await res.json();

            // Stage 4: Complete
            setStage("complete");
            setResults(data);
        } catch (err) {
            setStage("error");
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setResults(null);
        setError(null);
        setStage("idle");
    }, []);

    return {
        loading,
        stage,
        stageMessage: STAGE_MESSAGES[stage],
        error,
        results,
        analyze,
        reset,
    };
}

function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}
