"use client";

import { UserNavbar } from "@/app/user/_components/UserNavbar";
import UserFooter from "@/shared-components/UserFooter";
import FeedbackModal from "@/shared-components/feedback/FeedbackModal";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FE] dark:bg-background font-sans text-slate-800 dark:text-slate-100 selection:bg-indigo-500/30 relative transition-colors duration-300">

      {/* 1. STATIC BACKGROUND LAYER (Fixed, GPU-composited blobs — no animation) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/30 dark:bg-indigo-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-200/30 dark:bg-purple-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-blue-100/20 dark:bg-blue-500/8 rounded-full blur-[100px]" />
      </div>

      {/* 2. NAVIGATION LAYER (Fixed on Top) */}
      {/* We wrap it in 'fixed' so it floats OVER the page instead of pushing it down */}
      <div className="fixed top-0 left-0 w-full z-50">
        <UserNavbar />
      </div>

      {/* 3. MAIN CONTENT */}
      {/* Added pt-24 (96px) to push content below fixed navbar on all devices. */}
      <main className="relative flex-1 w-full">
        {children}
      </main>

      {/* 4. FOOTER */}
      <div className="relative mt-auto border-t border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md transition-colors duration-300">
        <UserFooter />
      </div>

      {/* 5. GLOBAL FEEDBACK MODAL */}
      <FeedbackModal portal="user" />

    </div>
  );
}