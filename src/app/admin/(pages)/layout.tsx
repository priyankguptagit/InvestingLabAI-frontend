"use client";
import { useState } from "react";
import { Sidebar } from "../_components/Sidebar";
import DashboardNavbar from "@/app/admin/_components/DashboardNavbar";
import { useAdminSessionTimeout } from "@/hooks/useAdminSessionTimeout";
import AdminSessionWarningModal from "@/shared-components/AdminSessionWarningModal";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileOpen, setMobileOpen] = useState(false);

  const {
    showWarning,
    secondsLeft,
    isOffline,
    isExtending,
    extendSession,
    logout: sessionLogout,
  } = useAdminSessionTimeout();

  return (
    <>
      <AdminSessionWarningModal
        isOpen={showWarning}
        secondsLeft={secondsLeft}
        isOffline={isOffline}
        isExtending={isExtending}
        onExtend={extendSession}
        onLogout={sessionLogout}
      />

      <div className="flex h-screen bg-slate-950 overflow-hidden">
        {/* Mobile overlay backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar
          role="admin"
          isOpen={isSidebarOpen}
          onToggle={() => setSidebarOpen(!isSidebarOpen)}
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Navbar */}
          <DashboardNavbar
            onMobileMenuToggle={() => setMobileOpen(!isMobileOpen)}
            sessionSecondsLeft={showWarning ? secondsLeft : null}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-0">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}