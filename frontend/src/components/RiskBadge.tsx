"use client";

import type { RiskLevel } from "@/lib/types";

interface RiskBadgeProps {
    level: RiskLevel;
}

const LABELS: Record<RiskLevel, string> = {
    NORMAL: "Normal",
    MODERATE: "Moderate",
    HIGH: "High",
    CRITICAL: "Critical",
};

export default function RiskBadge({ level }: RiskBadgeProps) {
    return (
        <span className={`risk-badge ${level.toLowerCase()}`}>
            <span className="risk-badge-dot" />
            {LABELS[level]}
        </span>
    );
}
