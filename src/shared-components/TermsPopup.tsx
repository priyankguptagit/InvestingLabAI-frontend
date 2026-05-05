"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, AlertTriangle, Gavel,
  Users, Lock, BookOpen, Check, X,
  ShieldCheck, FileText
} from "lucide-react";

/**
 * TermsPopup - A mandatory modal that appears on first visit
 * ensuring users accept the terms and regulatory disclosures.
 */
const TermsPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    // Check if user has already accepted the terms in this browser
    const hasAccepted = localStorage.getItem("praedico_terms_accepted");
    if (!hasAccepted) {
      setIsOpen(true);
      // Prevent scrolling of background content
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleAccept = () => {
    if (agreed) {
      localStorage.setItem("praedico_terms_accepted", "true");
      setIsOpen(false);
      document.body.style.overflow = "unset";
    }
  };

  const handleDecline = () => {
    alert("You must accept the terms and conditions to proceed to the website.");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="bg-[#0F172A] border border-white/10 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] relative my-auto border-t-indigo-500/50"
          >
            {/* Design Gradient Accents */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

            {/* Header Section */}
            <div className="p-8 pb-4 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <span className="text-sm font-bold text-white">P</span>
                </div>
                <span className="text-sm md:text-base font-bold text-white uppercase tracking-[0.3em]">Praedico Global Research</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
                Service Agreement &<br /> Regulatory Disclosures
              </h2>
              <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                Please review these terms carefully before proceeding. Our relationship is built on transparency and professional integrity.
              </p>
            </div>

            {/* Content Area - Scrollable sections */}
            <div className="px-8 pb-4 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-4">
              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TermCard
                  icon={<GraduationCap className="h-5 w-5" />}
                  title="Educational Purpose Only"
                  points={[
                    "All research reports are for informational purposes only.",
                    "Content does not constitute professional investment advice.",
                    "Market analyses provided are for academic guidance."
                  ]}
                  color="indigo"
                />
                <TermCard
                  icon={<AlertTriangle className="h-5 w-5" />}
                  title="Risk Disclosure"
                  points={[
                    "Trading and investing involve significant capital risk.",
                    "Market volatility can result in substantial losses.",
                    "Users must conduct their own independent due diligence."
                  ]}
                  color="amber"
                />
                <TermCard
                  icon={<Gavel className="h-5 w-5" />}
                  title="No Liability"
                  points={[
                    "Praedico is not responsible for any financial losses.",
                    "Users assume full responsibility for using our insights.",
                    "External market actions are taken at the user's risk."
                  ]}
                  color="rose"
                />
                <TermCard
                  icon={<Users className="h-5 w-5" />}
                  title="Code of Conduct"
                  points={[
                    "Users agree to professional engagement protocols.",
                    "Strictly no market manipulation or heavy scraping.",
                    "Unauthorized data redistribution is strictly prohibited."
                  ]}
                  color="blue"
                />
                <TermCard
                  icon={<Lock className="h-5 w-5" />}
                  title="Data Privacy"
                  points={[
                    "We employ enterprise-grade encryption for all data.",
                    "Personal research preferences are strictly confidential.",
                    "User data is secured using modern security standards."
                  ]}
                  color="emerald"
                />
                <TermCard
                  icon={<BookOpen className="h-5 w-5" />}
                  title="Platform Usage"
                  points={[
                    "Access is granted to the registered user only.",
                    "Sharing login credentials for external use is forbidden.",
                    "Commercial redistribution requires a separate license."
                  ]}
                  color="slate"
                />
              </div>

              {/* Full Terms Section (Minimalistic summary) */}
              <div className="mt-6 p-6 rounded-3xl bg-white/5 border border-white/10 shadow-lg">
                <div className="flex items-center gap-3 mb-4 text-slate-200 font-bold text-sm">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20">
                    <FileText className="h-4 w-4 text-indigo-400" />
                  </div>
                  Full Terms & Conditions (Version 2.4.0)
                </div>
                <div className="space-y-4 text-[13px] text-slate-400 leading-relaxed">
                  <p>
                    <strong className="text-indigo-400">1. Introduction:</strong> Welcome to Praedico Global Research. By accessing or using our services, you signify that you have read, understood, and agree to be bound by these Terms and Conditions and our Privacy Policy.
                  </p>
                  <p>
                    <strong className="text-indigo-400">2. Proprietary Research Data:</strong> All quantitative models, proprietary scoring systems, and editorial content displayed on the Praedico platform are the exclusive intellectual property of Praedico Global Research.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer with Checkbox and Buttons */}
            <div className="p-8 bg-[#020617]/80 border-t border-white/5 backdrop-blur-md">
              <label className="flex items-start gap-4 cursor-pointer group mb-8">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center shrink-0 ${agreed ? 'bg-indigo-600 border-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-transparent border-white/20 group-hover:border-white/40'}`}>
                    {agreed && <Check className="h-4 w-4 text-white stroke-[3]" />}
                  </div>
                </div>
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors leading-tight">
                  I have read, understood, and agree to all the <span className="text-indigo-400 underline underline-offset-4 decoration-indigo-400/30"></span> terms and conditions mentioned above.
                </span>
              </label>

              <div className="flex gap-4">
                <button
                  onClick={handleAccept}
                  disabled={!agreed}
                  className={`flex-1 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${agreed ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                  ACCEPT & CONTINUE
                  <Check className="h-5 w-5" />
                </button>
              </div>
            </div>


          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface TermCardProps {
  icon: React.ReactNode;
  title: string;
  points: string[];
  color: 'indigo' | 'amber' | 'rose' | 'blue' | 'emerald' | 'slate';
}

const TermCard = ({ icon, title, points, color }: TermCardProps) => {
  const colorMap = {
    indigo: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-400",
    rose: "border-rose-500/20 bg-rose-500/5 text-rose-400",
    blue: "border-blue-500/20 bg-blue-500/5 text-blue-400",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    slate: "border-slate-500/20 bg-slate-500/5 text-slate-400",
  };

  return (
    <div className={`p-5 rounded-3xl border transition-all duration-500 hover:border-white/20 group/card ${colorMap[color]}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-[12px] bg-white/10 group-hover/card:scale-110 transition-transform">
          {icon}
        </div>
        <h4 className="font-bold text-[12px] tracking-[0.05em] uppercase text-white/90">{title}</h4>
      </div>
      <ul className="space-y-2.5">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[12px] text-slate-400 leading-snug group-hover/card:text-slate-300 transition-colors">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0 opacity-50" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TermsPopup;
