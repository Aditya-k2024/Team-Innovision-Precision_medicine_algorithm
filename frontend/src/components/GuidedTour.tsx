"use client";

import { useCallback, useEffect, useState } from "react";

interface TourStep {
    target: string;
    title: string;
    description: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        target: "#vcf-upload-zone",
        title: "1. Upload Your VCF File",
        description:
            "Drag & drop your VCF file here, or click to browse. The file will be parsed and analyzed for pharmacogenomic variants.",
    },
    {
        target: "#drug-selector",
        title: "2. Select Medications",
        description:
            "Choose the drugs you want to check. The system will identify potential gene-drug interactions and risk levels.",
    },
    {
        target: "#analyze-btn",
        title: "3. Run Analysis",
        description:
            "Click Analyze to process your VCF file against the selected drugs. The AI will generate clinical insights and risk predictions.",
    },
];

const TOUR_LS_KEY = "pharmaguard-tour-completed";

export default function GuidedTour() {
    const [currentStep, setCurrentStep] = useState(-1);

    // Auto-start only once
    useEffect(() => {
        const completed = localStorage.getItem(TOUR_LS_KEY);
        if (!completed) {
            const timer = setTimeout(() => setCurrentStep(0), 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    // Escape key to dismiss
    useEffect(() => {
        if (currentStep < 0) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleSkip();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    });

    // Scroll target into view
    useEffect(() => {
        if (currentStep < 0 || currentStep >= TOUR_STEPS.length) return;
        const el = document.querySelector(TOUR_STEPS[currentStep].target);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [currentStep]);

    const handleSkip = useCallback(() => {
        setCurrentStep(-1);
        localStorage.setItem(TOUR_LS_KEY, "true");
    }, []);

    const handleNext = useCallback(() => {
        if (currentStep >= TOUR_STEPS.length - 1) {
            handleSkip();
        } else {
            setCurrentStep((p) => p + 1);
        }
    }, [currentStep, handleSkip]);

    if (currentStep < 0 || currentStep >= TOUR_STEPS.length) return null;

    const step = TOUR_STEPS[currentStep];
    const isLast = currentStep === TOUR_STEPS.length - 1;

    return (
        <>
            {/* Full-screen dimmed overlay — click anywhere to skip */}
            <div className="tour-overlay" onClick={handleSkip} />

            {/* Fixed-position tooltip at bottom-center of viewport */}
            <div className="tour-tooltip-fixed">
                <div className="tour-tooltip-title">{step.title}</div>
                <p className="tour-tooltip-desc">{step.description}</p>
                <div className="tour-tooltip-footer">
                    <span className="tour-step-indicator">
                        {currentStep + 1} / {TOUR_STEPS.length}
                    </span>
                    <div className="tour-tooltip-actions">
                        <button className="tour-btn-skip" onClick={handleSkip}>
                            Skip Tour
                        </button>
                        <button className="tour-btn-next" onClick={handleNext}>
                            {isLast ? "Done!" : "Next →"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
