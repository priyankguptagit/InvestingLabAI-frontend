import { Suspense } from "react";
import ProductClient from "./ProductClient";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
      <ProductClient />
    </Suspense>
  );
}