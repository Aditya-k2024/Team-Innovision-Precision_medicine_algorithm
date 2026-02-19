"use client";

import { useMemo, useState } from "react";
import type { AnalyzeResponse, PharmaGuardResult } from "@/lib/types";
import RiskBadge from "./RiskBadge";
import RiskChart from "./RiskChart";
import JsonViewer from "./JsonViewer";
import { useToast } from "./ToastProvider";

interface ResultsPanelProps {
    data: AnalyzeResponse;
}

type SortKey = "drug" | "confidence" | "risk";
type SeverityFilter = "all" | "none" | "low" | "moderate" | "high" | "critical";

const SEVERITY_ORDER: Record<string, number> = {
    none: 0,
    low: 1,
    moderate: 2,
    high: 3,
    critical: 4,
};

function severityToRiskLevel(severity: string) {
    switch (severity) {
        case "critical": return "CRITICAL" as const;
        case "high": return "HIGH" as const;
        case "moderate": return "MODERATE" as const;
        default: return "NORMAL" as const;
    }
}

export default function ResultsPanel({ data }: ResultsPanelProps) {
    const [activeTab, setActiveTab] = useState<"cards" | "json" | "chart">("cards");
    const [sortKey, setSortKey] = useState<SortKey>("risk");
    const [filterSeverity, setFilterSeverity] = useState<SeverityFilter>("all");
    const { addToast } = useToast();

    const filteredAndSorted = useMemo(() => {
        let items = [...data.results];

        // Filter
        if (filterSeverity !== "all") {
            items = items.filter((r) => r.risk_assessment.severity === filterSeverity);
        }

        // Sort
        items.sort((a, b) => {
            switch (sortKey) {
                case "drug":
                    return a.drug.localeCompare(b.drug);
                case "confidence":
                    return b.risk_assessment.confidence_score - a.risk_assessment.confidence_score;
                case "risk":
                    return (
                        (SEVERITY_ORDER[b.risk_assessment.severity] ?? 0) -
                        (SEVERITY_ORDER[a.risk_assessment.severity] ?? 0)
                    );
                default:
                    return 0;
            }
        });

        return items;
    }, [data.results, sortKey, filterSeverity]);

    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pharmaguard-results-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast("JSON downloaded successfully!", "success");
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            addToast("JSON copied to clipboard!", "success");
        } catch {
            const ta = document.createElement("textarea");
            ta.value = JSON.stringify(data, null, 2);
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            addToast("JSON copied to clipboard!", "success");
        }
    };

    const severityCounts = useMemo(() => {
        const counts: Record<string, number> = { none: 0, low: 0, moderate: 0, high: 0, critical: 0 };
        data.results.forEach((r) => {
            const s = r.risk_assessment.severity;
            if (s in counts) counts[s]++;
        });
        return counts;
    }, [data.results]);

    return (
        <section className="results-section" id="results-section">
            <div className="results-header">
                <h2>Analysis Results</h2>
                <span className="results-meta">
                    {data.metadata.variant_count} variants · {data.metadata.drug_count} drugs · {new Date(data.metadata.timestamp).toLocaleTimeString()}
                </span>
            </div>

            <div className="results-toolbar">
                <div className="results-tabs">
                    <button className={`tab-btn ${activeTab === "cards" ? "active" : ""}`} onClick={() => setActiveTab("cards")} id="tab-cards">
                        📋 Risk Cards
                    </button>
                    <button className={`tab-btn ${activeTab === "json" ? "active" : ""}`} onClick={() => setActiveTab("json")} id="tab-json">
                        {"{ }"} JSON
                    </button>
                    <button className={`tab-btn ${activeTab === "chart" ? "active" : ""}`} onClick={() => setActiveTab("chart")} id="tab-chart">
                        📊 Charts
                    </button>
                </div>
                <div className="results-actions">
                    <button className="action-btn" onClick={handleCopy} id="copy-json-btn">
                        📋 Copy
                    </button>
                    <button className="action-btn primary" onClick={handleDownload} id="download-json-btn">
                        ⬇️ Download
                    </button>
                </div>
            </div>

            {/* Filter/Sort bar — visible on Cards tab */}
            {activeTab === "cards" && (
                <div className="filter-sort-bar">
                    <div className="filter-group">
                        <span className="filter-label">Filter:</span>
                        <button
                            className={`filter-chip ${filterSeverity === "all" ? "active" : ""}`}
                            onClick={() => setFilterSeverity("all")}
                        >
                            All ({data.results.length})
                        </button>
                        {(["critical", "high", "moderate", "none"] as const).map((sev) =>
                            severityCounts[sev] > 0 ? (
                                <button
                                    key={sev}
                                    className={`filter-chip filter-${sev} ${filterSeverity === sev ? "active" : ""}`}
                                    onClick={() => setFilterSeverity(sev === filterSeverity ? "all" : sev)}
                                >
                                    {sev === "none" ? "Normal" : sev.charAt(0).toUpperCase() + sev.slice(1)} ({severityCounts[sev]})
                                </button>
                            ) : null
                        )}
                    </div>
                    <div className="sort-group">
                        <span className="filter-label">Sort:</span>
                        <select
                            className="sort-select"
                            value={sortKey}
                            onChange={(e) => setSortKey(e.target.value as SortKey)}
                        >
                            <option value="risk">Risk Level</option>
                            <option value="confidence">Confidence</option>
                            <option value="drug">Drug Name</option>
                        </select>
                    </div>
                </div>
            )}

            {activeTab === "cards" && (
                <div className="results-grid">
                    {filteredAndSorted.length === 0 ? (
                        <div className="no-results">No results match the selected filter.</div>
                    ) : (
                        filteredAndSorted.map((result, idx) => (
                            <ResultCard key={idx} result={result} index={idx} />
                        ))
                    )}
                </div>
            )}
            {activeTab === "json" && <JsonViewer data={data} />}
            {activeTab === "chart" && <RiskChart results={data.results} />}
        </section>
    );
}


/* ═══════════════════════════════════════════════════════════════════
   ResultCard — Matches the reference design
   ═══════════════════════════════════════════════════════════════════ */

function ResultCard({ result, index }: { result: PharmaGuardResult; index: number }) {
    const [openSections, setOpenSections] = useState<Set<string>>(new Set(["ai"]));
    const riskLevel = severityToRiskLevel(result.risk_assessment.severity);
    const riskClass = `risk-${riskLevel.toLowerCase()}`;

    const toggleSection = (key: string) => {
        setOpenSections((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const variants = result.pharmacogenomic_profile.detected_variants;
    const llm = result.llm_generated_explanation;

    return (
        <div className={`result-card ${riskClass}`} id={`risk-card-${index}`}>
            {/* ── Drug Header ─────────────────────────────────────── */}
            <div className="rc-header">
                <div className="rc-drug-row">
                    <span className="rc-drug-name">{result.drug}</span>
                    <RiskBadge level={riskLevel} />
                    <span className="risk-label-tag">{result.risk_assessment.risk_label}</span>
                </div>
            </div>

            {/* ── Highlighted Top Bar ── */}
            <div className="rc-topbar">
                <div className="rc-topbar-cell">
                    <span className="rc-topbar-label">GENE</span>
                    <span className="rc-topbar-value highlight-gene">
                        {result.pharmacogenomic_profile.primary_gene}
                    </span>
                </div>
                <div className="rc-topbar-cell">
                    <span className="rc-topbar-label">DIPLOTYPE</span>
                    <span className="rc-topbar-value highlight-diplotype">
                        {result.pharmacogenomic_profile.diplotype}
                    </span>
                </div>
                <div className="rc-topbar-cell">
                    <span className="rc-topbar-label">PHENOTYPE</span>
                    <span className="rc-topbar-value highlight-phenotype">
                        {result.pharmacogenomic_profile.phenotype}
                    </span>
                </div>
                <div className="rc-topbar-cell">
                    <span className="rc-topbar-label">CONFIDENCE</span>
                    <span className="rc-topbar-value highlight-confidence">
                        {(result.risk_assessment.confidence_score * 100).toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* ── AI Clinical Summary ────────────────────────────── */}
            {llm && (
                <div className="rc-ai-summary">
                    <div className="rc-ai-summary-label">AI CLINICAL SUMMARY</div>
                    <p className="rc-ai-summary-text">{llm.summary}</p>
                </div>
            )}

            {/* ── Clinical Recommendation (collapsible) ──────────── */}
            <CollapsibleSection
                title="CLINICAL RECOMMENDATION"
                isOpen={openSections.has("rec")}
                onToggle={() => toggleSection("rec")}
            >
                <div className="rc-rec-content">
                    <div className="rc-rec-action">
                        <span className="rc-rec-action-label">RECOMMENDED ACTION</span>
                        <p>{result.clinical_recommendation.action}</p>
                    </div>
                    <div className="rc-rec-pills">
                        <div className="rc-rec-pill dosage">
                            <span className="rc-rec-pill-label">DOSE ADJUSTMENT</span>
                            <span className="rc-rec-pill-value">
                                {result.clinical_recommendation.dosage_adjustment || "Standard dosing"}
                            </span>
                        </div>
                        <div className="rc-rec-pill monitoring">
                            <span className="rc-rec-pill-label">MONITORING</span>
                            <span className="rc-rec-pill-value">
                                {result.clinical_recommendation.monitoring || "Routine monitoring"}
                            </span>
                        </div>
                        <div className="rc-rec-pill alternatives">
                            <span className="rc-rec-pill-label">ALTERNATIVES</span>
                            <span className="rc-rec-pill-value">
                                {result.clinical_recommendation.alternative_drugs.length > 0
                                    ? result.clinical_recommendation.alternative_drugs.join(", ")
                                    : "—"}
                            </span>
                        </div>
                    </div>
                    {result.clinical_recommendation.evidence_sources.length > 0 && (
                        <div className="rc-evidence">
                            {result.clinical_recommendation.evidence_sources.map((src, i) => (
                                <span key={i} className="evidence-tag">{src}</span>
                            ))}
                        </div>
                    )}
                </div>
            </CollapsibleSection>

            {/* ── Biological Mechanism (collapsible) ─────────────── */}
            {llm && (
                <CollapsibleSection
                    title="BIOLOGICAL MECHANISM"
                    isOpen={openSections.has("bio")}
                    onToggle={() => toggleSection("bio")}
                >
                    <p className="rc-section-text">{llm.biological_mechanism}</p>
                    <p className="rc-section-text" style={{ marginTop: "var(--space-sm)" }}>
                        <strong>Clinical Significance:</strong> {llm.clinical_significance}
                    </p>
                    {llm.variant_citations.length > 0 && (
                        <div className="rc-evidence" style={{ marginTop: "var(--space-sm)" }}>
                            {llm.variant_citations.map((c, i) => (
                                <span key={i} className="evidence-tag">{c}</span>
                            ))}
                        </div>
                    )}
                </CollapsibleSection>
            )}

            {/* ── Detected Variants (collapsible) ────────────────── */}
            <CollapsibleSection
                title={`DETECTED VARIANTS (${variants.length})`}
                isOpen={openSections.has("vars")}
                onToggle={() => toggleSection("vars")}
            >
                {variants.length > 0 ? (
                    <div className="rc-variants-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>RSID</th>
                                    <th>Gene</th>
                                    <th>Star Allele</th>
                                    <th>Effect</th>
                                    <th>Position</th>
                                    <th>Genotype</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variants.map((v, i) => (
                                    <tr key={i}>
                                        <td className="highlight-rsid">{v.rsid}</td>
                                        <td>{v.gene}</td>
                                        <td>{result.pharmacogenomic_profile.diplotype}</td>
                                        <td>{v.allele_change || "—"}</td>
                                        <td>chr:{v.genotype || "—"}</td>
                                        <td style={{ fontFamily: "var(--font-mono)" }}>{v.genotype || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="rc-section-text" style={{ color: "var(--text-muted)" }}>
                        No pharmacogenomic variants detected for this drug.
                    </p>
                )}
            </CollapsibleSection>

            {/* ── Quality Metrics Row ────────────────────────────── */}
            <div className="rc-quality-row">
                <span className="rc-quality-item">
                    VCF: {result.quality_metrics.vcf_parsing_success ? "✅" : "❌"}
                </span>
                <span className="rc-quality-item">
                    Parsed: {result.quality_metrics.total_variants_parsed}
                </span>
                <span className="rc-quality-item">
                    PGx: {result.quality_metrics.pharmacogenomic_variants_found}
                </span>
                <span className="rc-quality-item">
                    Coverage: {(result.quality_metrics.gene_coverage * 100).toFixed(0)}%
                </span>
            </div>
        </div>
    );
}


function CollapsibleSection({
    title,
    isOpen,
    onToggle,
    children,
}: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className={`rc-collapsible ${isOpen ? "open" : ""}`}>
            <button className="rc-collapsible-header" onClick={onToggle}>
                <span className="rc-collapsible-title">{title}</span>
                <span className="rc-collapsible-chevron">{isOpen ? "∧" : "∨"}</span>
            </button>
            {isOpen && <div className="rc-collapsible-body">{children}</div>}
        </div>
    );
}
