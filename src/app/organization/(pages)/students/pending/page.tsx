"use client";

import { useState, useEffect } from 'react';
import { Check, X, GraduationCap, Mail, Phone, Loader2, Calendar, ShieldCheck } from 'lucide-react';
import { organizationApi } from '@/lib/api';

interface Student {
    _id: string;
    name: string;
    email: string;
    mobile: string;
    department: {
        _id: string;
        departmentName: string;
    };
    registrationNumber?: string;
    createdAt: string;
}

export default function PendingStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingStudents();
    }, []);

    const fetchPendingStudents = async () => {
        try {
            const data = await organizationApi.getPendingStudents();
            if (data.success) {
                setStudents(data.students || []);
            }
        } catch (e) {
            console.error('Failed to fetch pending students', e);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (studentId: string) => {
        setProcessing(studentId);
        try {
            await organizationApi.approveStudent(studentId);
            // Optimistic update
            setStudents(prev => prev.filter(s => s._id !== studentId));
        } catch (e: any) {
            alert(e.response?.data?.message || 'Approval failed');
            fetchPendingStudents(); // Revert on fail
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (studentId: string) => {
        if (!confirm('Are you sure you want to reject this student?')) return;
        setProcessing(studentId);
        try {
            await organizationApi.rejectStudent(studentId);
            // Optimistic update
            setStudents(prev => prev.filter(s => s._id !== studentId));
        } catch (e: any) {
            alert(e.response?.data?.message || 'Rejection failed');
            fetchPendingStudents(); // Revert on fail
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-orange-500/30 relative overflow-hidden p-6 md:p-10">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-down">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200 tracking-tight">
                            Pending Approvals
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium tracking-wide">
                            Student Registrations • {students.length} Pending
                        </p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center rounded-[32px] bg-[#0F172A]/50 border border-white/5 border-dashed animate-scale-in">
                        <div className="h-20 w-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
                            <ShieldCheck className="h-8 w-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">All Caught Up!</h3>
                        <p className="text-slate-500 mt-2 max-w-xs mx-auto">No pending student registrations found. Good job!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {students.map((student, index) => (
                            <div
                                key={student._id}
                                className="group relative bg-[#0F172A]/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 hover:border-orange-500/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                                style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg text-white font-bold border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                                <GraduationCap className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg tracking-tight line-clamp-1" title={student.name}>
                                                    {student.name}
                                                </h3>
                                                <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                                    {student.department?.departmentName || 'Unknown Dept'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-sm text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                                            <Mail className="w-4 h-4 text-slate-500" />
                                            <span className="truncate">{student.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                                            <Phone className="w-4 h-4 text-slate-500" />
                                            <span>{student.mobile}</span>
                                        </div>
                                        {student.registrationNumber && (
                                            <div className="flex items-center gap-3 text-sm text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                                                <ShieldCheck className="w-4 h-4 text-slate-500" />
                                                <span className="font-mono">{student.registrationNumber}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-slate-500 pl-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Applied: {new Date(student.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => handleApprove(student._id)}
                                            disabled={processing === student._id}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 border border-emerald-500/50 hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processing === student._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(student._id)}
                                            disabled={processing === student._id}
                                            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-bold transition-all disabled:opacity-50"
                                            title="Reject Application"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Global CSS for Animations */}
            <style jsx global>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .animate-slide-down { animation: slideDown 0.6s ease-out forwards; }
                .animate-scale-in { animation: scaleIn 0.4s ease-out forwards; }
                .animate-pulse-slow { animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
        </div>
    );
}
