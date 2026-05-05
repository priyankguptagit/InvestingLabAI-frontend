import { Suspense } from "react";
import GalleryClient from "./GalleryClient";

export const dynamic = "force-dynamic";

export default function GalleryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <GalleryClient />
    </Suspense>
  );
}