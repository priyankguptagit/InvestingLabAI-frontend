"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Mail, Phone, Search, Filter, Loader2, UserCheck, ShieldCheck, X } from 'lucide-react';
import { coordinatorApi, departmentApi } from '@/lib/api';

interface Coordinator {
    _id: string;
    name: string;
    email: string;
    mobile: string;
    designation: string;
    department: {
        _id: string;
        departmentName: string;
    };
    isVerified: boolean;
}

interface Department {
    _id: string;
    departmentName: string;
}

export default function CoordinatorsPage() {
    const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [formData, setFormData] = useState({
        departmentId: '',
        name: '',
        email: '',
        mobile: '',
        designation: 'hod' as 'hod' | 'faculty' | 'coordinator' | 'other',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [coordData, deptData] = await Promise.all([
                coordinatorApi.getAllCoordinators(),
                departmentApi.getDepartments(),
            ]);

            if (coordData.success) {
                setCoordinators(coordData.coordinators || []);
            }
            if (deptData.success) {
                setDepartments(deptData.departments || []);
            }
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await coordinatorApi.createCoordinator(formData);
            setShowModal(false);
            setFormData({
                departmentId: '',
                name: '',
                email: '',
                mobile: '',
                designation: 'hod',
            });
            fetchData();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Failed to create coordinator');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coordinator?')) return;
        try {
            await coordinatorApi.deleteCoordinator(id);
            // Optimistic update
            setCoordinators(prev => prev.filter(c => c._id !== id));
        } catch (e: any) {
            alert(e.response?.data?.message || 'Delete failed');
            fetchData();
        }
    };

    const filteredCoordinators = coordinators.filter(coord =>
        coord.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coord.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (coord.department?.departmentName && coord.department.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden p-6 md:p-10">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-down">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-tight">
                            Coordinators
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium tracking-wide">
                            Department Leads • {coordinators.length} Members
                        </p>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white transition-all duration-300 bg-purple-600 rounded-xl hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/25 ring-1 ring-white/10"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        <span>Add Coordinator</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="rounded-[24px] bg-[#0F172A]/80 backdrop-blur-xl border border-white/5 p-2 shadow-xl animate-scale-in">
                    <div className="relative w-full max-w-md group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email or department..."
                            className="block w-full pl-11 pr-4 py-3 bg-transparent rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:bg-white/5 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Coordinators Table */}
                <div className="rounded-[32px] bg-[#0F172A]/80 backdrop-blur-2xl border border-white/5 shadow-2xl overflow-hidden animate-slide-up min-h-[400px]">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F172A]/50 z-20">
                            <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
                        </div>
                    ) : filteredCoordinators.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="h-20 w-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                <Users className="h-8 w-8 text-slate-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">No Coordinators Found</h3>
                            <p className="text-slate-500 mt-2 max-w-xs mx-auto">Add verified coordinators to manage your departments.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-white/5 bg-[#020617]/50">
                                        <th className="pb-4 pt-4 pl-8 font-semibold">Coordinator</th>
                                        <th className="pb-4 pt-4 font-semibold">Department & Role</th>
                                        <th className="pb-4 pt-4 font-semibold">Contact Info</th>
                                        <th className="pb-4 pt-4 font-semibold">Status</th>
                                        <th className="pb-4 pt-4 pr-8 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-white/5">
                                    {filteredCoordinators.map((coord, index) => (
                                        <tr
                                            key={coord._id}
                                            className="group hover:bg-white/[0.02] transition-colors"
                                            style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.05}s backwards` }}
                                        >
                                            <td className="py-4 pl-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex-shrink-0 shadow-lg flex items-center justify-center text-sm font-bold text-white border border-white/10">
                                                        {coord.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{coord.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs font-semibold border border-slate-700 w-fit">
                                                        {coord.department?.departmentName || 'Unassigned'}
                                                    </span>
                                                    <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">{coord.designation}</span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Mail className="w-3.5 h-3.5" /> {coord.email}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Phone className="w-3.5 h-3.5" /> {coord.mobile}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 w-fit ${coord.isVerified
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                    {coord.isVerified ? <ShieldCheck className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                                                    {coord.isVerified ? 'Verified' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="py-4 pr-8 text-right">
                                                <button
                                                    onClick={() => handleDelete(coord._id)}
                                                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remove Coordinator"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#0F172A] border border-white/10 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-white">
                                    Add New Coordinator
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                        Department
                                    </label>
                                    <select
                                        value={formData.departmentId}
                                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all outline-none"
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map((dept) => (
                                            <option key={dept._id} value={dept._id}>
                                                {dept.departmentName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all outline-none"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                            Mobile
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.mobile}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                        Designation
                                    </label>
                                    <select
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value as any })}
                                        className="w-full px-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all outline-none"
                                        required
                                    >
                                        <option value="hod">HOD</option>
                                        <option value="faculty">Faculty</option>
                                        <option value="coordinator">Coordinator</option>
                                        <option value="other">Other</option>
                                    </select>
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
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 rounded-xl text-white font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50"
                                    >
                                        {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Create Coordinator
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
                .animate-slide-up { animation: fadeInUp 0.6s ease-out forwards; }
                .animate-slide-down { animation: slideDown 0.6s ease-out forwards; }
                .animate-scale-in { animation: scaleIn 0.4s ease-out forwards; }
                .animate-pulse-slow { animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
        </div>
    );
}
