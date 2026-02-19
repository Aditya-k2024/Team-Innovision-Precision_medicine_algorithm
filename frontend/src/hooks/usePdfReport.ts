"use client";

import { useCallback } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";

export function usePdfReport() {
    const { addToast } = useToast();

    const generateReport = useCallback(
        (data: AnalyzeResponse) => {
            const win = window.open("", "_blank");
            if (!win) {
                addToast("Pop-up blocked. Please allow pop-ups for this site.", "warning");
                return;
            }

            const html = buildReportHtml(data);
            win.document.write(html);
            win.document.close();

            // Auto-trigger print after a short delay to allow styles to load
            setTimeout(() => {
                win.print();
                addToast("PDF report generated! Use Save as PDF in the print dialog.", "info");
            }, 600);
        },
        [addToast]
    );

    return { generateReport };
}

function buildReportHtml(data: AnalyzeResponse): string {
    const timestamp = new Date(data.metadata.timestamp).toLocaleString();

    const cards = data.results
        .map(
            (r) => `
      <div class="card">
        <div class="card-header">
          <div class="drug-name">${r.drug}</div>
          <div class="risk-badge ${r.risk_assessment.severity}">${r.risk_assessment.risk_label}</div>
        </div>
        <table class="info-table">
          <tr><td class="label">Gene</td><td>${r.pharmacogenomic_profile.primary_gene}</td></tr>
          <tr><td class="label">Diplotype</td><td>${r.pharmacogenomic_profile.diplotype}</td></tr>
          <tr><td class="label">Phenotype</td><td>${r.pharmacogenomic_profile.phenotype}</td></tr>
          <tr><td class="label">Confidence</td><td>${(r.risk_assessment.confidence_score * 100).toFixed(0)}%</td></tr>
        </table>
        ${r.llm_generated_explanation
                    ? `<div class="section">
                <div class="section-title">AI Clinical Summary</div>
                <p>${r.llm_generated_explanation.summary}</p>
              </div>`
                    : ""
                }
        <div class="section">
          <div class="section-title">Clinical Recommendation</div>
          <p><strong>Action:</strong> ${r.clinical_recommendation.action}</p>
          <p><strong>Dosage Adjustment:</strong> ${r.clinical_recommendation.dosage_adjustment || "Standard dosing"}</p>
          <p><strong>Monitoring:</strong> ${r.clinical_recommendation.monitoring || "Routine monitoring"}</p>
          <p><strong>Alternatives:</strong> ${r.clinical_recommendation.alternative_drugs.join(", ") || "—"}</p>
        </div>
        ${r.pharmacogenomic_profile.detected_variants.length > 0
                    ? `<div class="section">
                <div class="section-title">Detected Variants</div>
                <table class="variants-table">
                  <thead><tr><th>RSID</th><th>Gene</th><th>Allele Change</th><th>Genotype</th></tr></thead>
                  <tbody>
                    ${r.pharmacogenomic_profile.detected_variants
                        .map(
                            (v) =>
                                `<tr><td>${v.rsid}</td><td>${v.gene}</td><td>${v.allele_change || "—"}</td><td>${v.genotype || "—"}</td></tr>`
                        )
                        .join("")}
                  </tbody>
                </table>
              </div>`
                    : ""
                }
        <div class="quality-row">
          <span>VCF: ${r.quality_metrics.vcf_parsing_success ? "✅" : "❌"}</span>
          <span>Parsed: ${r.quality_metrics.total_variants_parsed}</span>
          <span>PGx Variants: ${r.quality_metrics.pharmacogenomic_variants_found}</span>
          <span>Coverage: ${(r.quality_metrics.gene_coverage * 100).toFixed(0)}%</span>
        </div>
      </div>
    `
        )
        .join("");

    return `<!DOCTYPE html>
<html>
<head>
  <title>PharmaGuard Report — ${timestamp}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #6366f1; padding-bottom: 16px; }
    .header h1 { color: #6366f1; font-size: 28px; }
    .header .subtitle { color: #64748b; font-size: 12px; margin-top: 4px; }
    .meta { display: flex; gap: 24px; justify-content: center; margin-top: 12px; font-size: 11px; color: #64748b; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; break-inside: avoid; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .drug-name { font-size: 18px; font-weight: 700; }
    .risk-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .risk-badge.none, .risk-badge.low { background: #dcfce7; color: #166534; }
    .risk-badge.moderate { background: #fef3c7; color: #92400e; }
    .risk-badge.high { background: #ffedd5; color: #9a3412; }
    .risk-badge.critical { background: #fee2e2; color: #991b1b; }
    .info-table { width: 100%; margin-bottom: 12px; font-size: 12px; }
    .info-table td { padding: 4px 8px; }
    .info-table .label { font-weight: 600; color: #475569; width: 120px; }
    .section { margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; }
    .section-title { font-size: 11px; font-weight: 600; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .section p { font-size: 12px; line-height: 1.5; margin-bottom: 4px; }
    .variants-table { width: 100%; font-size: 11px; border-collapse: collapse; margin-top: 8px; }
    .variants-table th { background: #f8fafc; text-align: left; padding: 6px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; }
    .variants-table td { padding: 6px; border-bottom: 1px solid #f1f5f9; }
    .quality-row { display: flex; gap: 16px; margin-top: 12px; padding-top: 8px; border-top: 1px solid #f1f5f9; font-size: 10px; color: #64748b; }
    .disclaimer { margin-top: 32px; padding: 16px; background: #fef3c7; border-radius: 8px; font-size: 10px; color: #92400e; text-align: center; }
    @media print { body { padding: 20px; } .card { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧬 PharmaGuard Clinical Report</h1>
    <div class="subtitle">Pharmacogenomic Risk Prediction System</div>
    <div class="meta">
      <span>Patient: ${data.results[0]?.patient_id || "PATIENT_001"}</span>
      <span>Generated: ${timestamp}</span>
      <span>Variants: ${data.metadata.variant_count}</span>
      <span>Drugs: ${data.metadata.drug_count}</span>
    </div>
  </div>
  ${cards}
  <div class="disclaimer">
    ⚠️ This report is generated by an AI-assisted system and is intended for informational purposes only.
    Clinical decisions should be made in consultation with a qualified healthcare professional.
  </div>
</body>
</html>`;
}
