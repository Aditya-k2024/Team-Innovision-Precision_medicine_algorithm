"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import DrugSelector from "@/components/DrugSelector";
import ResultsPanel from "@/components/ResultsPanel";
import DnaBackground from "@/components/DnaBackground";
import SkeletonLoader from "@/components/SkeletonLoader";
import GuidedTour from "@/components/GuidedTour";
import DrugInteractionPanel from "@/components/DrugInteractionPanel";
import GeneMap from "@/components/GeneMap";
import RadarChart from "@/components/RadarChart";
import PathwayDiagram from "@/components/PathwayDiagram";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePdfReport } from "@/hooks/usePdfReport";
import { useToast } from "@/components/ToastProvider";
import { useTheme } from "@/components/ThemeProvider";
import type { DrugInfo } from "@/lib/types";

const FALLBACK_DRUGS: DrugInfo[] = [
  { id: "warfarin", name: "Warfarin", category: "Anticoagulant" },
  { id: "clopidogrel", name: "Clopidogrel", category: "Antiplatelet" },
  { id: "codeine", name: "Codeine", category: "Opioid Analgesic" },
  { id: "simvastatin", name: "Simvastatin", category: "Statin" },
  { id: "fluorouracil", name: "Fluorouracil (5-FU)", category: "Antineoplastic" },
  { id: "azathioprine", name: "Azathioprine", category: "Immunosuppressant" },
  { id: "irinotecan", name: "Irinotecan", category: "Antineoplastic" },
  { id: "tacrolimus", name: "Tacrolimus", category: "Immunosuppressant" },
  { id: "abacavir", name: "Abacavir", category: "Antiretroviral" },
  { id: "carbamazepine", name: "Carbamazepine", category: "Anticonvulsant" },
];

const STAGE_ICONS: Record<string, string> = {
  parsing: "📂",
  analyzing: "🔬",
  llm: "🤖",
  complete: "✅",
  error: "❌",
};

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [drugs, setDrugs] = useState<DrugInfo[]>(FALLBACK_DRUGS);
  const { loading, stage, stageMessage, error, results, analyze } = useAnalysis();
  const { generateReport } = usePdfReport();
  const { addToast } = useToast();
  const { toggleTheme } = useTheme();

  // Try to fetch drug list from backend
  useEffect(() => {
    fetch("/api/drugs")
      .then((r) => r.json())
      .then((data) => {
        if (data.drugs?.length) setDrugs(data.drugs);
      })
      .catch(() => {
        // Use fallback drugs
      });
  }, []);

  const canAnalyze = file && selectedDrugs.length > 0 && !loading;

  const handleAnalyze = async () => {
    if (!file || selectedDrugs.length === 0) return;
    addToast("Starting analysis…", "info");
    await analyze(file, selectedDrugs);
  };

  const handleDownloadJson = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharmaguard-results-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("JSON downloaded!", "success");
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUpload: () => document.getElementById("vcf-upload-zone")?.click(),
    onAnalyze: () => {
      if (canAnalyze) handleAnalyze();
    },
    onDownload: handleDownloadJson,
    onToggleTheme: toggleTheme,
  });

  // Shortcut hints text
  const shortcutHints = useMemo(
    () => [
      { keys: "Ctrl+U", action: "Upload" },
      { keys: "Ctrl+Enter", action: "Analyze" },
      { keys: "Ctrl+D", action: "Download" },
      { keys: "Ctrl+T", action: "Theme" },
    ],
    []
  );

  return (
    <>
      <DnaBackground />
      <Header />
      <GuidedTour />

      <main className="container">
        {/* Hero */}
        <section className="hero">
          <h1>Precision Medicine,<br />Powered by Genomics</h1>
          <p>
            Upload a VCF file and select medications to receive personalized
            pharmacogenomic risk predictions backed by CPIC guidelines and
            AI-generated clinical insights.
          </p>
        </section>

        {/* Upload + Drug Selection */}
        <section>
          <FileUpload onFileSelect={setFile} selectedFile={file} />
          <DrugSelector
            drugs={drugs}
            selectedDrugs={selectedDrugs}
            onSelectionChange={setSelectedDrugs}
          />

          <div style={{ textAlign: "center" }}>
            <button
              className="analyze-btn"
              disabled={!canAnalyze}
              onClick={handleAnalyze}
              id="analyze-btn"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Analyzing...
                </>
              ) : (
                <>🔬 Analyze Pharmacogenomic Risk</>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="error-box" id="error-box">
              ⚠️ {error}
            </div>
          )}
        </section>

        {/* Loading with progress stages */}
        {loading && (
          <div className="loading-section">
            <div className="progress-stages">
              {(["parsing", "analyzing", "llm"] as const).map((s) => {
                const isActive = s === stage;
                const isDone =
                  (s === "parsing" && (stage === "analyzing" || stage === "llm" || stage === "complete")) ||
                  (s === "analyzing" && (stage === "llm" || stage === "complete")) ||
                  (s === "llm" && stage === "complete");

                return (
                  <div key={s} className={`progress-stage ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
                    <span className="progress-stage-icon">
                      {isDone ? "✅" : isActive ? STAGE_ICONS[s] : "⏳"}
                    </span>
                    <span className="progress-stage-label">
                      {s === "parsing" ? "Parse VCF" : s === "analyzing" ? "Analyze Risk" : "AI Insights"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="loading-text">{stageMessage}</p>
            <SkeletonLoader />
          </div>
        )}

        {/* Results */}
        {results && (
          <>
            {/* Drug Interaction Warnings */}
            <DrugInteractionPanel results={results.results} />

            {/* Main Results Panel */}
            <ResultsPanel data={results} />

            {/* Advanced Visualizations */}
            <section className="advanced-viz-section">
              <h2 className="viz-section-title">Advanced Visualizations</h2>

              {/* Radar Chart */}
              <div className="viz-card">
                <RadarChart results={results.results} />
              </div>

              {/* Gene Map */}
              <div className="viz-card">
                <GeneMap results={results.results} />
              </div>

              {/* Pathway Diagrams */}
              <div className="viz-card">
                <h3 className="viz-card-title">Drug Metabolism Pathways</h3>
                {results.results.map((r, i) => (
                  <div key={i} className="pathway-wrapper">
                    <PathwayDiagram result={r} />
                  </div>
                ))}
              </div>
            </section>

            {/* PDF Report Button */}
            <div style={{ textAlign: "center", marginTop: "var(--space-xl)" }}>
              <button
                className="analyze-btn secondary"
                onClick={() => generateReport(results)}
                id="pdf-report-btn"
              >
                📄 Generate PDF Report
              </button>
            </div>
          </>
        )}

        {/* Keyboard Shortcuts Hint */}
        <div className="shortcut-hints">
          {shortcutHints.map((s) => (
            <span key={s.keys} className="shortcut-hint">
              <kbd>{s.keys}</kbd> {s.action}
            </span>
          ))}
        </div>

        <div className="section-divider" />
      </main>

      <footer className="footer">
        <p>PharmaGuard — Pharmacogenomic Risk Prediction System</p>
        <p style={{ marginTop: 4 }}>
          Built with Next.js, FastAPI, and Groq AI · CPIC Evidence-Based
        </p>
      </footer>
    </>
  );
}
