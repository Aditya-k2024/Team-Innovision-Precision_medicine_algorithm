"use client";

import type { PharmaGuardResult } from "@/lib/types";

interface PathwayDiagramProps {
    result: PharmaGuardResult;
}

export default function PathwayDiagram({ result }: PathwayDiagramProps) {
    const gene = result.pharmacogenomic_profile.primary_gene;
    const phenotype = result.pharmacogenomic_profile.phenotype;
    const severity = result.risk_assessment.severity;

    const enzymeColor =
        severity === "critical"
            ? "var(--risk-critical)"
            : severity === "high"
                ? "var(--risk-high)"
                : severity === "moderate"
                    ? "var(--risk-moderate)"
                    : "var(--risk-normal)";

    const enzymeActivity =
        phenotype === "PM"
            ? "No Activity"
            : phenotype === "IM"
                ? "Reduced"
                : phenotype === "NM"
                    ? "Normal"
                    : phenotype === "RM" || phenotype === "URM"
                        ? "Increased"
                        : "Unknown";

    return (
        <div className="pathway-container">
            <svg viewBox="0 0 700 160" className="pathway-svg" role="img" aria-label={`Drug metabolism pathway for ${result.drug}`}>
                {/* ── Drug Node ───────────────────────── */}
                <rect x={20} y={50} width={120} height={60} rx={12} fill="var(--accent-indigo)" opacity="0.2" stroke="var(--accent-indigo)" strokeWidth="1.5" />
                <text x={80} y={73} textAnchor="middle" fill="var(--accent-indigo)" fontSize="10" fontFamily="var(--font-body)" fontWeight="600">
                    DRUG
                </text>
                <text x={80} y={90} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontFamily="var(--font-body)" fontWeight="700">
                    {result.drug.length > 14 ? result.drug.slice(0, 12) + "…" : result.drug}
                </text>

                {/* ── Arrow 1 ──────────────────────────── */}
                <line x1={140} y1={80} x2={195} y2={80} stroke="var(--text-muted)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

                {/* ── Enzyme Node (highlighted) ──── */}
                <rect x={200} y={40} width={140} height={80} rx={14} fill={enzymeColor} opacity="0.12" stroke={enzymeColor} strokeWidth="2" />
                <text x={270} y={62} textAnchor="middle" fill={enzymeColor} fontSize="9" fontFamily="var(--font-body)" fontWeight="600">
                    ENZYME
                </text>
                <text x={270} y={80} textAnchor="middle" fill="var(--text-primary)" fontSize="13" fontFamily="var(--font-mono)" fontWeight="700">
                    {gene}
                </text>
                <text x={270} y={100} textAnchor="middle" fill={enzymeColor} fontSize="9" fontFamily="var(--font-body)" fontWeight="500">
                    Activity: {enzymeActivity}
                </text>

                {/* Phenotype badge */}
                <rect x={248} y={105} width={44} height={16} rx={8} fill={enzymeColor} opacity="0.25" />
                <text x={270} y={116} textAnchor="middle" fill={enzymeColor} fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">
                    {phenotype}
                </text>

                {/* ── Arrow 2 ──────────────────────────── */}
                <line x1={340} y1={80} x2={395} y2={80} stroke="var(--text-muted)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

                {/* ── Metabolite Node ───────────────── */}
                <rect x={400} y={50} width={120} height={60} rx={12} fill="var(--accent-cyan)" opacity="0.15" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <text x={460} y={73} textAnchor="middle" fill="var(--accent-cyan)" fontSize="10" fontFamily="var(--font-body)" fontWeight="600">
                    METABOLITE
                </text>
                <text x={460} y={90} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontFamily="var(--font-body)" fontWeight="500">
                    {phenotype === "PM" ? "⬇ Reduced" : phenotype === "URM" ? "⬆ Excess" : "→ Normal"}
                </text>

                {/* ── Arrow 3 ──────────────────────────── */}
                <line x1={520} y1={80} x2={575} y2={80} stroke="var(--text-muted)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

                {/* ── Clinical Effect Node ─────────── */}
                <rect x={580} y={50} width={100} height={60} rx={12} fill={enzymeColor} opacity="0.15" stroke={enzymeColor} strokeWidth="1.5" />
                <text x={630} y={73} textAnchor="middle" fill={enzymeColor} fontSize="10" fontFamily="var(--font-body)" fontWeight="600">
                    EFFECT
                </text>
                <text x={630} y={90} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontFamily="var(--font-body)" fontWeight="500">
                    {result.risk_assessment.risk_label}
                </text>

                {/* Arrow marker definition */}
                <defs>
                    <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)" />
                    </marker>
                </defs>
            </svg>
        </div>
    );
}
