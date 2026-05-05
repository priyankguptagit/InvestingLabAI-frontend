"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Shield,
  BarChart3,
  Globe,
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
  BookOpen,
  Quote
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Card, CardContent } from "@/shared-components/ui/card";
import { Badge } from "@/shared-components/ui/badge";
import { Button } from "@/shared-components/ui/button";

/**
 * AnimatedCounter - A simple component to animate numbers
 */
function AnimatedCounter({ value, duration = 2 }: { value: string, duration?: number }) {
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
  const suffix = value.replace(/[0-9.]/g, '');
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = numericValue;
    if (start === end) return;

    let totalMiliseconds = duration * 1000;
    let incrementTime = (totalMiliseconds / end);

    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [numericValue, duration]);

  return <span>{count}{suffix}</span>;
}

/**
 * AboutPage - A professional page explaining the mission and value
 * proposition of Praedico Global Research.
 */
export default function AboutPage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 font-sans pb-20 pt-40 overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 blur-[120px] rounded-full animate-pulse decoration-delay-2000" />
      </div>

      {/* 1. HERO SECTION */}
      <motion.section 
        style={{ opacity, scale }}
        className="container mx-auto px-6 mb-16 text-center relative z-10"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex"
          >
            <Badge variant="outline" className="text-xs md:text-sm font-bold uppercase tracking-[0.5em] text-indigo-400 border-indigo-500/30 bg-indigo-500/5 px-4 py-1">
              Your trusted trading company
            </Badge>
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl md:text-3xl lg:text-5xl font-black tracking-tight leading-tight text-white"
          >
            Empowering smarter investment decisions <span className="text-indigo-500">for everyone</span>
          </motion.h1>
        </div>
      </motion.section>

      {/* 2. ABOUT US SECTION */}
      <section className="container mx-auto px-6 mb-20 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left: Content Side */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:flex-1 space-y-8"
          >
            <div className="space-y-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="inline-flex"
              >
                <Badge variant="outline" className="px-3 py-1 rounded-full border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest cursor-default">
                  About Us
                </Badge>
              </motion.div>
              <h3 className="text-2xl md:text-4xl font-bold tracking-tight leading-[1.2]">
                Institutional-grade intelligence <span className="text-indigo-500">for the modern investor</span>
              </h3>
            </div>
 
            <div className="space-y-5 text-base md:text-lg text-slate-400 font-medium leading-relaxed">
              <p>
                Founded on the principle of institutional-grade accessibility, Praedico Global Research (PGR) serves as the bridge between complex market dynamics and actionable investor intelligence. We believe that sophisticated research shouldn't be a privilege of the few, but a foundation for the many.
              </p>
              <p>
                Our background is rooted in deep quantitative analysis and macroeconomic strategy. By blending human expertise with algorithmic precision, we provide a perspective that is both technically rigorous and intuitively navigable, ensuring our partners navigate global markets with absolute clarity.
              </p>
            </div>
 
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-4 border-t border-white/5">
              <div className="space-y-1">
                <span className="text-2xl font-bold text-white tracking-tight">
                  <AnimatedCounter value="10K+" />
                </span>
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-extrabold">Traders Empowered</p>
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-bold text-white tracking-tight">
                  <AnimatedCounter value="100%" />
                </span>
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-extrabold">Platform Uptime</p>
              </div>
            </div>
          </motion.div>

          {/* Right: Image Container */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:w-[35%] relative w-full aspect-square"
          >
            <motion.div 
              animate={{ 
                y: [0, -10, 0],
                rotateZ: [0, 1, 0]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -inset-4 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 rounded-3xl blur-2xl opacity-40" 
            />
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative h-full w-full rounded-3xl border border-white/10 overflow-hidden shadow-2xl bg-slate-900/50 group cursor-pointer"
            >
              <Image
                src="/images/about.png"
                alt="Institutional grade research and analytics"
                fill
                className="object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. WHY CHOOSE OUR PLATFORM */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="py-16 relative z-10 border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400 mb-4">Why Us</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Why Choose Our <span className="text-indigo-500">Platform?</span></h2>
            <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
              We provide comprehensive solutions tailored for institutional accuracy and retail simplicity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AboutFeatureCard
              icon={BookOpen}
              title="Expert Insights"
              desc="Direct access to veteran strategies who translate noise into signal."
              index={0}
            />
            <AboutFeatureCard
              icon={Shield}
              title="Secure Platform"
              desc="Enterprise-grade security protocols ensuring your data and assets remain protected."
              index={1}
            />
            <AboutFeatureCard
              icon={BarChart3}
              title="Advanced Analytics"
              desc="Proprietary modeling suite that uncover hidden correlations in global markets."
              index={2}
            />
            <AboutFeatureCard
              icon={Globe}
              title="Global Reach"
              desc="24/7 monitoring across all major international exchanges and asset classes."
              index={3}
            />
          </div>
        </div>
      </motion.section>

      {/* 4. FOOTER QUOTE SECTION */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-6 relative z-10"
      >
        <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-slate-900/40 to-indigo-950/30 border border-white/10 p-10 md:p-14 text-center backdrop-blur-xl transition-all duration-500 hover:border-indigo-500/30">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <motion.div 
              initial={{ rotate: -10, scale: 0.8 }}
              whileInView={{ rotate: 0, scale: 1 }}
              viewport={{ once: true }}
              className="flex justify-center mb-6"
            >
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-white/5 shadow-inner">
                <Quote className="w-6 h-6 rotate-180" />
              </div>
            </motion.div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-black italic tracking-tight leading-tight text-white/90">
              "Investing what's comfortable is rarely profitable. Our platform is designed to help you stay beyond comfort and into confidence."
            </h2>
            <div className="mt-8 flex items-center justify-center gap-4">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: 40 }}
                transition={{ duration: 1 }}
                className="h-[1px] bg-indigo-500/30" 
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-indigo-500/60">PGR Strategic Vision</span>
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: 40 }}
                transition={{ duration: 1 }}
                className="h-[1px] bg-indigo-500/30" 
              />
            </div>
          </div>
        </div>
      </motion.section>

    </div>
  );
}

/**
 * AboutFeatureCard - Individual card for the Why Choose section
 */
function AboutFeatureCard({ icon: Icon, title, desc, index }: { icon: any, title: string, desc: string, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="flex items-stretch h-full"
    >
      <Card
        className="p-10 rounded-3xl bg-gradient-to-b from-indigo-900/20 to-transparent border-indigo-500/30 flex flex-col items-center text-center group relative overflow-hidden hover:border-indigo-500/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 cursor-pointer w-full"
      >
        {/* Glow Effect */}
        <div className="absolute -inset-24 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[80px] pointer-events-none" />
        
        <CardContent className="p-0 relative z-10 w-full flex flex-col items-center">
          <motion.div 
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="p-6 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-7 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all duration-700"
          >
            <Icon className="w-8 h-8" />
          </motion.div>
          <h3 className="text-2xl font-bold mb-3 tracking-tight transition-colors group-hover:text-indigo-200">{title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed font-medium transition-colors group-hover:text-slate-300">{desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
