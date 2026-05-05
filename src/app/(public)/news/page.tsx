import { Suspense } from "react";
import NewsClient from "./NewsClient";

export const dynamic = "force-dynamic";

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <NewsClient />
    </Suspense>
  );
}