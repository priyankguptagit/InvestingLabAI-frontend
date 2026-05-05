"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  X,
  CheckCircle2,
  Loader2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Award,
  Linkedin,
  Github,
  Twitter,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/shared-components/ui/button";
import { Card, CardContent } from "@/shared-components/ui/card";
import { Badge } from "@/shared-components/ui/badge";
import { Input } from "@/shared-components/ui/input";
import { Textarea } from "@/shared-components/ui/textarea";


/**
 * ContactsClient - A professional contact page with an integrated inquiry form.
 */
export default function ContactsClient() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    inquiryType: "General Inquiry",
    description: ""
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFormOpen]);

  const wordCount = formData.description.trim().split(/\s+/).filter(w => w.length > 0).length;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (wordCount > 100) return;
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/inquiries/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setSubmitStatus('success');
        setFormData({ name: "", email: "", mobile: "", inquiryType: "General Inquiry", description: "" });
        setTimeout(() => {
          setIsFormOpen(false);
          setSubmitStatus('idle');
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 font-sans pb-20 pt-32 lg:pt-40">

      {/* 1. SIMPLE HERO SECTION (Standardized) */}
      <section className="container mx-auto px-6 mb-16 text-center">
        <div className="max-w-4xl mx-auto space-y-3">
          <p className="inline-flex">
            <Badge variant="outline" className="text-xs md:text-sm font-bold uppercase tracking-[0.5em] text-indigo-400 border-indigo-500/30 bg-indigo-500/5 px-4 py-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
              We are here to help
            </Badge>
          </p>
          <h1 className="text-2xl md:text-3xl lg:text-5xl font-black tracking-tight leading-tight text-white animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-3xl mx-auto">
            We'd love to <span className="text-indigo-500">hear from you.</span> Get in touch with our team daily.
          </h1>
          <div className="pt-6">
            <div className="h-1 w-20 bg-indigo-600 mx-auto rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
          </div>
        </div>
      </section>

      {/* 2. CONTACT INFO & DETAILS SECTION - Equal Split Layout */}
      <section className="container mx-auto px-6 mb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
          {/* Left Side: Text Content */}
          <div className="flex flex-col justify-between h-full space-y-10">
            <div className="space-y-6">
              <div className="inline-flex">
                <Badge variant="outline" className="px-4 py-1.5 rounded-full border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  Support & Assistance
                </Badge>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight text-white">
                We're here to <span className="text-indigo-500">support your journey</span>
              </h2>
              <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">
                Whether you have questions about our institutional-grade research or need technical support with the platform, our dedicated team is standing by to assist you.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center gap-4 group">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all duration-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.3em] mb-1">Email Us</p>
                    <p className="text-base font-bold text-white">support@stocksphere.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 transition-all duration-500">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.3em] mb-1">Call Us</p>
                    <p className="text-base font-bold text-white">+91 98765 43210</p>
                  </div>
                </div>
              </div>

              {/* Contact Us Button - Moved here */}
              <div className="pt-2">
                <Button
                  onClick={() => setIsFormOpen(true)}
                  size="lg"
                  className="group relative px-6 py-6 rounded-2xl bg-indigo-600 text-white font-black text-sm overflow-hidden transition-all hover:scale-105 hover:shadow-[0_20px_50px_-20px_rgba(79,70,229,0.4)] flex items-center gap-2 active:scale-95 w-full sm:w-auto justify-center hover:bg-indigo-700 uppercase tracking-widest h-auto"
                >
                  <span className="relative z-10">CONTACT US NOW</span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-500" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Side: Image Container - Equal height with improved hover */}
          <div className="relative h-full min-h-[400px] lg:min-h-[500px]">
            <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/20 via-transparent to-fuchsia-500/20 rounded-3xl blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
            <div className="relative h-full w-full rounded-3xl border border-white/10 overflow-hidden shadow-2xl bg-slate-900/50 group transition-all duration-700">
              <Image
                src="/images/contact.png"
                alt="Getting in Touch with Stocksphere"
                fill
                className="object-cover transform group-hover:scale-110 transition-transform duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. OUR CONTACT INFO Section Header */}
      <section className="container mx-auto px-6 mb-12">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
            Our <span className="text-indigo-500">Contact Info</span>
          </h2>
          <div className="h-1 w-20 bg-indigo-600 mx-auto rounded-full mb-6 shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
          <p className="text-slate-400 max-w-xl mx-auto text-base">
            Reach out to us through any of these channels and we'll get back to you promptly
          </p>
        </div>
      </section>

      {/* 4. CONTACT INFO CARDS - All cards with consistent design */}
      <section className="container mx-auto px-6 mb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Email Info Card */}
          <Card className="p-8 rounded-3xl bg-gradient-to-b from-indigo-900/20 to-transparent border-indigo-500/30 flex flex-col items-center text-center group relative overflow-hidden hover:border-indigo-500/50 hover:-translate-y-2 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20">
            <CardContent className="p-0 relative z-10 w-full flex flex-col items-center">
              <div className="p-5 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all duration-700">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-tight">Write to Us</h3>
              <p className="text-slate-400 text-xs mb-4 leading-relaxed font-medium">Our friendly team is here to help with all your inquiries.</p>
              <p className="text-lg font-black text-indigo-400 tracking-tight">support@stocksphere.com</p>
            </CardContent>
          </Card>

          {/* Address Info Card */}
          <Card className="p-8 rounded-3xl bg-gradient-to-b from-indigo-900/20 to-transparent border-indigo-500/30 flex flex-col items-center text-center group relative overflow-hidden hover:border-indigo-500/50 hover:-translate-y-2 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20">
            <CardContent className="p-0 relative z-10 w-full flex flex-col items-center">
              <div className="p-5 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all duration-700">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-tight">Our Presence</h3>
              <p className="text-slate-400 text-xs mb-4 leading-relaxed font-medium">Visit our regional headquarters for in-person consultation.</p>
              <p className="text-base font-black text-indigo-400 tracking-tight leading-tight">123, FinTech Tower, <br /> BKC, Mumbai, India</p>
            </CardContent>
          </Card>

          {/* Support Hours Card */}
          <Card className="p-8 rounded-3xl bg-gradient-to-b from-indigo-900/20 to-transparent border-indigo-500/30 flex flex-col items-center text-center group relative overflow-hidden hover:border-indigo-500/50 hover:-translate-y-2 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20">
            <CardContent className="p-0 relative z-10 w-full flex flex-col items-center">
              <div className="p-5 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all duration-700">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-6 tracking-tight">Support Hours</h3>
              <div className="space-y-3 w-full">
                <div className="flex justify-between items-center text-[10px] p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all duration-500">
                  <span className="text-slate-400 font-bold uppercase tracking-widest">Mon - Fri</span>
                  <span className="font-black text-white">9 AM - 6 PM</span>
                </div>
                <div className="flex justify-between items-center text-[10px] p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all duration-500">
                  <span className="text-slate-400 font-bold uppercase tracking-widest">Sat - Sun</span>
                  <span className="font-black text-indigo-400">10 AM - 4 PM</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5. ABOUT DEVELOPERS SECTION */}
      <section className="container mx-auto px-6 mb-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              <Sparkles className="w-3 h-3" /> The Architects
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Minds Behind <span className="text-indigo-500">The Machine.</span>
            </h2>
            <div className="h-1 w-20 bg-indigo-600 mx-auto rounded-full mb-6 shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
            <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-medium">
              Three passionate developers united by a shared vision: to build extraordinary intelligence that reshapes industries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Priyank Gupta */}
            <Card className="p-8 rounded-3xl bg-slate-900/40 border-indigo-500/30 flex flex-col items-center text-center group relative overflow-hidden hover:border-indigo-500/60 hover:-translate-y-2 transition-all duration-500 shadow-2xl backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-0 relative z-10 w-full flex flex-col items-center">
                {/* Badge */}
                <div className="absolute -top-2 -right-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black rounded-full flex items-center gap-1 uppercase tracking-wider">
                  <Award className="w-3 h-3" /> Leader
                </div>
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-400 p-1 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-indigo-500/20">
                  <div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center font-black text-3xl text-white">P</div>
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white mb-1 group-hover:text-indigo-400 transition-colors">Priyank Gupta</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Team Leader & Mastermind</p>
                <p className="text-sm text-slate-400 leading-relaxed font-medium mb-6 line-clamp-3">
                  The heart and soul of Team Praedico. Priyank leads with vision, passion, and innovation, turning ambitious ideas into reality.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                  {["Strategy", "Strategy", "Innovation", "Product Design"].map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-auto">
                  <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Linkedin className="w-4 h-4" /></a>
                  <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Github className="w-4 h-4" /></a>
                  <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Twitter className="w-4 h-4" /></a>
                </div>
              </CardContent>
            </Card>

            {/* Arjun Singh Bhadauriya */}
            <Card className="p-8 rounded-3xl bg-slate-900/40 border-blue-500/30 flex flex-col items-center text-center group relative overflow-hidden hover:border-blue-500/60 hover:-translate-y-2 transition-all duration-500 shadow-2xl backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-0 relative z-10 w-full flex flex-col items-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 p-1 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-blue-500/20">
                  <div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center font-black text-3xl text-white">A</div>
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white mb-1 group-hover:text-blue-400 transition-colors text-[20px]">Arjun Singh Bhadauriya</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Core Developer & Architect</p>
                <p className="text-sm text-slate-400 leading-relaxed font-medium mb-6 line-clamp-3">
                  Master of clean code and scalable architecture. Arjun transforms complex problems into elegant solutions with precision.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                  {["System Design", "Full-Stack", "Database", "DevOps"].map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-auto">
                  <a href="https://www.linkedin.com/in/arjun-singh-bhadauriya/" target="_blank" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Linkedin className="w-4 h-4" /></a>
                  <a href="https://github.com/22Arjun" target="_blank" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Github className="w-4 h-4" /></a>
                  <a href="https://x.com/ArjunSBhadoriya" target="_blank" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Twitter className="w-4 h-4" /></a>
                </div>
              </CardContent>
            </Card>

            {/* Sambhav Jain */}
            <Card className="p-8 rounded-3xl bg-slate-900/40 border-emerald-500/30 flex flex-col items-center text-center group relative overflow-hidden hover:border-emerald-500/60 hover:-translate-y-2 transition-all duration-500 shadow-2xl backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-0 relative z-10 w-full flex flex-col items-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 p-1 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-emerald-500/20">
                  <div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center font-black text-3xl text-white">S</div>
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white mb-1 group-hover:text-emerald-400 transition-colors">Sambhav Jain</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Core Developer & Innovator</p>
                <p className="text-sm text-slate-400 leading-relaxed font-medium mb-6 line-clamp-3">
                  Creative problem-solver and tech enthusiast. Sambhav brings cutting-edge solutions and relentless energy to every project.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                  {["Frontend", "UI/UX", "Three.js", "Animations"].map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-auto">
                  <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Linkedin className="w-4 h-4" /></a>
                  <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Github className="w-4 h-4" /></a>
                  <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Twitter className="w-4 h-4" /></a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. FULL SCREEN CONTACT MODAL FORM - Properly Sized */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4 pb-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header Gradient Accent */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500" />

              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

              {/* Header - Fixed */}
              <div className="relative z-10 p-5 md:p-6 pb-4 flex justify-between items-start border-b border-white/10 flex-shrink-0">
                <div className="space-y-1">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
                    Send an Inquiry
                  </h3>
                  <p className="text-slate-400 font-medium text-sm max-w-xl">
                    Fill out the form below and our team will get back to you within 24 business hours.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFormOpen(false)}
                  className="h-10 w-10 rounded-2xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all active:scale-90 shadow-inner border border-white/10 hover:border-rose-500/30"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form Content - No scroll, fits viewport */}
              <div className="relative z-10">
                <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        required
                        type="text"
                        placeholder="e.g. Priyank Gupta"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full h-14 px-6 rounded-[1.5rem] bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:ring-indigo-500/50 focus:bg-white/20 transition-all font-bold text-base hover:border-indigo-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        required
                        type="email"
                        pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                        title="Please enter a valid email address"
                        placeholder="e.g. support@stocksphere.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase().replace(/\s/g, '') })}
                        className="w-full h-14 px-6 rounded-[1.5rem] bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:ring-indigo-500/50 focus:bg-white/20 transition-all font-bold text-base hover:border-indigo-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        required
                        type="tel"
                        pattern="\d{10}"
                        maxLength={10}
                        title="Please enter exactly 10 digits"
                        placeholder="e.g. 9876543210"
                        value={formData.mobile}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({ ...formData, mobile: val });
                        }}
                        className="w-full h-14 px-6 rounded-[1.5rem] bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:ring-indigo-500/50 focus:bg-white/20 transition-all font-bold text-base hover:border-indigo-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                        Inquiry Type <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="inquiryType"
                          value={formData.inquiryType}
                          onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                          required
                          className="w-full h-14 px-6 rounded-[1.5rem] bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all font-bold text-base hover:border-indigo-500/50 appearance-none cursor-pointer"
                        >
                          <option value="General Inquiry" className="bg-[#0f172a] text-white">General Inquiry</option>
                          <option value="Technical Support" className="bg-[#0f172a] text-white">Technical Support</option>
                          <option value="Business Partnership" className="bg-[#0f172a] text-white">Business Partnership</option>
                          <option value="Investment Research" className="bg-[#0f172a] text-white">Investment Research</option>
                          <option value="Platform Access" className="bg-[#0f172a] text-white">Platform Access</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-2 mr-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        Inquiry Details <span className="text-rose-500">*</span>
                      </label>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${wordCount > 100 ? 'text-rose-500' : 'text-slate-500'}`}>
                        {wordCount} / 100 words
                      </span>
                    </div>
                    <Textarea
                      required
                      rows={3}
                      placeholder="Tell us more about how we can help you..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`w-full px-6 py-4 rounded-[1.5rem] bg-white/10 text-white placeholder:text-slate-500 focus:bg-white/20 transition-all font-bold text-base resize-none ${wordCount > 100 ? 'border-rose-500/50 focus:ring-rose-500/50' : 'border-white/20 focus:ring-indigo-500/50 hover:border-indigo-500/50'}`}
                    />
                  </div>

                  <Button
                    disabled={isSubmitting || submitStatus === 'success' || wordCount > 100}
                    type="submit"
                    size="lg"
                    className={`w-full py-5 rounded-[1.8rem] font-black text-lg flex items-center justify-center gap-4 transition-all ${submitStatus === 'success'
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-600 shadow-2xl shadow-indigo-600/30 active:scale-95'
                      }`}
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      submitStatus === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <Send className="w-5 h-5" />
                    )}
                    {isSubmitting ? 'PROCESSING...' : (submitStatus === 'success' ? 'MESSAGE SENT' : 'SUBMIT INQUIRY')}
                  </Button>

                  {submitStatus === 'error' && (
                    <p className="text-center text-rose-500 text-sm font-black flex items-center justify-center gap-2">
                      <X className="w-4 h-4" /> Submission failed. Please try again.
                    </p>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.8);
        }
      `}</style>

    </div>
  );
}