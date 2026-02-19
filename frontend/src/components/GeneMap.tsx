"use client";

import type { PharmaGuardResult } from "@/lib/types";

interface GeneMapProps {
    results: PharmaGuardResult[];
}

// Chromosome data: name, relative size (1-based), color
const CHROMOSOMES: { name: string; size: number; color: string }[] = [
    { name: "1", size: 100, color: "#6366f1" },
    { name: "2", size: 97, color: "#818cf8" },
    { name: "3", size: 80, color: "#6366f1" },
    { name: "4", size: 76, color: "#818cf8" },
    { name: "5", size: 73, color: "#6366f1" },
    { name: "6", size: 69, color: "#818cf8" },
    { name: "7", size: 64, color: "#6366f1" },
    { name: "8", size: 59, color: "#818cf8" },
    { name: "9", size: 57, color: "#6366f1" },
    { name: "10", size: 54, color: "#818cf8" },
    { name: "11", size: 55, color: "#6366f1" },
    { name: "12", size: 54, color: "#818cf8" },
    { name: "13", size: 46, color: "#6366f1" },
    { name: "14", size: 43, color: "#818cf8" },
    { name: "15", size: 41, color: "#6366f1" },
    { name: "16", size: 36, color: "#818cf8" },
    { name: "17", size: 33, color: "#6366f1" },
    { name: "18", size: 32, color: "#818cf8" },
    { name: "19", size: 24, color: "#6366f1" },
    { name: "20", size: 26, color: "#818cf8" },
    { name: "21", size: 19, color: "#6366f1" },
    { name: "22", size: 21, color: "#818cf8" },
];

// Known pharmacogenomic gene locations (chromosome, approximate position 0-1)
const GENE_POSITIONS: Record<string, { chr: string; pos: number }> = {
    CYP2D6: { chr: "22", pos: 0.55 },
    CYP2C19: { chr: "10", pos: 0.65 },
    CYP2C9: { chr: "10", pos: 0.64 },
    CYP3A5: { chr: "7", pos: 0.56 },
    CYP1A2: { chr: "15", pos: 0.33 },
    VKORC1: { chr: "16", pos: 0.16 },
    DPYD: { chr: "1", pos: 0.37 },
    TPMT: { chr: "6", pos: 0.33 },
    SLCO1B1: { chr: "12", pos: 0.54 },
    UGT1A1: { chr: "2", pos: 0.73 },
    NUDT15: { chr: "13", pos: 0.47 },
    HLA: { chr: "6", pos: 0.21 },
};

export default function GeneMap({ results }: GeneMapProps) {
    // Extract unique genes detected
    const detectedGenes = new Map<string, { drug: string; severity: string }>();
    results.forEach((r) => {
        const gene = r.pharmacogenomic_profile.primary_gene;
        if (gene && gene !== "Unknown") {
            detectedGenes.set(gene, {
                drug: r.drug,
                severity: r.risk_assessment.severity,
            });
        }
    });

    const svgWidth = 900;
    const svgHeight = 200;
    const chrSpacing = svgWidth / (CHROMOSOMES.length + 1);
    const maxHeight = 120;

    return (
        <div className="gene-map-container">
            <h3 className="gene-map-title">Chromosome Gene Map</h3>
            <p className="gene-map-subtitle">Pharmacogenomic variant locations across the human genome</p>
            <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="gene-map-svg"
                role="img"
                aria-label="Chromosome ideogram with gene locations"
            >
                {CHROMOSOMES.map((chr, i) => {
                    const x = (i + 1) * chrSpacing;
                    const h = (chr.size / 100) * maxHeight;
                    const y = 20;

                    // Find variants on this chromosome
                    const genesOnChr = Array.from(detectedGenes.entries()).filter(
                        ([gene]) => GENE_POSITIONS[gene]?.chr === chr.name
                    );

                    return (
                        <g key={chr.name}>
                            {/* Chromosome body */}
                            <rect
                                x={x - 5}
                                y={y}
                                width={10}
                                height={h}
                                rx={5}
                                fill={genesOnChr.length > 0 ? chr.color : "var(--border-subtle)"}
                                opacity={genesOnChr.length > 0 ? 0.6 : 0.2}
                            />

                            {/* Centromere notch */}
                            <circle
                                cx={x}
                                cy={y + h * 0.4}
                                r={3}
                                fill="var(--bg-primary)"
                                stroke={chr.color}
                                strokeWidth="0.5"
                                opacity="0.3"
                            />

                            {/* Gene markers */}
                            {genesOnChr.map(([gene, data]) => {
                                const genePos = GENE_POSITIONS[gene];
                                const markerY = y + genePos.pos * h;
                                const markerColor =
                                    data.severity === "critical"
                                        ? "var(--risk-critical)"
                                        : data.severity === "high"
                                            ? "var(--risk-high)"
                                            : data.severity === "moderate"
                                                ? "var(--risk-moderate)"
                                                : "var(--risk-normal)";

                                return (
                                    <g key={gene}>
                                        {/* Marker */}
                                        <circle cx={x} cy={markerY} r={4} fill={markerColor} stroke="white" strokeWidth="1" />
                                        {/* Gene label */}
                                        <text
                                            x={x + 10}
                                            y={markerY}
                                            fontSize="7"
                                            fill="var(--text-primary)"
                                            fontFamily="var(--font-mono)"
                                            fontWeight="600"
                                            dominantBaseline="middle"
                                        >
                                            {gene}
                                        </text>
                                        {/* Drug label */}
                                        <text
                                            x={x + 10}
                                            y={markerY + 9}
                                            fontSize="5.5"
                                            fill="var(--text-muted)"
                                            fontFamily="var(--font-body)"
                                            dominantBaseline="middle"
                                        >
                                            {data.drug}
                                        </text>
                                        {/* Glow effect */}
                                        <circle cx={x} cy={markerY} r={7} fill={markerColor} opacity="0.15">
                                            <animate
                                                attributeName="r"
                                                values="7;10;7"
                                                dur="2s"
                                                repeatCount="indefinite"
                                            />
                                            <animate
                                                attributeName="opacity"
                                                values="0.15;0.05;0.15"
                                                dur="2s"
                                                repeatCount="indefinite"
                                            />
                                        </circle>
                                    </g>
                                );
                            })}

                            {/* Chromosome label */}
                            <text
                                x={x}
                                y={y + h + 14}
                                textAnchor="middle"
                                fontSize="7"
                                fill="var(--text-muted)"
                                fontFamily="var(--font-mono)"
                            >
                                {chr.name}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
