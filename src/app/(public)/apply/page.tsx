"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  User,
  Mail,
  Phone,
  FileText,
  UploadCloud,
  Send,
  CheckCircle2,
  FolderOpen,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { Card, CardContent } from "@/shared-components/ui/card";
import { Badge } from "@/shared-components/ui/badge";
import { careerApi } from "@/lib/api/career.api";

export default function ApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [formErrors, setFormErrors] = useState({
    name: "",
    mobile: "",
    email: ""
  });

  const [formData, setFormData] = useState({
    type: "FullTime",
    category: "Technical",
    name: "",
    email: "",
    mobile: "",
    description: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormErrors(prev => ({ ...prev, [name]: "" }));

    if (name === "name") {
      if (value !== "" && !/^[a-zA-Z\s]*$/.test(value)) {
        setFormErrors(prev => ({ ...prev, name: "Name should contain only alphabets and spaces." }));
        return;
      }
    }

    if (name === "mobile") {
      if (value !== "" && !/^\d*$/.test(value)) {
        setFormErrors(prev => ({ ...prev, mobile: "Mobile should contain only numbers." }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setFileError("Only PDF files are allowed.");
        e.target.value = "";
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setFileError("File size must not exceed 2 MB.");
        e.target.value = "";
        return;
      }
      setResumeFile(file);
      setFileName(file.name);
    }
  };

  const wordCount = formData.description.trim().split(/\s+/).filter(w => w.length > 0).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wordCount > 200) return;
    
    if (formData.name.trim().length < 2) {
      setFormErrors(prev => ({ ...prev, name: "Please enter a valid full name." }));
      return;
    }
    
    if (formData.mobile.length !== 10) {
      setFormErrors(prev => ({ ...prev, mobile: "Mobile number must be exactly 10 digits." }));
      return;
    }

    if (!resumeFile) {
      setFileError("Please upload your resume (PDF, max 2 MB).");
      return;
    }
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("fullName", formData.name);
      payload.append("email", formData.email);
      payload.append("mobile", formData.mobile);
      payload.append("inquiryType", `${formData.type} - ${formData.category}`);
      payload.append("description", formData.description);
      payload.append("resume", resumeFile);

      await careerApi.submitApplication(payload);
      
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Submission error:", error);
      setFileError(error.message || "Failed to submit application. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 font-sans pb-20 pt-32 lg:pt-40 overflow-x-hidden">

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 blur-[120px] rounded-full animate-pulse decoration-delay-2000" />
      </div>

      {/* 1. HERO SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-6 mb-16 text-center relative z-10"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex"
          >
            <Badge variant="outline" className="text-xs md:text-sm font-bold uppercase tracking-[0.5em] text-indigo-400 border-indigo-500/30 bg-indigo-500/5 px-4 py-1 rounded-full">
              Careers at PGR
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white"
          >
            Join the future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">Trading Intelligence</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            We are looking for exceptional talent to build the next generation of quantitative analysis and institutional-grade tools.
          </motion.p>
        </div>
      </motion.section>

      {/* 2. APPLICATION FORM SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="container mx-auto px-6 relative z-10"
      >
        <div className="max-w-4xl mx-auto">
          {isSubmitted ? (
            <Card className="bg-slate-900/50 border border-indigo-500/30 backdrop-blur-xl p-8 md:p-12 text-center rounded-3xl shadow-2xl">
              <CardContent className="flex flex-col items-center justify-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white">Application Sent</h2>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left w-full max-w-lg mt-4 space-y-3">
                  <h3 className="text-lg font-semibold text-indigo-300 border-b border-white/10 pb-2 mb-3">Application Details</h3>
                  <p className="text-slate-300"><span className="text-slate-500 font-medium w-24 inline-block">Name:</span> {formData.name}</p>
                  <p className="text-slate-300"><span className="text-slate-500 font-medium w-24 inline-block">Email:</span> {formData.email}</p>
                  <p className="text-slate-300"><span className="text-slate-500 font-medium w-24 inline-block">Mobile:</span> {formData.mobile}</p>
                  <p className="text-slate-300"><span className="text-slate-500 font-medium w-24 inline-block">Position:</span> {formData.type} - {formData.category}</p>
                  <p className="text-slate-300"><span className="text-slate-500 font-medium w-24 inline-block">Resume:</span> {fileName}</p>
                  <div className="mt-2 text-slate-400 text-sm italic border-t border-white/10 pt-3 break-words">
                    "{formData.description}"
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.1)] overflow-hidden relative">

              {/* Form Glow */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

              <CardContent className="p-8 md:p-12 relative z-10">
                <div className="mb-10 text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">Submit Your Application</h2>
                  <p className="text-sm text-slate-400">Fill out the form below to apply for a position.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* Row 1 — Position Type & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> Position Type
                      </label>
                      <div className="relative">
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-[#0F172A]/80 border border-white/10 rounded-xl px-4 py-3 pr-10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                        >
                          <option value="FullTime">Full Time</option>
                          <option value="PartTime">Part Time</option>
                          <option value="Internship">Internship</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <FolderOpen className="w-3.5 h-3.5 text-fuchsia-400" /> Category
                      </label>
                      <div className="relative">
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-[#0F172A]/80 border border-white/10 rounded-xl px-4 py-3 pr-10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 transition-all appearance-none cursor-pointer"
                        >
                          <option value="Technical">Technical</option>
                          <option value="Non-Technical">Non-Technical</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Row 2 — Full Name & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-indigo-400" /> Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="John Doe"
                        className={`w-full bg-[#0F172A]/80 border ${formErrors.name ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-indigo-500/50'} rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all`}
                      />
                      {formErrors.name && (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {formErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="john@example.com"
                        className="w-full bg-[#0F172A]/80 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 3 — Mobile Number & Resume Upload */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-indigo-400" /> Mobile Number
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        required
                        pattern="\d{10}"
                        maxLength={10}
                        title="Please enter exactly 10 digits"
                        placeholder="e.g. 9876543210"
                        className={`w-full bg-[#0F172A]/80 border ${formErrors.mobile ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-indigo-500/50'} rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all`}
                      />
                      {formErrors.mobile && (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {formErrors.mobile}
                        </p>
                      )}
                    </div>

                    {/* Resume Upload — inline */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <UploadCloud className="w-3.5 h-3.5 text-indigo-400" /> Resume
                        <span className="text-slate-600 font-normal normal-case tracking-normal">(PDF · max 2 MB)</span>
                      </label>
                      <div className="relative group cursor-pointer">
                        <input
                          type="file"
                          id="resume"
                          accept="application/pdf"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          required
                        />
                        <div className={`w-full border-2 border-dashed rounded-xl px-4 py-3 flex items-center gap-3 bg-[#0F172A]/50 transition-all ${fileError
                          ? 'border-red-500/50'
                          : fileName
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : 'border-white/10 group-hover:bg-[#0F172A] group-hover:border-indigo-500/50'
                          }`}>
                          <div className={`p-2 rounded-full shrink-0 ${fileError ? 'bg-red-500/10 text-red-400' : fileName ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                            }`}>
                            {fileError ? <AlertCircle className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            {fileName ? (
                              <>
                                <p className="text-emerald-300 font-medium text-sm truncate">{fileName}</p>
                                <p className="text-xs text-slate-500">Uploaded successfully</p>
                              </>
                            ) : (
                              <>
                                <p className="text-slate-300 text-sm group-hover:text-white transition-colors">Click to upload PDF</p>
                                <p className="text-xs text-slate-600">Max file size: 2 MB</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {fileError && (
                        <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" /> {fileError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" /> Description / Cover Letter
                      </label>
                      <span className={`text-xs ${wordCount > 200 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                        {wordCount} / 200 words
                      </span>
                    </div>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      placeholder="Tell us why you are a great fit..."
                      className={`w-full bg-[#0F172A]/80 border ${wordCount > 200 ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-indigo-500/50'} rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all resize-none`}
                    />
                  </div>



                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting || wordCount > 200}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold text-lg hover:from-indigo-500 hover:to-fuchsia-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Submit Application <Send className="w-5 h-5 ml-2" /></>
                      )}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.section>

    </div>
  );
}
