"use client";

import { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { coordinatorApi } from '@/lib/api';

interface EditStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
    onSuccess: () => void;
}

export default function EditStudentModal({ isOpen, onClose, student, onSuccess }: EditStudentModalProps) {
    const [studentDetails, setStudentDetails] = useState<any>(student);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        registrationNumber: '',
        plan: 'Free' as 'Free' | 'Silver' | 'Gold' | 'Diamond'
    });
    const [loading, setLoading] = useState(false);
    const [fetchingStudent, setFetchingStudent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadStudent = async () => {
            if (!student?._id || !isOpen) return;
            setFetchingStudent(true);
            try {
                const response = await coordinatorApi.getStudentById(student._id);
                const freshStudent = response.student || student;
                setStudentDetails(freshStudent);
                setFormData({
                    name: freshStudent.name || '',
                    email: freshStudent.email || '',
                    registrationNumber: freshStudent.registrationNumber || '',
                    plan: (freshStudent.currentPlan || 'Free') as 'Free' | 'Silver' | 'Gold' | 'Diamond'
                });
                setError(null);
            } catch (err: any) {
                setStudentDetails(student);
                setFormData({
                    name: student.name || '',
                    email: student.email || '',
                    registrationNumber: student.registrationNumber || '',
                    plan: (student.currentPlan || 'Free') as 'Free' | 'Silver' | 'Gold' | 'Diamond'
                });
                setError(err.response?.data?.message || null);
            } finally {
                setFetchingStudent(false);
            }
        };

        loadStudent();
    }, [student, isOpen]);

    if (!isOpen || !student) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const updateData: any = {
                name: formData.name,
                email: formData.email,
                plan: formData.plan,
            };

            // Only update name and email as per latest backend changes

            const response = await coordinatorApi.updateStudent(student._id, updateData);

            if (response.success) {
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update student');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-semibold text-white">Edit Student</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {fetchingStudent && (
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 text-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Refreshing student details...
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Plan</label>
                        <select
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value as 'Free' | 'Silver' | 'Gold' | 'Diamond' })}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="Free">Free</option>
                            <option value="Silver">Silver</option>
                            <option value="Gold">Gold</option>
                            <option value="Diamond">Diamond</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Email Address</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="space-y-2 opacity-60">
                        <label className="text-sm font-medium text-slate-300">Reg. Number (Read Only)</label>
                        <input
                            type="text"
                            disabled
                            value={formData.registrationNumber || 'N/A'}
                            className="w-full bg-slate-900/30 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 cursor-not-allowed"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
