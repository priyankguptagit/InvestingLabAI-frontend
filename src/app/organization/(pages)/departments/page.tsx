"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, Search, X, Loader2, Users, GraduationCap } from 'lucide-react';
import { departmentApi } from '@/lib/api';

interface Department {
    _id: string;
    departmentName: string;
    departmentCode: string;
    description?: string;
    isActive: boolean;
    studentCount?: number;
    coordinatorCount?: number;
}

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [processing, setProcessing] = useState(false);
    const [formData, setFormData] = useState({
        departmentName: '',
        departmentCode: '',
        description: '',
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const data = await departmentApi.getDepartments();
            if (data.success) {
                setDepartments(data.departments || []);
            }
        } catch (e) {
            console.error('Failed to fetch departments', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (editingDept) {
                await departmentApi.updateDepartment(editingDept._id, formData);
            } else {
                await departmentApi.createDepartment(formData);
            }
            setShowModal(false);
            setFormData({ departmentName: '', departmentCode: '', description: '' });
            setEditingDept(null);
            fetchDepartments();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Operation failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleEdit = (dept: Department) => {
        setEditingDept(dept);
        setFormData({
            departmentName: dept.departmentName,
            departmentCode: dept.departmentCode,
            description: dept.description || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this department?')) return;
        try {
            await departmentApi.deleteDepartment(id);
            // Optimistic update
            setDepartments(prev => prev.filter(d => d._id !== id));
        } catch (e: any) {
            alert(e.response?.data?.message || 'Delete failed');
            fetchDepartments();
        }
    };

    const filteredDepartments = departments.filter(dept =>
        dept.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.departmentCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden p-6 md:p-10">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-down">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-tight">
                            Departments
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium tracking-wide">
                            Organization Structure • {departments.length} Units
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setEditingDept(null);
                            setFormData({ departmentName: '', departmentCode: '', description: '' });
                            setShowModal(true);
                        }}
                        className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white transition-all duration-300 bg-emerald-600 rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 ring-1 ring-white/10"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        <span>Add Department</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="rounded-[24px] bg-[#0F172A]/80 backdrop-blur-xl border border-white/5 p-2 shadow-xl animate-scale-in">
                    <div className="relative w-full max-w-md group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find department code or name..."
                            className="block w-full pl-11 pr-4 py-3 bg-transparent rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:bg-white/5 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Departments Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                    </div>
                ) : filteredDepartments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center rounded-[32px] bg-[#0F172A]/50 border border-white/5 border-dashed">
                        <div className="h-20 w-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
                            <Building2 className="h-8 w-8 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">No Departments Found</h3>
                        <p className="text-slate-500 mt-2 max-w-xs mx-auto">Get started by creating your first department.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDepartments.map((dept, index) => (
                            <div
                                key={dept._id}
                                className="group relative bg-[#0F172A]/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                                style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="h-14 w-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                                            <Building2 className="w-7 h-7 text-emerald-400" />
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                            <button
                                                onClick={() => handleEdit(dept)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(dept._id)}
                                                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-bold text-white tracking-tight">
                                                {dept.departmentName}
                                            </h3>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                                                {dept.departmentCode}
                                            </span>
                                        </div>
                                        {dept.description && (
                                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                                {dept.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                                            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                                            <span className="text-slate-200">{dept.studentCount || 0}</span> Students
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                                            <Users className="w-3.5 h-3.5 text-purple-400" />
                                            <span className="text-slate-200">{dept.coordinatorCount || 0}</span> Leads
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#0F172A] border border-white/10 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-white">
                                    {editingDept ? 'Edit Department' : 'New Department'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                        Department Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.departmentName}
                                        onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all outline-none"
                                        placeholder="e.g. Computer Science"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                        Department Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.departmentCode}
                                        onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all outline-none font-mono"
                                        placeholder="e.g. CS"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all outline-none resize-none"
                                        rows={3}
                                        placeholder="Optional description..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-6 py-3 border border-white/10 rounded-xl text-slate-300 font-medium hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 rounded-xl text-white font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                                    >
                                        {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {editingDept ? 'Update Department' : 'Create Department'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

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
