import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET() {
    try {
        const res = await fetch(`${BACKEND_URL}/drugs`, {
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json({ drugs: [] }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching drugs:", error);
        return NextResponse.json({ drugs: [] }, { status: 500 });
    }
}
