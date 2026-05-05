"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import IntegrationsMarquee from "@/app/user/_components/IntegrationsMarquee";
import {
    ArrowRight, CheckCircle2, Play,
    Shield, Zap, Globe, BarChart3, Lock, Smartphone, Check,
    Building2, Verified, Users2, Activity, Star, Quote,
    ChevronLeft, ChevronRight, X, Filter, SortAsc, SortDesc,
    Search, LayoutGrid, Calendar, ThumbsUp, ThumbsDown,
    RefreshCcw, Clock, Trash2, Eraser, MessageSquare, ListFilter,
    Settings2, ChevronDown
} from "lucide-react";
import LoginModal from "@/app/user/_components/LoginModal";
import RegisterModal from "@/app/user/_components/RegisterModal";
import { Button } from "@/shared-components/ui/button";
import { Card, CardContent } from "@/shared-components/ui/card";
import { Badge } from "@/shared-components/ui/badge";
import { feedbackApi } from "@/lib/api";
import { Stock } from "@/lib/types/stock.types";
import TestimonialCarousel from "@/app/(public)/_components/TestimonialCarousel";

export default function LandingClient() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isPartnersModalOpen, setIsPartnersModalOpen] = useState(false);
    const [feedbackSort, setFeedbackSort] = useState<'latest' | 'oldest' | 'rating_high' | 'rating_low'>('latest');

    // Remote data state
    const [publicTestimonials, setPublicTestimonials] = useState<any[]>([]);
    const [niftyStocks, setNiftyStocks] = useState<Stock[]>([]);
    const [etfStocks, setEtfStocks] = useState<Stock[]>([]);

    const fetchTickerData = async () => {
        try {
            const [niftyRes, etfRes] = await Promise.all([
                fetch('/api/stocks/nifty50').then(r => r.json()),
                fetch('/api/stocks/etf').then(r => r.json()),
            ]);
            if (niftyRes.success) setNiftyStocks(niftyRes.data);
            if (etfRes.success) setEtfStocks(etfRes.data);
        } catch (error) {
            console.error("Error fetching ticker data:", error);
        }
    };

    useEffect(() => {
        fetchTickerData();
        const interval = setInterval(fetchTickerData, 120000); // 2 mins
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                const res = await feedbackApi.getPublicTestimonials(100);
                if (res.success && res.testimonials) {
                    setPublicTestimonials(res.testimonials);
                }
            } catch (err) {
                console.error("Failed to fetch public testimonials", err);
            }
        };
        fetchFeedbacks();
    }, []);

    const handleGetStarted = () => setIsRegisterModalOpen(true);
    const handleBrowseIntegrations = () => setIsRegisterModalOpen(true);

    // Carousel States
    const [partnerPage, setPartnerPage] = useState(0);



    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden font-sans pb-20">

            {/* PAGE BACKGROUND */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* DUAL TICKER SECTION */}
            <div className="relative mt-[72px] w-full bg-black/40 border-b border-white/5 flex flex-col select-none overflow-hidden py-2 z-20">

                {/* Row 1: NIFTY 50 */}
                <div className="h-7 flex items-center relative overflow-hidden border-b border-white/[0.03] mb-1">
                    <div className="absolute left-0 z-20 h-full w-28 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center border-r border-white/10 shadow-[4px_0_8px_rgba(0,0,0,0.5)]">
                        <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">NIFTY 50</span>
                    </div>
                    <div className="animate-marquee-dynamic-reverse hover:[animation-play-state:paused] flex items-center gap-12 whitespace-nowrap pl-32 pr-4" style={{ '--duration': `${niftyStocks.length * 5}s` } as React.CSSProperties}>
                        {(niftyStocks.length > 0 ? [...niftyStocks, ...niftyStocks] : []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.symbol}</span>
                                <span className="text-[11px] font-mono font-bold text-white transition-all duration-1000">₹{item.price.toFixed(2)}</span>
                                <span className={`text-[10px] font-bold flex items-center gap-1 ${item.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {item.change >= 0 ? '▲' : '▼'} {item.changePercent.toFixed(2)}%
                                </span>
                                <div className="h-2 w-px bg-white/10 mx-2" />
                            </div>
                        ))}
                    </div>
                </div>
                {/* Row 2: ETF */}
                <div className="h-7 flex items-center relative overflow-hidden">
                    <div className="absolute left-0 z-20 h-full w-28 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center border-r border-white/10 shadow-[4px_0_8px_rgba(0,0,0,0.5)]">
                        <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">ETF</span>
                    </div>
                    <div className="animate-marquee-dynamic hover:[animation-play-state:paused] flex items-center gap-12 whitespace-nowrap pl-32 pr-4" style={{ '--duration': `${etfStocks.length * 5}s` } as React.CSSProperties}>
                        {(etfStocks.length > 0 ? [...etfStocks, ...etfStocks] : []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.symbol}</span>
                                <span className="text-[11px] font-mono font-bold text-slate-200 transition-all duration-1000">₹{item.price.toFixed(2)}</span>
                                <span className={`text-[10px] font-bold flex items-center gap-1 ${item.change >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                                    {item.change >= 0 ? '▲' : '▼'} {item.changePercent.toFixed(2)}%
                                </span>
                                <div className="h-2 w-px bg-white/10 mx-2" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* HERO SECTION */}
            <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-32 overflow-hidden text-center">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <p className="inline-flex">
                            <Badge variant="outline" className="text-xs md:text-sm font-bold uppercase tracking-[0.5em] text-indigo-400 border-indigo-500/30 bg-indigo-500/5 px-4 py-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                Institutional Grade Research
                            </Badge>
                        </p>
                        <h1 className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tight leading-tight text-white animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            The Future of <span className="text-indigo-500">Stock Market Intelligence</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000 font-medium">
                            Experience the next generation of financial research. Beautifully designed, highly performant, and institutional-grade analytics for everyone.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        <Button
                            onClick={handleGetStarted}
                            size="lg"
                            className="w-full sm:w-auto px-8 py-7 rounded-full bg-indigo-600 text-white font-bold shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group"
                        >
                            Start Your Journey <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            asChild
                            className="w-full sm:w-auto px-8 py-7 rounded-full bg-[#0f172a]/50 border-slate-700 text-white font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2 backdrop-blur-md hover:border-slate-500"
                        >
                            <Link href="/pricing">View All Plans</Link>
                        </Button>
                    </div>

                    {/* VIDEO SHOWCASE */}
                    <div className="mt-12 relative mx-auto max-w-4xl animate-reveal" style={{ animationDelay: '0.5s' }}>
                        {/* Glow ring */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500 rounded-2xl blur opacity-30 animate-pulse pointer-events-none" />

                        {/* Glass frame */}
                        <div className="relative rounded-2xl bg-[#0f172a]/80 border border-slate-700/50 backdrop-blur-xl p-1 shadow-2xl">
                            {/* Window chrome bar */}
                            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                                <span className="ml-3 text-[10px] text-slate-500 font-mono tracking-widest uppercase">Praedico · Market Intelligence</span>
                            </div>

                            {/* 16:9 YouTube embed */}
                            <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute inset-0 w-full h-full"
                                    src="https://www.youtube-nocookie.com/embed/p7HKvqRI_Bo?rel=0&modestbranding=1&color=white"
                                    title="How Stock Markets Work – Praedico Market Intelligence"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    loading="lazy"
                                />
                            </div>
                        </div>

                        {/* Caption pill */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-white/10 backdrop-blur-md shadow-lg whitespace-nowrap">
                            <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">How Stock Markets Work</span>
                        </div>
                    </div>
                </div>
            </section>


            {/* INTEGRATIONS MARQUEE */}
            <div className="relative">
                <IntegrationsMarquee onBrowseClick={handleBrowseIntegrations} />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20">
                    {/* Browse All Integrations button commented out */}
                </div>
            </div>

            {/* LOGO STRIP - MODERNIZED */}
            <section className="py-20 border-b border-white/5 bg-[#020617] relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] rounded-full -translate-y-1/2" />

                <div className="container mx-auto px-6 text-center relative z-10">
                    <p className="text-[10px] font-black text-slate-500 mb-12 uppercase tracking-[0.4em] opacity-80">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-500 via-white to-slate-500">
                            Trusted by industry leaders
                        </span>
                    </p>

                    <div className="relative group perspective-[1000px]">
                        <div className="flex gap-12 w-max animate-scroll-brand hover:[animation-play-state:paused] py-4">
                            {[...Array(4)].map((_, i) => (
                                <React.Fragment key={i}>
                                    {['Acme Corp', 'GlobalTech', 'Nebula', 'Velocity', 'Quantum'].map((logo, idx) => (
                                        <div
                                            key={`${i}-${idx}`}
                                            className="px-8 py-3 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 hover:scale-110 hover:-translate-y-1 cursor-pointer flex items-center justify-center group/logo hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                                            style={{ transform: 'rotateX(10deg)' }}
                                        >
                                            <span className="text-xl font-black text-white/30 group-hover/logo:text-white transition-colors tracking-tight whitespace-nowrap">
                                                {logo}
                                            </span>
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Side Fades */}
                        <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#020617] to-transparent z-20 pointer-events-none" />
                        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#020617] to-transparent z-20 pointer-events-none" />
                    </div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section className="py-24 bg-[#020617] relative overflow-hidden border-t border-white/5">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-fuchsia-600/8 rounded-full blur-[140px] pointer-events-none" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400 mb-4">Platform</p>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Why Choose <span className="text-indigo-500">Praedico?</span></h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Our platform provides comprehensive solutions for modern traders, ensuring institutional-grade accuracy and speed.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        <FeatureCard icon={Globe} color="text-blue-400" bg="from-blue-500/20 to-cyan-500/5" title="Global Market Data" desc="Real-time insights from NSE and international exchanges delivered in milliseconds." delay="0s" />
                        <FeatureCard icon={Lock} color="text-fuchsia-400" bg="from-fuchsia-500/20 to-pink-500/5" title="Institutional Security" desc="Bank-grade encryption and security protocols protecting your research and data." delay="0.1s" />
                        <FeatureCard icon={Smartphone} color="text-emerald-400" bg="from-emerald-500/20 to-teal-500/5" title="Seamless Mobility" desc="Access pro-level signals and market trackers on any device with our optimized web app." delay="0.2s" />
                    </div>
                </div>
            </section>

            {/* OUR PLATFORM STATISTICS */}
            <section className="py-24 bg-[#020617] relative overflow-hidden border-t border-white/5">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-600/8 rounded-full blur-[140px] pointer-events-none" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400 mb-4">By The Numbers</p>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Platform <span className="text-indigo-500">Statistics</span></h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Empowering transparency and institutional accuracy at scale for every trader.</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
                        <StatCard icon={Building2} label="Partnered Organizations" value="500+" desc="Global enterprise partners" delay="0s" color="text-blue-400" bg="from-blue-500/20 to-cyan-500/5" />
                        <StatCard icon={Verified} label="Verified Organizations" value="350+" desc="Rigorous quality audit" delay="0.1s" color="text-emerald-400" bg="from-emerald-500/20 to-teal-500/5" />
                        <StatCard icon={Users2} label="Registered Users" value="1.2M+" desc="Trusted by retail traders" delay="0.2s" color="text-indigo-400" bg="from-indigo-500/20 to-purple-500/5" />
                        <StatCard icon={Activity} label="Active Users" value="850K+" desc="Monthly active members" delay="0.3s" color="text-purple-400" bg="from-fuchsia-500/20 to-pink-500/5" />
                    </div>
                </div>
            </section>

            {/* APPROVED PARTNERS */}
            <section className="py-24 bg-[#020617] relative overflow-hidden border-t border-white/5">
                {/* Ambient glow matching TestimonialCarousel */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400 mb-4">Partnerships</p>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Approved <span className="text-indigo-500">Partners</span></h2>
                        <p className="text-slate-400 max-w-xl mx-auto mb-8">Collaborating with the world&apos;s most innovative financial entities and institutional researchers.</p>
                        <Button
                            onClick={() => setIsPartnersModalOpen(true)}
                            size="sm"
                            className="px-6 py-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95 text-xs h-auto backdrop-blur-md"
                        >
                            View All Partners
                        </Button>
                    </div>

                    {/* Partners carousel */}
                    <div className="px-4 max-w-5xl mx-auto">
                        <div className="relative group">
                            <div className="overflow-hidden">
                                <div
                                    className="flex transition-transform duration-700 ease-in-out"
                                    style={{ transform: `translateX(-${partnerPage * 100}%)` }}
                                >
                                    {[0, 1, 2, 3].map(page => (
                                        <div key={page} className="w-full flex-shrink-0 grid grid-cols-2 md:grid-cols-4 gap-6">
                                            {[1, 2, 3, 4].map(i => (
                                                <div
                                                    key={i}
                                                    className="group/card bg-white/[0.03] border border-white/10 rounded-3xl p-7 flex flex-col justify-between hover:border-white/15 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 backdrop-blur-sm cursor-pointer"
                                                >
                                                    <div>
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center mb-5 group-hover/card:bg-indigo-600 group-hover/card:border-indigo-400 transition-all duration-300">
                                                            <Building2 className="w-6 h-6 text-slate-400 group-hover/card:text-white" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-white uppercase tracking-tight">Partner Firm {page * 4 + i}</p>
                                                        <p className="text-xs text-slate-500 mt-1">{['Banking', 'Fintech', 'Brokerage', 'Institutional'][i - 1]}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-5">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-3 h-3 rounded-full bg-indigo-500/20 flex items-center justify-center relative">
                                                                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
                                                                <Verified className="w-2 h-2 text-indigo-400 relative z-10" />
                                                            </div>
                                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Verified</span>
                                                        </div>
                                                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover/card:text-indigo-400 group-hover/card:translate-x-1 transition-all" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Nav buttons */}
                            {[0, 1, 2, 3].length > 1 && (
                                <>
                                    <button
                                        onClick={() => setPartnerPage(prev => (prev - 1 + 4) % 4)}
                                        className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 border border-white/10 bg-transparent text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all p-2 rounded-full"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setPartnerPage(prev => (prev + 1) % 4)}
                                        className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 border border-white/10 bg-transparent text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all p-2 rounded-full"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Dots */}
                        <div className="flex justify-center gap-2 mt-8">
                            {[0, 1, 2, 3].map(i => (
                                <button
                                    key={i}
                                    onClick={() => setPartnerPage(i)}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${partnerPage === i ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-700'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* USER FEEDBACK SECTION */}
            <div className="relative">
                <TestimonialCarousel onViewAll={publicTestimonials.length > 0 ? () => setIsFeedbackModalOpen(true) : undefined} />
            </div>




            {/* CTA SECTION */}
            <section className="py-24 relative overflow-hidden flex justify-center border-t border-white/5">
                {/* Decorative background glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-fuchsia-600/10 rounded-full blur-[80px] pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto relative group">
                        {/* Gradient outline glow */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/40 via-fuchsia-500/40 to-indigo-500/40 rounded-[2rem] blur opacity-40 group-hover:opacity-70 transition duration-700"></div>

                        <div className="relative rounded-[2rem] bg-slate-950/80 border border-white/10 p-10 md:p-16 text-center backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col items-center">
                            {/* Inner decorative elements */}
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-1/3 -translate-y-1/3">
                                <Activity className="w-56 h-56 text-indigo-400" />
                            </div>

                            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5 text-white relative z-10 leading-tight">
                                Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">transform your trading?</span>
                            </h2>
                            <p className="text-base md:text-lg text-slate-300 mb-10 max-w-lg mx-auto font-medium relative z-10 leading-relaxed">
                                Join thousands of smart investors building their wealth with Praedico Global Research today.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 w-full sm:w-auto">
                                <Button
                                    onClick={handleGetStarted}
                                    size="lg"
                                    className="w-full sm:w-auto px-8 py-7 rounded-full bg-indigo-600 text-white font-bold shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                                >
                                    GET STARTED NOW <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    asChild
                                    className="w-full sm:w-auto px-8 py-7 rounded-full bg-white/[0.03] border-white/10 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-md"
                                >
                                    <Link href="/pricing">View Plans</Link>
                                </Button>
                            </div>

                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-8 relative z-10">
                                No credit card required. 7-day free trial.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* MODALS */}
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

            {/* USER FEEDBACK MODAL */}
            <FeedbackModal
                isOpen={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
                feedbackSort={feedbackSort}
                setFeedbackSort={setFeedbackSort}
                feedbackData={publicTestimonials}
            />



            {/* PARTNERS MODAL */}
            <PartnersModal
                isOpen={isPartnersModalOpen}
                onClose={() => setIsPartnersModalOpen(false)}
            />
        </div>
    );
}

// Helper Components
function FeatureCard({ icon: Icon, title, desc, delay, color, bg }: any) {
    return (
        <Card
            className="p-6 rounded-3xl bg-[#0f172a]/40 border-white/5 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-indigo-500/10"
            style={{ animationDelay: delay }}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${bg} rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <CardContent className="p-0">
                <div className={`inline-flex p-2.5 rounded-xl bg-slate-900 border border-slate-800 mb-5 ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white group-hover:text-indigo-200 transition-colors">{title}</h3>
                <p className="text-slate-400 leading-relaxed text-xs">{desc}</p>
            </CardContent>
        </Card>
    );
}

function StatCard({ icon: Icon, label, value, desc, delay, color, bg }: any) {
    return (
        <Card
            className="p-6 rounded-3xl bg-[#0f172a]/40 border-white/5 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-indigo-500/10"
            style={{ animationDelay: delay }}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${bg} rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <CardContent className="p-0">
                <div className={`p-3 rounded-xl bg-slate-900 border border-white/5 inline-flex mb-5 ${color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1.5">{label}</h4>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white tracking-tight">{value}</span>
                </div>
                <p className="text-slate-400 text-xs mt-3 font-medium opacity-60 group-hover:opacity-100 transition-opacity italic">{desc}</p>
            </CardContent>
        </Card>
    );
}




function FeedbackModal({ isOpen, onClose, feedbackSort, setFeedbackSort, feedbackData = [] }: any) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    if (!isOpen) return null;

    const mappedData = feedbackData.map((t: any) => ({
        name: t.authorName || "Anonymous",
        role: t.authorModel === 'User' ? 'User Portal' : 'Organization Portal',
        feedback: t.content || "One-time testimonial",
        rating: t.rating,
        date: new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        timestamp: new Date(t.createdAt).getTime(),
        factorRatings: t.factorRatings || [],
        type: t.type
    }));

    const filteredData = [...mappedData].filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.feedback.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' ||
            (filterCategory === 'experience' && item.type === 'multi_factor') ||
            (filterCategory === 'testimonial' && item.type === 'testimonial') ||
            (filterCategory === 'general' && item.type === 'general') ||
            (filterCategory === 'bug_fix' && item.type === 'bug_fix');
        return matchesSearch && matchesCategory;
    });

    const sortedData = [...filteredData].sort((a, b) => {
        if (feedbackSort === 'latest') return b.timestamp - a.timestamp;
        if (feedbackSort === 'oldest') return a.timestamp - b.timestamp;
        if (feedbackSort === 'rating_high') return (b.rating || 0) - (a.rating || 0);
        if (feedbackSort === 'rating_low') return (a.rating || 0) - (b.rating || 0);
        return 0;
    });

    const handleClearFilters = () => {
        setSearchTerm("");
        setFeedbackSort('latest');
        setFilterCategory('all');
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-6 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 bg-white/[0.02] rounded-t-[2rem]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400"><Users2 className="w-4 h-4" /></div>
                        <div><h3 className="text-lg font-black text-white">User Feedback</h3><p className="text-slate-500 text-[9px] font-black uppercase">{sortedData.length} verified reviews</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-1.5 w-40 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-600"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                className={`h-8 px-3 gap-2 rounded-lg border border-white/10 transition-all text-[10px] font-bold uppercase tracking-wider ${filterCategory !== 'all' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.05] text-slate-400'}`}
                            >
                                <ListFilter className="w-3.5 h-3.5" />
                                {filterCategory === 'all' ? 'Category' : filterCategory === 'experience' ? 'Experience' : filterCategory === 'testimonial' ? 'Testimonial' : filterCategory === 'bug_fix' ? 'Bug Fixes' : 'General'}
                                <ChevronDown className={`w-3 h-3 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                            </Button>

                            {isCategoryOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 duration-200">
                                        {[
                                            { id: 'all', label: 'All Categories', icon: LayoutGrid },
                                            { id: 'experience', label: 'Experience Ratings', icon: Activity },
                                            { id: 'testimonial', label: 'Testimonials', icon: Quote },
                                            { id: 'general', label: 'General Feedback', icon: MessageSquare },
                                            { id: 'bug_fix', label: 'Bug Fixes', icon: RefreshCcw },
                                        ].map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    setFilterCategory(cat.id);
                                                    setIsCategoryOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${filterCategory === cat.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                <cat.icon className="w-3.5 h-3.5" />
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Date Sort */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFeedbackSort(feedbackSort === 'latest' ? 'oldest' : 'latest')}
                            className={`h-8 px-2 gap-1.5 rounded-lg border border-white/10 transition-all text-[10px] font-bold uppercase tracking-wider ${feedbackSort === 'latest' || feedbackSort === 'oldest' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/[0.05] text-slate-400'}`}
                            title={feedbackSort === 'latest' ? 'Showing Latest First' : 'Showing Oldest First'}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            {feedbackSort === 'latest' ? 'Latest' : feedbackSort === 'oldest' ? 'Oldest' : 'Date'}
                        </Button>

                        {/* Rating Sort */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFeedbackSort(feedbackSort === 'rating_high' ? 'rating_low' : 'rating_high')}
                            className={`h-8 px-2 gap-1.5 rounded-lg border border-white/10 transition-all text-[10px] font-bold uppercase tracking-wider ${feedbackSort === 'rating_high' || feedbackSort === 'rating_low' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-white/[0.05] text-slate-400'}`}
                            title={feedbackSort === 'rating_high' ? 'Highest Rating First' : 'Lowest Rating First'}
                        >
                            <Star className="w-3.5 h-3.5" />
                            {feedbackSort === 'rating_high' ? 'High Rating' : feedbackSort === 'rating_low' ? 'Low Rating' : 'Rating'}
                        </Button>

                        <div className="w-px h-6 bg-white/10 mx-1" />

                        {/* Clear Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClearFilters}
                            className={`h-8 w-8 rounded-lg border transition-all ${searchTerm || filterCategory !== 'all' || feedbackSort !== 'latest' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' : 'bg-white/[0.05] border-white/10 text-slate-400 hover:text-white'}`}
                            title="Clear All Filters"
                        >
                            <Eraser className="w-3.5 h-3.5" />
                        </Button>

                        <button
                            onClick={onClose}
                            className="h-8 w-8 rounded-lg bg-white/[0.05] hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 text-slate-400 hover:text-white transition-all shadow-lg flex items-center justify-center backdrop-blur-md"
                        >
                            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#0f172a] z-10">
                            <tr className="border-b border-white/10 uppercase font-black text-slate-500 text-[9px] tracking-widest bg-[#0f172a] shadow-md shadow-indigo-900/5">
                                <th className="px-8 py-5 w-[20%] font-black tracking-widest text-[#6B7280]">USER</th>
                                <th className="px-5 py-5 w-[40%] font-black tracking-widest text-[#6B7280]">RATING BREAKDOWN</th>
                                <th className="px-5 py-5 w-[15%] font-black tracking-widest text-[#6B7280]">AVG RATING</th>
                                <th className="px-5 py-5 w-[25%] font-black tracking-widest text-[#6B7280]">DESCRIPTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center">
                                        <p className="text-slate-400 text-sm font-medium">No feedback found</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((item: any, i: number) => {
                                    const ratingMap: Record<string, number> = {};
                                    if (item.factorRatings && Array.isArray(item.factorRatings)) {
                                        item.factorRatings.forEach((f: any) => { ratingMap[f.factor] = f.score });
                                    }

                                    return (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-6 align-top">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                                                        {item.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white text-sm mb-0.5">{item.name}</h4>
                                                        <p className="text-slate-500 text-[10px] uppercase font-semibold tracking-wide">{item.role}</p>
                                                        <p className="text-slate-600 text-[10px] font-semibold mt-1">{item.date}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-6 align-top">
                                                {item.type === 'multi_factor' && item.factorRatings.length > 0 ? (
                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                                        {Object.entries(ratingMap).map(([fKey, score]) => {
                                                            const label = fKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                                            const isBlue = ["Support Reliability", "Ease Of Use"].includes(label);
                                                            const starColor = isBlue ? "text-blue-400 fill-blue-400" : "text-yellow-400 fill-yellow-400";
                                                            return (
                                                                <div key={fKey} className="flex flex-col">
                                                                    <span className="text-[10px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                                                                        <Activity className="w-3 h-3 text-indigo-400" /> {label}
                                                                    </span>
                                                                    <div className="flex gap-0.5">
                                                                        {[...Array(5)].map((_, s) => (
                                                                            <Star key={s} className={`w-3 h-3 ${s < (score as number) ? starColor : 'text-slate-800'}`} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-500 text-xs italic">One-time testimonial</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-6 align-top">
                                                {item.rating ? (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                                            <span className="text-lg font-black text-white">{item.rating.toFixed(1)}</span>
                                                            <span className="text-sm font-bold text-slate-500">/ 5</span>
                                                        </div>
                                                        <div className="flex gap-0.5 mt-2">
                                                            {[...Array(5)].map((_, s) => (
                                                                <Star key={s} className={`w-3 h-3 ${s < Math.round(item.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-800'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-600 font-bold text-lg">—</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-6 align-top">
                                                <p className="text-slate-300 text-sm italic leading-relaxed">"{item.feedback}"</p>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                    <div className="p-3 border-t border-white/5 bg-white/[0.02] rounded-b-[2rem]">
                        <p className="text-center text-[9px] text-slate-500 font-medium tracking-widest uppercase">
                            Showing {sortedData.length} records
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PartnersModal({ isOpen, onClose }: any) {
    const [searchTerm, setSearchTerm] = useState("");

    if (!isOpen) return null;

    const partners = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `PARTNER_V${String(i + 1).padStart(2, '0')}`,
        verified: true,
        category: i % 3 === 0 ? "Banking" : i % 3 === 1 ? "Fintech" : "Brokerage"
    }));

    const filteredPartners = partners.filter(partner =>
        partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-6 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-[#020617] border border-white/10 rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] flex flex-col shadow-[0_20px_100px_rgba(79,70,229,0.3)] relative overflow-hidden mt-0" onClick={(e) => e.stopPropagation()}>
                {/* Decorative Background Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[130px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-600/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="p-6 md:p-10 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 bg-white/[0.015] relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner group">
                            <LayoutGrid className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
                        </div>
                        <div>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                    Approved <span className="text-indigo-500">Partners</span>
                                </h3>
                                <div className="h-1 w-16 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30" />
                            </div>
                            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.4em] mt-3 opacity-80">Institutional Verified Ecosystem • Global Network</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search our network..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 pr-5 py-3.5 w-80 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-slate-600 shadow-inner"
                            />
                        </div>
                        <button
                            onClick={onClose}
                            className="h-12 w-12 rounded-2xl bg-white/[0.05] hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 text-slate-400 hover:text-white transition-all shadow-lg group flex items-center justify-center backdrop-blur-md"
                        >
                            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-12 relative z-10 custom-scrollbar pb-24">
                    {filteredPartners.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-80 text-center">
                            <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 shadow-inner animate-pulse">
                                <Building2 className="w-10 h-10 text-slate-800" />
                            </div>
                            <h4 className="text-xl text-white font-bold mb-3 tracking-tight">No results found</h4>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">Try adjusting your search to find a specific partner or category.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {filteredPartners.map((partner) => (
                                <div
                                    key={partner.id}
                                    className="group relative p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-indigo-500/40 hover:bg-white/[0.06] transition-all duration-500 hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)] hover:-translate-y-2 cursor-pointer flex flex-col justify-between min-h-[180px]"
                                >
                                    <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-400 group-hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all duration-300">
                                            <Building2 className="w-7 h-7 text-slate-400 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black text-sm tracking-tight group-hover:text-white transition-colors uppercase leading-tight">{partner.name}</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 opacity-80 group-hover:text-slate-400">{partner.category}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.05]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full bg-indigo-500/10 flex items-center justify-center relative">
                                                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
                                                <Verified className="w-2.5 h-2.5 text-indigo-400 relative z-10" />
                                            </div>
                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Institutional</span>
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
