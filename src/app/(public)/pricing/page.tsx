import { Suspense } from "react";
import PricingClient from "@/app/(public)/pricing/PricingClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pricing - Praedico Global Research",
  description: "Unlock premium stock market features and trade smarter with our flexible plans.",
};

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
      <PricingClient />
    </Suspense>
  );
}
