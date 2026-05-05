import { useState, useEffect } from 'react';
import { X, Loader2, User, Mail, Shield, CheckCircle2 } from 'lucide-react';
import { coordinatorApi } from '@/lib/api';

interface PlanStudentsModalProps {
    plan: 'Silver' | 'Gold' | 'Diamond';
    isOpen: boolean;
    onClose: () => void;
}

export default function PlanStudentsModal({ plan, isOpen, onClose }: PlanStudentsModalProps) {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        setLoading(true);

        const fetchStudents = async () => {
            try {
                const response = await coordinatorApi.getMyStudents({ plan });
                if (isMounted && response.success) {
                    setStudents(response.students || []);
                }
            } catch (error) {
                console.error('Failed to fetch plan students', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchStudents();

        return () => {
            isMounted = false;
        };
    }, [isOpen, plan]);

    if (!isOpen) return null;

    const planColors = {
        Silver: 'text-slate-300 bg-slate-300/10 border-slate-300/20',
        Gold: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
        Diamond: 'text-sky-300 bg-sky-400/10 border-sky-400/20',
    };

    const colorClasses = planColors[plan] || planColors.Silver;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className={`px-2.5 py-1 text-xs rounded-md border ${colorClasses}`}>
                                {plan}
                            </span>
                            Students
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            {loading ? 'Loading...' : `Found ${students.length} student${students.length === 1 ? '' : 's'} on this plan.`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                            <p>Loading students...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-12">
                            <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${colorClasses}`}>
                                <User className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-1">No students found</h3>
                            <p className="text-slate-400 text-sm">There are currently no students assigned to the {plan} plan.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {students.map((student) => (
                                <div
                                    key={student._id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${student.profilePhoto ? '' : 'bg-indigo-500/10 border border-indigo-500/20'}`}>
                                            {student.profilePhoto ? (
                                                <img src={student.profilePhoto} alt={student.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <User className="w-5 h-5 text-indigo-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-200">{student.name}</p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {student.email}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Status</span>
                                            {student.organizationApprovalStatus === 'approved' ? (
                                                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                                                    <CheckCircle2 className="w-3 h-3" /> Approved
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                                    <Shield className="w-3 h-3" /> {student.organizationApprovalStatus}
                                                </span>
                                            )}
                                        </div>
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
