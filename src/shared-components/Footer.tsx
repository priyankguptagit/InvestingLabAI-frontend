"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Linkedin, ArrowRight, Twitter } from "lucide-react";

interface FooterProps {
  variant?: "public" | "user";
}

export default function Footer({ variant = "public" }: FooterProps) {
  const isPublic = variant === "public";

  return (
    <footer
      className={`relative ${isPublic ? "bg-[#020617]" : "bg-transparent"} pt-8 pb-4 overflow-hidden ${isPublic ? "border-t border-slate-800/60" : ""}`}
    >
      {/* AMBIENT TOP GLOW - Only for Public */}
      {isPublic && (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-40 shadow-[0_0_16px_rgba(99,102,241,0.7)]" />
          <div className="absolute -top-20 left-1/4 w-56 h-56 bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute -top-20 right-1/4 w-56 h-56 bg-fuchsia-600/10 rounded-full blur-[90px] pointer-events-none" />
        </>
      )}

      <div className="container mx-auto px-6 relative z-10">
        {/* MAIN GRID — Brand | Company | Resources */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-x-8 gap-y-8 mb-8">
          {/* BRAND */}
          <div className="col-span-2 md:col-span-3 lg:col-span-4 space-y-5">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <Image
                src="/praedico-logo.png"
                alt="Praedico Logo"
                width={40}
                height={40}
                className="rounded-xl group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-2xl font-bold tracking-tight text-white">
                Praedico
              </span>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Empoweringgg the next generation of digital research with advanced
              security, real-time analytics, and institutional-grade interfaces.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <Link
                href="#"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20"
              >
                <Linkedin size={18} />
              </Link>
              <Link
                href="#"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-sky-500 hover:border-sky-400 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/20"
              >
                <Twitter size={18} />
              </Link>
            </div>
          </div>

          {/* COMPANY */}
          <div
            className={`col-span-1 ${isPublic ? "lg:col-span-2" : "lg:col-span-4"}`}
          >
            <h4 className="text-white font-bold mb-5 text-xs uppercase tracking-widest">
              Company
            </h4>
            <ul className="space-y-4">
              <FooterLink href="/about">About</FooterLink>
              <FooterLink href="/product">Product</FooterLink>
              <FooterLink href="/gallery">Gallery</FooterLink>
              <FooterLink href="/contacts">Contacts</FooterLink>
              <FooterLink href="/apply">Apply</FooterLink>
            </ul>
          </div>

          {/* RESOURCES */}
          <div
            className={`col-span-1 ${isPublic ? "lg:col-span-2" : "lg:col-span-4"}`}
          >
            <h4 className="text-white font-bold mb-5 text-xs uppercase tracking-widest">
              Resources
            </h4>
            <ul className="space-y-4">
              <FooterLink href="/services">Services</FooterLink>
              <FooterLink href="/news">News</FooterLink>
              <FooterLink href="/markets">Markets</FooterLink>
              <FooterLink href="/pricing">Pricing</FooterLink>
            </ul>
          </div>

          {/* CALL TO ACTION — Only for Public */}
          {isPublic && (
            <div className="col-span-2 md:col-span-3 lg:col-span-4 space-y-6">
              <div className="relative group">
                <h3 className="text-xl font-bold text-white mb-3">
                  Ready to elevate your{" "}
                  <span className="text-indigo-400">trading?</span>
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6 font-medium max-w-xs">
                  Experience institutional-grade analytics and predictive
                  intelligence with the Praedico Elite Terminal.
                </p>
                <Link
                  href="/?openRegister=true"
                  className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-indigo-400 transition-colors group/link"
                >
                  Get Started Now
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>

                {/* Subtle underline decoration */}
                <div className="mt-8 h-[1px] w-full bg-gradient-to-r from-indigo-500/50 to-transparent" />
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM BAR */}
        <div
          className={`border-t border-slate-800/50 ${isPublic ? "mt-8" : "mt-6"} pt-6 flex flex-col md:flex-row justify-between items-center gap-3 w-full text-slate-400 text-sm`}
        >
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-500 font-medium tracking-wide">
              © 2026 Praedico Global Research Systems. All rights reserved.
            </p>
            {isPublic && (
              <div className="flex gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                <Link
                  href="/privacy"
                  className="hover:text-indigo-400 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-indigo-400 transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/cookies"
                  className="hover:text-indigo-400 transition-colors"
                >
                  Cookie Settings
                </Link>
              </div>
            )}
          </div>

          {/* SINGLE CREDIT PILL */}
          <div
            className={`flex items-center gap-3 ${isPublic ? "px-6 py-3" : "px-5 py-2.5"} rounded-full bg-slate-900/50 border border-slate-800/50 hover:border-indigo-500/30 transition-all duration-500 group ${isPublic ? "hover:shadow-2xl hover:shadow-indigo-500/10" : ""}`}
          >
            <span className="text-[11px] text-slate-400">
              Designed &amp; Built by
            </span>
            <span
              className={`${isPublic ? "text-[11px]" : "text-xs"} font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-pink-400 group-hover:from-indigo-300 group-hover:to-pink-300 transition-all`}
            >
              Arjun, Sambhav &amp; Unnati
            </span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse flex-shrink-0" />
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────
function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-slate-400 hover:text-indigo-400 transition-all duration-300 flex items-center gap-1 group"
      >
        <span className="w-0 overflow-hidden group-hover:w-2 transition-all duration-300 opacity-0 group-hover:opacity-100">
          <ArrowRight size={12} />
        </span>
        {children}
      </Link>
    </li>
  );
}
