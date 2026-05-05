import { Suspense } from "react";
import MarketsClient from "./MarketsClient";

export const dynamic = "force-dynamic";

export default function MarketsPage() {
    return (
        // Changed bg-[#0E1217] to bg-slate-950 to match the client component perfectly
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
            <MarketsClient />
        </Suspense>
    );
}