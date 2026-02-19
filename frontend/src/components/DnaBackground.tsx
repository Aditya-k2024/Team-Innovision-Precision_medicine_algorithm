"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

/**
 * Ultra-light DNA helix background.
 * - Pauses during scroll to avoid fighting the compositor
 * - Throttled to 24fps (background decoration doesn't need 60fps)
 * - Minimal draw calls
 */
export default function DnaBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        let raf: number;
        let w = 0;
        let h = 0;
        let scrolling = false;
        let scrollTimer: ReturnType<typeof setTimeout>;

        /* ── Palette ──────────────────────────────────────────── */
        const dark = theme === "dark";
        const strand1 = dark ? "rgba(99,102,241," : "rgba(79,70,229,";
        const strand2 = dark ? "rgba(34,211,238," : "rgba(8,145,178,";

        /* ── 3 helices ────────────────────────────────────────── */
        const helices = [
            { x: 0.18, speed: 0.25, amp: 40, freq: 0.011, phase: 0, opacity: 0.14, size: 1.8 },
            { x: 0.55, speed: 0.18, amp: 50, freq: 0.009, phase: 2.0, opacity: 0.10, size: 1.5 },
            { x: 0.85, speed: 0.22, amp: 35, freq: 0.010, phase: 4.0, opacity: 0.08, size: 1.3 },
        ];

        /* ── Scroll detection — pause animation while scrolling ── */
        const onScroll = () => {
            scrolling = true;
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => { scrolling = false; }, 150);
        };
        window.addEventListener("scroll", onScroll, { passive: true });

        /* ── Resize ────────────────────────────────────────────── */
        const resize = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w;
            canvas.height = h;
        };
        resize();
        window.addEventListener("resize", resize, { passive: true });

        /* ── Draw loop ─────────────────────────────────────────── */
        let t = 0;
        let lastFrame = 0;
        const FPS = 42; // ~24fps, plenty for a subtle background
        const INTERVAL = 1000 / FPS;

        const draw = (now: number) => {
            raf = requestAnimationFrame(draw);

            // Skip frames during scroll or if throttle interval hasn't passed
            if (scrolling || now - lastFrame < INTERVAL) return;
            lastFrame = now;

            t += 1;
            ctx.clearRect(0, 0, w, h);

            const step = 6; // coarse step — very few lineTo ops

            for (const helix of helices) {
                const cx = helix.x * w;
                const scrollOff = t * helix.speed;

                // Strand 1
                ctx.beginPath();
                for (let y = 0; y < h; y += step) {
                    const x = cx + Math.sin((y + scrollOff) * helix.freq + helix.phase + t * 0.008) * helix.amp;
                    y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.strokeStyle = strand1 + helix.opacity + ")";
                ctx.lineWidth = helix.size;
                ctx.stroke();

                // Strand 2
                ctx.beginPath();
                for (let y = 0; y < h; y += step) {
                    const x = cx - Math.sin((y + scrollOff) * helix.freq + helix.phase + t * 0.008) * helix.amp;
                    y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.strokeStyle = strand2 + helix.opacity + ")";
                ctx.lineWidth = helix.size;
                ctx.stroke();
            }
        };

        raf = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(scrollTimer);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", resize);
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            className="dna-background"
            aria-hidden="true"
        />
    );
}
