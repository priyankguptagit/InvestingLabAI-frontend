import { Suspense } from "react";
import ContactsClient from "./ContactsClient";

export const dynamic = "force-dynamic";

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
      <ContactsClient />
    </Suspense>
  );
}