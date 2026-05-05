"use client";

import { useState, useEffect } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { organizationApi, departmentApi } from '@/lib/api';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [plan, setPlan] = useState<'Free' | 'Silver' | 'Gold' | 'Diamond'>('Free');
    const [departments, setDepartments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDepts, setIsFetchingDepts] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchDepartments();
            setName('');
            setEmail('');
            setDepartmentId('');
            setPlan('Free');
            setError(null);
        }
    }, [isOpen]);

    const fetchDepartments = async () => {
        setIsFetchingDepts(true);
        try {
            const data = await departmentApi.getDepartments();
            if (data.success) {
                setDepartments(data.departments || []);
            }
        } catch (err) {
            console.error('Failed to fetch departments', err);
            setError('Failed to load departments');
        } finally {
            setIsFetchingDepts(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await organizationApi.addStudent({
                name,
                email,
                departmentId,
                plan
            });

            if (response.success) {
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            console.error('Add student failed', err);
            setError(err.response?.data?.message || 'Failed to add student');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Add New Student</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                            placeholder="Enter student name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                            placeholder="Enter student email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Plan</label>
                        <select
                            value={plan}
                            onChange={e => setPlan(e.target.value as 'Free' | 'Silver' | 'Gold' | 'Diamond')}
                            className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="Free">Free</option>
                            <option value="Silver">Silver</option>
                            <option value="Gold">Gold</option>
                            <option value="Diamond">Diamond</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Department</label>
                        {isFetchingDepts ? (
                            <div className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-slate-500 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading departments...
                            </div>
                        ) : (
                            <select
                                required
                                value={departmentId}
                                onChange={e => setDepartmentId(e.target.value)}
                                className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept._id} value={dept._id}>
                                        {dept.departmentName} ({dept.departmentCode})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading || isFetchingDepts}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                            {isLoading ? 'Adding...' : 'Add Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
