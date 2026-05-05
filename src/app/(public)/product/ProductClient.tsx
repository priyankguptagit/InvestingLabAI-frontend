"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Sparkles,
    Zap,
    Shield,
    TrendingUp,
    BarChart3,
    Brain,
    Target,
    Rocket,
    ChevronRight,
    Play,
    Layers,
    Cpu,
    Network
} from "lucide-react";
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue, Variants } from "framer-motion";
import RegisterModal from "@/app/user/_components/RegisterModal";
import LoginModal from "@/app/user/_components/LoginModal";
import { cn } from "@/lib/utils";

// --- ANIMATION VARIANTS ---
const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1] as const
        }
    }
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2
        }
    }
};

// --- SPOTLIGHT CARD COMPONENT ---
function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={cn(
                "group relative border border-white/10 bg-slate-900/50 overflow-hidden rounded-xl",
                className
            )}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(124, 58, 237, 0.15),
              transparent 80%
            )
          `,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    );
}

export default function ProductClient() {
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // Scroll Parallax Hooks
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    const handleGetStarted = () => setIsRegisterModalOpen(true);
    const handleSwitchToLogin = () => { setIsRegisterModalOpen(false); setIsLoginModalOpen(true); };
    const handleSwitchToRegister = () => { setIsLoginModalOpen(false); setIsRegisterModalOpen(true); };

    const features = [
        { icon: Brain, title: "Neural Processing", desc: "Proprietary AI models that self-optimize based on your data patterns.", color: "text-fuchsia-400" },
        { icon: TrendingUp, title: "Predictive Vectors", desc: "Forecast market shifts with 99.9% accuracy using historical vector analysis.", color: "text-blue-400" },
        { icon: Shield, title: "Zero-Trust Security", desc: "Military-grade encryption for your most sensitive predictive datasets.", color: "text-emerald-400" },
        { icon: Network, title: "Global Edge Network", desc: "Distributed processing nodes ensure millisecond latency worldwide.", color: "text-orange-400" },
        { icon: Cpu, title: "Real-time Compute", desc: "Process millions of data points per second with our Rust-based engine.", color: "text-cyan-400" },
        { icon: Layers, title: "Seamless Integration", desc: "Drop-in APIs that work with your existing stack in minutes.", color: "text-purple-400" },
    ];



    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 selection:text-white font-sans overflow-x-hidden relative">

            {/* --- GLOBAL AMBIENT BACKGROUND --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                <motion.div style={{ y: y1, x: -100 }} className="absolute top-0 left-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px]" />
                <motion.div style={{ y: y2, x: 100 }} className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-fuchsia-600/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            {/* --- HERO SECTION (Standardized) --- */}
            <section className="relative z-10 pt-32 md:pt-48 pb-24 lg:pb-32 overflow-hidden text-center">
                <div className="container mx-auto px-6 max-w-4xl space-y-4">

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm md:text-lg font-bold uppercase tracking-[0.5em] mb-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700"
                    >
                        Praedico Engine V2.0 Live
                    </motion.div>

                    <motion.h1
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000"
                    >
                        Predictive Intelligence <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-indigo-400">
                            Reimagined.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        The world's most advanced forecasting engine. Built on Rust,
                        deployed on the edge, designed for absolute precision.
                    </motion.p>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                    >
                        <motion.button
                            variants={fadeInUp}
                            onClick={handleGetStarted}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-white font-bold shadow-[0_0_50px_rgba(79,70,229,0.5)] border border-white/10 hover:shadow-[0_0_80px_rgba(79,70,229,0.7)] transition-all"
                        >
                            Start Free Trial
                        </motion.button>
                        <motion.button
                            variants={fadeInUp}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto px-8 py-4 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-full text-white font-medium hover:bg-white/5 transition-all flex items-center justify-center gap-2 group"
                        >
                            <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                            Watch Demo
                        </motion.button>
                    </motion.div>
                </div>

                {/* Floating UI Elements (Decorative) */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[500px] pointer-events-none -z-10 overflow-hidden opacity-30">
                    <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl animate-float-delayed" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-fuchsia-500/20 to-transparent rounded-full blur-3xl animate-float" />
                </div>
            </section>

            {/* --- STATS HUD --- */}
            <section className="border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8"
                    >
                        {[
                            { label: "Requests/Sec", value: "1.2M+", icon: Zap },
                            { label: "Accuracy", value: "99.99%", icon: Target },
                            { label: "Uptime", value: "100%", icon: TrendingUp },
                            { label: "Data Points", value: "50B+", icon: BarChart3 },
                        ].map((stat, i) => (
                            <motion.div key={i} variants={fadeInUp} className="flex flex-col items-center justify-center text-center group cursor-default">
                                <stat.icon className="w-6 h-6 text-indigo-500 mb-3 opacity-80 group-hover:scale-110 group-hover:text-indigo-400 transition-all duration-300" />
                                <h3 className="text-3xl font-bold text-white mb-1 font-mono tracking-tighter">{stat.value}</h3>
                                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{stat.label}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* --- FEATURES GRID (BENTO STYLE) --- */}
            <section className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold mb-6"
                        >
                            Engineered for <span className="text-indigo-400">Scale</span>
                        </motion.h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Our architecture provides the robust foundation needed for enterprise-grade
                            predictive analytics.
                        </p>
                    </div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {features.map((feature, i) => (
                            <motion.div key={i} variants={fadeInUp} className="h-full">
                                <SpotlightCard className="h-full p-8 transition-all hover:-translate-y-1">
                                    <div className={`w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-6 ${feature.color}`}>
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                        {feature.desc}
                                    </p>
                                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center text-xs font-mono text-slate-500 uppercase tracking-wider group-hover:text-white transition-colors">
                                        Explore <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>



            {/* --- CTA SECTION --- */}
            <section className="py-24 relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="rounded-[3rem] bg-gradient-to-b from-slate-800 to-slate-950 border border-white/10 p-12 md:p-20 text-center overflow-hidden relative"
                    >
                        {/* Background Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-2xl mb-8">
                                <Rocket className="w-8 h-8 text-indigo-400" />
                            </div>

                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Ready to launch?
                            </h2>
                            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                                Join the 10,000+ data scientists and engineers building the future
                                with Praedico today.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={handleGetStarted}
                                    className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 rounded-full font-bold hover:bg-indigo-50 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                >
                                    Get Started Now
                                </button>
                                <Link
                                    href="/docs"
                                    className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 text-white rounded-full font-bold hover:bg-white/5 transition-all"
                                >
                                    Read Documentation
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- MODALS --- */}
            <RegisterModal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} onSwitchToLogin={handleSwitchToLogin} />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onSwitchToRegister={handleSwitchToRegister} />

        </div>
    );
}