"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Github, Twitter, Linkedin, Instagram, 
  Heart, Mail, ArrowRight, Send
} from "lucide-react";
import { motion } from "framer-motion";

export default function UserFooter() {
  return (
    <footer className="relative bg-[#020617] pt-10 pb-6 overflow-hidden border-t border-white/5">
      
      {/* 1. AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
      <div className="absolute -top-20 left-1/4 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-20 right-1/4 w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        
        {/* 2. MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-8">
          
          {/* BRAND COLUMN (Span 4) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/praedico-logo.png"
                alt="Praedico Logo"
                width={36}
                height={36}
                className="rounded-xl group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-xl font-bold tracking-tight text-white">
                Praedico
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed text-sm max-w-sm">
              The institutional standard for global research and algorithmic trading. Empowering investors with precision data and state-of-the-art predictive analytics.
            </p>
            
            {/* SOCIAL ICONS */}
            <div className="flex gap-3">
              <SocialIcon icon={Github} href="https://github.com/praedico" />
              <SocialIcon icon={Twitter} href="https://twitter.com/praedico" />
              <SocialIcon icon={Linkedin} href="https://linkedin.com/company/praedico" />
              <SocialIcon icon={Instagram} href="https://instagram.com/praedico" />
            </div>
          </div>

          {/* LINKS COLUMNS */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Platform</h4>
            <ul className="space-y-3">
              <FooterLink href="/services">Our Services</FooterLink>
              <FooterLink href="/markets">Market Data</FooterLink>
              <FooterLink href="/pricing">Pricing Plans</FooterLink>
              <FooterLink href="/product">Elite Terminal</FooterLink>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Resources</h4>
            <ul className="space-y-3">
              <FooterLink href="/about">About PGR</FooterLink>
              <FooterLink href="/gallery">Gallery</FooterLink>
              <FooterLink href="/news">Global News</FooterLink>
              <FooterLink href="/docs">Documentation</FooterLink>
              <FooterLink href="/contacts">Contact Support</FooterLink>
            </ul>
          </div>

          {/* NEWSLETTER COLUMN (Span 4) */}
          <div className="lg:col-span-4">
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Institutional Updates</h4>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              Subscribe to receive weekly macroeconomic insights and platform updates directly in your inbox.
            </p>
            <form className="relative group" onSubmit={(e) => e.preventDefault()}>
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md focus-within:border-indigo-500/50 focus-within:bg-white/[0.05] transition-all duration-300">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="email" 
                  placeholder="name@institution.com" 
                  className="w-full bg-transparent py-3 pl-10 pr-14 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                />
                <button 
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 3. BOTTOM BAR */}
        <div className="border-t border-white/5 pt-5 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 text-[11px] text-slate-500 font-medium uppercase tracking-widest">
            <p>© 2026 PRAEDICO GLOBAL RESEARCH SYSTEMS</p>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>

          {/* DESIGN CREDIT */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 transition-all duration-500 group cursor-default">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">In Collaboration with</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400 group-hover:from-indigo-300 group-hover:to-fuchsia-300 transition-all tracking-tight">
                Arjun & Sambhav
              </span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ icon: Icon, href }: { icon: any, href: string }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Link 
        href={href} 
        className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20"
      >
        <Icon size={16} />
      </Link>
    </motion.div>
  );
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <li>
      <Link 
        href={href} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="text-sm text-slate-400 hover:text-indigo-400 transition-all duration-300 flex items-center gap-1.5 group font-medium"
      >
        <motion.span 
          initial={{ width: 0, opacity: 0 }}
          animate={{ 
            width: isHovered ? 12 : 0, 
            opacity: isHovered ? 1 : 0 
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <ArrowRight size={12} />
        </motion.span>
        {children}
      </Link>
    </li>
  );
}
