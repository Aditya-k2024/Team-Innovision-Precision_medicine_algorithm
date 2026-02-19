"use client";

import { useMemo, useState } from "react";
import type { DrugInfo } from "@/lib/types";

interface DrugSelectorProps {
    drugs: DrugInfo[];
    selectedDrugs: string[];
    onSelectionChange: (drugs: string[]) => void;
}

export default function DrugSelector({
    drugs,
    selectedDrugs,
    onSelectionChange,
}: DrugSelectorProps) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return drugs;
        const q = search.toLowerCase();
        return drugs.filter(
            (d) =>
                d.name.toLowerCase().includes(q) ||
                d.category.toLowerCase().includes(q) ||
                d.id.toLowerCase().includes(q)
        );
    }, [drugs, search]);

    const toggle = (drugId: string) => {
        if (selectedDrugs.includes(drugId)) {
            onSelectionChange(selectedDrugs.filter((d) => d !== drugId));
        } else {
            onSelectionChange([...selectedDrugs, drugId]);
        }
    };

    const selectAll = () => {
        if (selectedDrugs.length === drugs.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(drugs.map((d) => d.id));
        }
    };

    return (
        <div className="drug-selector">
            <label>
                Select Drugs to Analyze
                <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8, fontSize: "0.85rem" }}>
                    ({selectedDrugs.length} selected)
                </span>
            </label>

            <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
                <input
                    className="drug-search"
                    type="text"
                    placeholder="Search drugs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    id="drug-search-input"
                />
                <button
                    type="button"
                    onClick={selectAll}
                    style={{
                        padding: "var(--space-sm) var(--space-md)",
                        background: "var(--bg-glass)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        whiteSpace: "nowrap",
                        fontFamily: "var(--font-body)",
                        transition: "all var(--transition-fast)",
                        marginBottom: "var(--space-sm)",
                    }}
                >
                    {selectedDrugs.length === drugs.length ? "Clear All" : "Select All"}
                </button>
            </div>

            <div className="drug-grid">
                {filtered.map((drug) => {
                    const isSelected = selectedDrugs.includes(drug.id);
                    return (
                        <div
                            key={drug.id}
                            className={`drug-chip ${isSelected ? "selected" : ""}`}
                            onClick={() => toggle(drug.id)}
                            role="checkbox"
                            aria-checked={isSelected}
                            tabIndex={0}
                            id={`drug-chip-${drug.id}`}
                        >
                            <div className="drug-chip-checkbox">
                                {isSelected && (
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                            <span className="drug-chip-name">{drug.name}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
