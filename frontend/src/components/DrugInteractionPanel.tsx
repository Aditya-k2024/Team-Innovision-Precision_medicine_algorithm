"use client";

import type { PharmaGuardResult } from "@/lib/types";

interface DrugInteractionPanelProps {
    results: PharmaGuardResult[];
}

interface Interaction {
    drug1: string;
    drug2: string;
    sharedGene: string;
    severity: "low" | "moderate" | "high";
    description: string;
}

function findInteractions(results: PharmaGuardResult[]): Interaction[] {
    const interactions: Interaction[] = [];

    for (let i = 0; i < results.length; i++) {
        for (let j = i + 1; j < results.length; j++) {
            const a = results[i];
            const b = results[j];

            // Check shared primary gene (same enzyme pathway)
            if (
                a.pharmacogenomic_profile.primary_gene === b.pharmacogenomic_profile.primary_gene &&
                a.pharmacogenomic_profile.primary_gene !== "Unknown"
            ) {
                const gene = a.pharmacogenomic_profile.primary_gene;
                const bothHigh =
                    (a.risk_assessment.severity === "high" || a.risk_assessment.severity === "critical") &&
                    (b.risk_assessment.severity === "high" || b.risk_assessment.severity === "critical");
                const oneHigh =
                    a.risk_assessment.severity === "high" ||
                    a.risk_assessment.severity === "critical" ||
                    b.risk_assessment.severity === "high" ||
                    b.risk_assessment.severity === "critical";

                interactions.push({
                    drug1: a.drug,
                    drug2: b.drug,
                    sharedGene: gene,
                    severity: bothHigh ? "high" : oneHigh ? "moderate" : "low",
                    description: `Both drugs are metabolized by ${gene}. Co-administration may ${bothHigh
                            ? "significantly alter plasma concentrations of both drugs"
                            : oneHigh
                                ? "require dose adjustments for one or both drugs"
                                : "cause minor changes in drug metabolism"
                        }.`,
                });
            }
        }
    }

    return interactions;
}

export default function DrugInteractionPanel({ results }: DrugInteractionPanelProps) {
    const interactions = findInteractions(results);

    if (interactions.length === 0) return null;

    return (
        <div className="ddi-panel" id="ddi-panel">
            <div className="ddi-header">
                <span className="ddi-icon">⚠️</span>
                <h3 className="ddi-title">Drug-Drug Interactions Detected</h3>
                <span className="ddi-count">{interactions.length}</span>
            </div>
            <div className="ddi-list">
                {interactions.map((int, i) => (
                    <div key={i} className={`ddi-card ddi-${int.severity}`}>
                        <div className="ddi-card-header">
                            <span className="ddi-drug">{int.drug1}</span>
                            <span className="ddi-arrow">⇄</span>
                            <span className="ddi-drug">{int.drug2}</span>
                            <span className={`ddi-severity-badge ddi-sev-${int.severity}`}>
                                {int.severity.toUpperCase()}
                            </span>
                        </div>
                        <div className="ddi-card-body">
                            <span className="ddi-shared-gene">Shared Enzyme: <strong>{int.sharedGene}</strong></span>
                            <p className="ddi-desc">{int.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
