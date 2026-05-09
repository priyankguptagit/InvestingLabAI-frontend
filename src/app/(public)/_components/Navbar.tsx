// app/(public)/_components/Navbar.tsx
"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Menu, X, Zap, Award } from "lucide-react";
import Image from "next/image";
import LoginModal from "@/app/user/_components/LoginModal";
import RegisterModal from "@/app/user/_components/RegisterModal";
import CertificateModal from "./CertificateModal";

/**
 * SearchParamsHandler - Handles URL search parameters
 * Needs to be wrapped in Suspense for Next.js build
 */
function SearchParamsHandler({ onOpenLogin, onOpenRegister }: { onOpenLogin: () => void, onOpenRegister: () => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("openLogin") === "true") {
      onOpenLogin();
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
    if (searchParams.get("openRegister") === "true") {
      onOpenRegister();
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, onOpenLogin, onOpenRegister]);

  return null;
}

const navItems = [
  { label: "Home",     href: "/" },
  { label: "About",    href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Pricing",  href: "/pricing" },
  { label: "Product",  href: "/product" },
  { label: "Gallery",  href: "/gallery" },
  { label: "Markets",  href: "/markets" },
  { label: "News",     href: "/news" },
  { label: "Contacts", href: "/contacts" },
  { label: "Apply",    href: "/apply" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled]             = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]     = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);

  const pathname = usePathname();

  // ── Scroll effect ──────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Lock body scroll when mobile menu is open ──────────────────
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  // ── Close drawer on route change ───────────────────────────────
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  const handleSignIn      = useCallback(() => setIsLoginModalOpen(true), []);
  const handleGetStarted  = useCallback(() => setIsRegisterModalOpen(true), []);

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsHandler 
          onOpenLogin={() => setIsLoginModalOpen(true)} 
          onOpenRegister={() => setIsRegisterModalOpen(true)} 
        />
      </Suspense>

      {/* ── NAV SHELL ─────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 w-full z-[100] transition-all duration-500 border-b ${
          isScrolled
            ? "bg-[#020617]/95 backdrop-blur-2xl border-slate-800 shadow-2xl shadow-indigo-500/10"
            : "bg-[#020617]/40 backdrop-blur-md  border-white/5"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

          {/* ── LOGO ────────────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <Image
              src="/praedico-logo.png"
              alt="Praedico Logo"
              width={36}
              height={36}
              className="rounded-xl group-hover:scale-110 transition-transform duration-300"
            />
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Praedico
              <span className="font-light text-slate-500 hidden sm:inline">GlobalResearch</span>
            </span>
          </Link>

          {/* ── DESKTOP NAV PILL (hidden below lg) ──────────────── */}
          <div className="hidden lg:flex items-center gap-1 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md flex-wrap justify-center">
            {navItems.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className={`relative text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 group ${
                    isActive
                      ? "text-white bg-white/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── DESKTOP AUTH BUTTONS (hidden below lg) ──────────── */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setIsCertificateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-indigo-400 border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all mr-2 group shadow-lg shadow-indigo-500/10"
            >
              <Award className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              Certificate
            </button>
            <button
              onClick={handleSignIn}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={handleGetStarted}
              className="group relative px-5 py-2 rounded-full font-semibold text-sm bg-white text-slate-950 overflow-hidden transition-all hover:scale-105 shadow-md"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </button>
          </div>

          {/* ── HAMBURGER (visible below lg) ────────────────────── */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* ── MOBILE DRAWER ───────────────────────────────────── */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-[#020617]/98 backdrop-blur-2xl border-t border-slate-800/60 px-4 pb-6 pt-4">

            {/* Nav links grid */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {navItems.map(({ label, href }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    )}
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-4" />

            {/* Auth buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setMobileMenuOpen(false); setIsCertificateModalOpen(true); }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs uppercase tracking-widest hover:bg-indigo-500/20 transition-all"
              >
                <Award size={18} />
                Certificate
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); handleSignIn(); }}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all text-sm"
              >
                Sign In
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-medium hover:from-indigo-500 hover:to-fuchsia-500 transition-all text-sm shadow-lg shadow-indigo-500/20"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── BACKDROP OVERLAY (mobile) ────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── MODALS ──────────────────────────────────────────────── */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
      <CertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
      />
    </>
  );
}