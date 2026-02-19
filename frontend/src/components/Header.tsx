"use client";

import { useTheme } from "./ThemeProvider";

export default function Header() {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="header">
            <div className="container">
                <div className="header-inner">
                    <div className="header-logo">
                        {/* DNA Helix SVG Icon */}
                        <svg
                            className="dna-icon"
                            viewBox="0 0 40 40"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 4C12 4 14 12 20 16C26 20 28 28 28 28"
                                stroke="url(#grad1)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M28 4C28 4 26 12 20 16C14 20 12 28 12 28"
                                stroke="url(#grad2)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M12 36C12 36 14 30 20 28"
                                stroke="url(#grad1)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M28 36C28 36 26 30 20 28"
                                stroke="url(#grad2)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            {/* Rungs */}
                            <line x1="15" y1="10" x2="25" y2="10" stroke="#6366f140" strokeWidth="1.5" />
                            <line x1="14" y1="16" x2="26" y2="16" stroke="#6366f150" strokeWidth="1.5" />
                            <line x1="14" y1="22" x2="26" y2="22" stroke="#22d3ee50" strokeWidth="1.5" />
                            <line x1="15" y1="28" x2="25" y2="28" stroke="#22d3ee40" strokeWidth="1.5" />
                            <defs>
                                <linearGradient id="grad1" x1="12" y1="4" x2="28" y2="36" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#818cf8" />
                                    <stop offset="1" stopColor="#6366f1" />
                                </linearGradient>
                                <linearGradient id="grad2" x1="28" y1="4" x2="12" y2="36" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#22d3ee" />
                                    <stop offset="1" stopColor="#06b6d4" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div>
                        <div className="header-title">PharmaGuard</div>
                        <div className="header-subtitle">Pharmacogenomic Risk Prediction System</div>
                    </div>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Theme Toggle */}
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                        id="theme-toggle-btn"
                    >
                        <span className="theme-toggle-icon">
                            {theme === "dark" ? "☀️" : "🌙"}
                        </span>
                        <span className="theme-toggle-label">
                            {theme === "dark" ? "Light" : "Dark"}
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}
