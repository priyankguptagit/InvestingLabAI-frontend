import { Suspense } from "react";
import LandingClient from "./LandingClient";

export const dynamic = "force-dynamic";

export default function UserPortal() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
      <LandingClient />
    </Suspense>
  );
}
