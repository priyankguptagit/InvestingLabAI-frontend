"use client";

import { useState, useEffect } from 'react';
import {
    Check, X, GraduationCap, Mail, Phone, Search,
    Filter, MoreVertical, ChevronRight, UserCheck,
    Calendar, RefreshCcw, Loader2
} from 'lucide-react';
import { coordinatorApi } from '@/lib/api';

interface Student {
    _id: string;
    name: string;
    email: string;
    mobile: string;
    registrationNumber?: string;
    createdAt: string;
}

export default function CoordinatorPendingStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchPendingStudents();
    }, []);

    const fetchPendingStudents = async () => {
        setLoading(true);
        try {
            const data = await coordinatorApi.getPendingStudents();
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
            await coordinatorApi.approveStudent(studentId); // Fixed: api signature might differ, checking usage in prev file it was object but standard api usually id. Checking api definition... 
            // Actually previous file used { studentId, action: 'approve' } but api def says approveStudent(studentId). I will use the API definition I saw earlier: approveStudent: (studentId) => ...

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
            await coordinatorApi.rejectStudent(studentId);
            // Optimistic update
            setStudents(prev => prev.filter(s => s._id !== studentId));
        } catch (e: any) {
            alert(e.response?.data?.message || 'Rejection failed');
            fetchPendingStudents(); // Revert on fail
        } finally {
            setProcessing(null);
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden p-6 md:p-10">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-down">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                                Pending Approvals
                            </h1>
                            <button
                                onClick={fetchPendingStudents}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                                title="Refresh List"
                            >
                                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <p className="text-slate-500 mt-2 text-sm font-medium tracking-wide">
                            Coordinator Portal • Student Registrations
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/20 flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-orange-400" />
                            <span className="text-orange-400 font-bold">{students.length} Pending</span>
                        </div>
                    </div>
                </div>

                {/* Filters & Table */}
                <div className="rounded-[32px] bg-[#0F172A]/80 backdrop-blur-2xl border border-white/5 shadow-2xl overflow-hidden animate-slide-up">
                    <div className="p-6 border-b border-white/5 flex flex-col lg:flex-row gap-4 justify-between items-center bg-[#0F172A]/50">
                        {/* Search */}
                        <div className="relative w-full lg:w-96 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, email, reg no..."
                                className="block w-full pl-11 pr-4 py-3.5 bg-[#020617] border border-white/5 rounded-2xl text-sm text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all outline-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {/* Potential bulk actions here in future */}
                        </div>
                    </div>

                    <div className="relative min-h-[400px]">
                        {loading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F172A]/50 z-20">
                                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                                <p className="mt-4 text-sm text-slate-400 font-medium animate-pulse">Fetching approvals...</p>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="h-20 w-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                    <Check className="h-8 w-8 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white">All Caught Up!</h3>
                                <p className="text-slate-500 mt-2 max-w-xs mx-auto">No pending student registrations found matching your criteria.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-white/5 bg-[#020617]/50">
                                            <th className="pb-4 pt-4 pl-8 font-semibold">Student Name</th>
                                            <th className="pb-4 pt-4 font-semibold">Contact Info</th>
                                            <th className="pb-4 pt-4 font-semibold">Registration Info</th>
                                            <th className="pb-4 pt-4 font-semibold">Applied Date</th>
                                            <th className="pb-4 pt-4 pr-8 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-white/5">
                                        {filteredStudents.map((student, index) => (
                                            <tr
                                                key={student._id}
                                                className="group hover:bg-white/[0.02] transition-colors"
                                                style={{ animation: `slideUp 0.3s ease-out ${index * 0.05}s backwards` }}
                                            >
                                                <td className="py-4 pl-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex-shrink-0 shadow-lg flex items-center justify-center text-sm font-bold text-white border border-white/10">
                                                            {student.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{student.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <Mail className="w-3.5 h-3.5" /> {student.email}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <Phone className="w-3.5 h-3.5" /> {student.mobile}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    {student.registrationNumber ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-mono border border-slate-700">
                                                                {student.registrationNumber}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600 italic">Not provided</span>
                                                    )}
                                                </td>
                                                <td className="py-4 text-slate-400">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(student.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-8 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-100">
                                                        <button
                                                            onClick={() => handleApprove(student._id)}
                                                            disabled={processing === student._id}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all font-medium disabled:opacity-50"
                                                        >
                                                            {processing === student._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(student._id)}
                                                            disabled={processing === student._id}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all font-medium disabled:opacity-50"
                                                        >
                                                            {processing === student._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Global CSS for Animations */}
            <style jsx global>{`
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .animate-slide-up { animation: slideUp 0.6s ease-out forwards; }
                .animate-slide-down { animation: slideDown 0.6s ease-out forwards; }
                .animate-pulse-slow { animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
        </div>
    );
}
