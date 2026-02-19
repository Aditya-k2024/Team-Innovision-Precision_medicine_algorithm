"use client";

import type { PharmaGuardResult } from "@/lib/types";

interface RadarChartProps {
    results: PharmaGuardResult[];
}

const SEVERITY_SCORE: Record<string, number> = {
    none: 0.1,
    low: 0.35,
    moderate: 0.6,
    high: 0.8,
    critical: 1.0,
};

export default function RadarChart({ results }: RadarChartProps) {
    if (results.length < 2) {
        return (
            <div className="radar-empty">
                <p>Radar chart requires at least 2 drugs to compare.</p>
            </div>
        );
    }

    const cx = 200;
    const cy = 200;
    const maxR = 150;
    const n = results.length;
    const angleStep = (2 * Math.PI) / n;

    // Build data points
    const points = results.map((r, i) => {
        const score = SEVERITY_SCORE[r.risk_assessment.severity] ?? 0.1;
        const confidence = r.risk_assessment.confidence_score;
        const angle = i * angleStep - Math.PI / 2;
        return {
            drug: r.drug,
            score,
            confidence,
            angle,
            x: cx + Math.cos(angle) * score * maxR,
            y: cy + Math.sin(angle) * score * maxR,
            confX: cx + Math.cos(angle) * confidence * maxR,
            confY: cy + Math.sin(angle) * confidence * maxR,
            labelX: cx + Math.cos(angle) * (maxR + 30),
            labelY: cy + Math.sin(angle) * (maxR + 30),
        };
    });

    // Concentric rings
    const rings = [0.25, 0.5, 0.75, 1.0];

    // Polygon paths
    const riskPath = points.map((p) => `${p.x},${p.y}`).join(" ");
    const confPath = points.map((p) => `${p.confX},${p.confY}`).join(" ");

    return (
        <div className="radar-chart-container">
            <h3 className="radar-title">Multi-Drug Risk Comparison</h3>
            <svg
                viewBox="0 0 400 400"
                className="radar-svg"
                role="img"
                aria-label="Radar chart comparing drug risk scores"
            >
                {/* Grid rings */}
                {rings.map((r) => (
                    <circle
                        key={r}
                        cx={cx}
                        cy={cy}
                        r={r * maxR}
                        fill="none"
                        stroke="var(--border-subtle)"
                        strokeWidth="0.5"
                        strokeDasharray="3,3"
                    />
                ))}

                {/* Axis lines */}
                {points.map((p, i) => (
                    <line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={cx + Math.cos(p.angle) * maxR}
                        y2={cy + Math.sin(p.angle) * maxR}
                        stroke="var(--border-subtle)"
                        strokeWidth="0.5"
                    />
                ))}

                {/* Confidence polygon */}
                <polygon
                    points={confPath}
                    fill="rgba(34, 211, 238, 0.1)"
                    stroke="var(--accent-cyan)"
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                />

                {/* Risk polygon */}
                <polygon
                    points={riskPath}
                    fill="rgba(99, 102, 241, 0.15)"
                    stroke="var(--accent-indigo)"
                    strokeWidth="2"
                />

                {/* Data points on risk polygon */}
                {points.map((p, i) => {
                    const color = p.score >= 0.8
                        ? "var(--risk-critical)"
                        : p.score >= 0.6
                            ? "var(--risk-high)"
                            : p.score >= 0.35
                                ? "var(--risk-moderate)"
                                : "var(--risk-normal)";
                    return (
                        <g key={i}>
                            <circle cx={p.x} cy={p.y} r={5} fill={color} stroke="var(--bg-primary)" strokeWidth="2" />
                            <text
                                x={p.labelX}
                                y={p.labelY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="var(--text-secondary)"
                                fontSize="10"
                                fontFamily="var(--font-body)"
                                fontWeight="500"
                            >
                                {p.drug.length > 12 ? p.drug.slice(0, 10) + "…" : p.drug}
                            </text>
                        </g>
                    );
                })}

                {/* Ring labels */}
                {rings.map((r) => (
                    <text
                        key={r}
                        x={cx + 4}
                        y={cy - r * maxR + 4}
                        fontSize="8"
                        fill="var(--text-muted)"
                        fontFamily="var(--font-mono)"
                    >
                        {(r * 100).toFixed(0)}%
                    </text>
                ))}
            </svg>

            {/* Legend */}
            <div className="radar-legend">
                <div className="radar-legend-item">
                    <span className="radar-legend-swatch" style={{ background: "var(--accent-indigo)" }} />
                    Risk Score
                </div>
                <div className="radar-legend-item">
                    <span className="radar-legend-swatch" style={{ background: "var(--accent-cyan)", opacity: 0.6 }} />
                    Confidence
                </div>
            </div>
        </div>
    );
}
