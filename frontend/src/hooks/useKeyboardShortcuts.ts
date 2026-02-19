"use client";

import { useEffect } from "react";

interface ShortcutActions {
    onUpload?: () => void;
    onAnalyze?: () => void;
    onDownload?: () => void;
    onToggleTheme?: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const ctrl = e.ctrlKey || e.metaKey;
            if (!ctrl) return;

            switch (e.key.toLowerCase()) {
                case "u":
                    e.preventDefault();
                    actions.onUpload?.();
                    break;
                case "enter":
                    e.preventDefault();
                    actions.onAnalyze?.();
                    break;
                case "d":
                    e.preventDefault();
                    actions.onDownload?.();
                    break;
                case "t":
                    // Only if not typing in an input
                    if (
                        document.activeElement?.tagName !== "INPUT" &&
                        document.activeElement?.tagName !== "TEXTAREA"
                    ) {
                        e.preventDefault();
                        actions.onToggleTheme?.();
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [actions]);
}
