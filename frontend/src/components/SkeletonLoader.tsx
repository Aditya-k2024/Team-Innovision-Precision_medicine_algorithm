"use client";

export default function SkeletonLoader() {
    return (
        <div className="skeleton-container" aria-label="Loading results...">
            {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.15}s` }}>
                    {/* Header row */}
                    <div className="skeleton-header">
                        <div className="skeleton-line skeleton-w60 skeleton-h-lg" />
                        <div className="skeleton-line skeleton-w20 skeleton-h-sm" />
                    </div>
                    {/* Top bar (gene/diplotype/phenotype/confidence) */}
                    <div className="skeleton-topbar">
                        <div className="skeleton-cell" />
                        <div className="skeleton-cell" />
                        <div className="skeleton-cell" />
                        <div className="skeleton-cell" />
                    </div>
                    {/* AI Summary */}
                    <div className="skeleton-summary">
                        <div className="skeleton-line skeleton-w40 skeleton-h-xs" />
                        <div className="skeleton-line skeleton-w100" />
                        <div className="skeleton-line skeleton-w80" />
                    </div>
                    {/* Sections */}
                    <div className="skeleton-section">
                        <div className="skeleton-line skeleton-w50 skeleton-h-sm" />
                    </div>
                    <div className="skeleton-section">
                        <div className="skeleton-line skeleton-w40 skeleton-h-sm" />
                    </div>
                    {/* Footer */}
                    <div className="skeleton-footer">
                        <div className="skeleton-line skeleton-w20 skeleton-h-xs" />
                        <div className="skeleton-line skeleton-w20 skeleton-h-xs" />
                        <div className="skeleton-line skeleton-w20 skeleton-h-xs" />
                    </div>
                </div>
            ))}
        </div>
    );
}
