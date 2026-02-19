"use client";

import type { PharmaGuardResult } from "@/lib/types";

interface RiskChartProps {
    results: PharmaGuardResult[];
}

const SEVERITY_COLORS: Record<string, string> = {
    none: "#22c55e",
    low: "#84cc16",
    moderate: "#f59e0b",
    high: "#ef4444",
    critical: "#dc2626",
};

const RISK_LABEL_COLORS: Record<string, string> = {
    "Safe": "#22c55e",
    "Adjust Dosage": "#f59e0b",
    "Toxic": "#ef4444",
    "Ineffective": "#a855f7",
    "Critical Risk": "#dc2626",
};

export default function RiskChart({ results }: RiskChartProps) {
    // Compute distribution counts
    const severityCounts: Record<string, number> = {};
    const labelCounts: Record<string, number> = {};
    const confidenceData: { drug: string; confidence: number; severity: string }[] = [];

    results.forEach((r) => {
        const sev = r.risk_assessment.severity;
        severityCounts[sev] = (severityCounts[sev] || 0) + 1;

        const label = r.risk_assessment.risk_label;
        labelCounts[label] = (labelCounts[label] || 0) + 1;

        confidenceData.push({
            drug: r.drug,
            confidence: r.risk_assessment.confidence_score,
            severity: sev,
        });
    });

    const maxCount = Math.max(...Object.values(severityCounts), 1);

    return (
        <div className="chart-container" id="risk-charts">
            {/* Risk Severity Distribution Bar Chart */}
            <div className="chart-card glass-card">
                <h3>Risk Severity Distribution</h3>
                <div className="bar-chart">
                    {Object.entries(severityCounts).map(([severity, count]) => (
                        <div key={severity} className="bar-item">
                            <div className="bar-label">{severity}</div>
                            <div className="bar-track">
                                <div
                                    className="bar-fill"
                                    style={{
                                        width: `${(count / maxCount) * 100}%`,
                                        backgroundColor: SEVERITY_COLORS[severity] || "#6366f1",
                                    }}
                                >
                                    <span className="bar-value">{count}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Risk Label Pie-like Summary */}
            <div className="chart-card glass-card">
                <h3>Risk Label Summary</h3>
                <div className="pie-summary">
                    {Object.entries(labelCounts).map(([label, count]) => {
                        const pct = ((count / results.length) * 100).toFixed(0);
                        return (
                            <div key={label} className="pie-item">
                                <div
                                    className="pie-dot"
                                    style={{ backgroundColor: RISK_LABEL_COLORS[label] || "#6366f1" }}
                                />
                                <div className="pie-info">
                                    <span className="pie-label">{label}</span>
                                    <span className="pie-count">{count} drug{count !== 1 ? "s" : ""} ({pct}%)</span>
                                </div>
                                <div
                                    className="pie-bar"
                                    style={{
                                        width: `${pct}%`,
                                        backgroundColor: RISK_LABEL_COLORS[label] || "#6366f1",
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Per-Drug Confidence Scores */}
            <div className="chart-card glass-card">
                <h3>Per-Drug Analysis Confidence</h3>
                <div className="confidence-chart">
                    {confidenceData.map((d, i) => (
                        <div key={i} className="confidence-row">
                            <div className="confidence-drug">{d.drug}</div>
                            <div className="confidence-bar-track">
                                <div
                                    className="confidence-bar-fill"
                                    style={{
                                        width: `${d.confidence * 100}%`,
                                        backgroundColor: SEVERITY_COLORS[d.severity] || "#6366f1",
                                    }}
                                />
                            </div>
                            <div className="confidence-pct">{(d.confidence * 100).toFixed(0)}%</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gene Coverage Overview */}
            <div className="chart-card glass-card">
                <h3>Pharmacogenomic Overview</h3>
                <div className="overview-grid">
                    <div className="overview-stat">
                        <div className="stat-value">{results.length}</div>
                        <div className="stat-label">Drugs Analyzed</div>
                    </div>
                    <div className="overview-stat">
                        <div className="stat-value">
                            {results.filter(r => r.risk_assessment.severity !== "none").length}
                        </div>
                        <div className="stat-label">Actionable Findings</div>
                    </div>
                    <div className="overview-stat">
                        <div className="stat-value">
                            {new Set(results.map(r => r.pharmacogenomic_profile.primary_gene)).size}
                        </div>
                        <div className="stat-label">Unique Genes</div>
                    </div>
                    <div className="overview-stat">
                        <div className="stat-value">
                            {results.reduce((sum, r) => sum + r.pharmacogenomic_profile.detected_variants.length, 0)}
                        </div>
                        <div className="stat-label">Detected Variants</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
