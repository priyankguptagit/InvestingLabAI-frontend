// ... imports
"use client";

import { useState, useEffect } from 'react';
import {
    GraduationCap, Search, Filter, MoreVertical,
    ChevronRight, Mail, Phone, Calendar,
    RefreshCcw, Loader2, Users, FileSpreadsheet, UserPlus
} from 'lucide-react';
import { organizationApi } from '@/lib/api';
import AddStudentModal from '../../_components/AddStudentModal';
import ImportCSVModal from '../../_components/ImportCSVModal';
import StudentActionMenu from '../../_components/StudentActionMenu';
import EditStudentModal from '../../_components/EditStudentModal';
import ArchiveStudentModal from '../../_components/ArchiveStudentModal';
import UnarchiveStudentModal from '../../_components/UnarchiveStudentModal';
import ViewPortfolioModal from '../../_components/ViewPortfolioModal';
import StudentAnalysisModal from '../../coordinator/_components/StudentAnalysisModal';
import BulkActionBar from '@/shared-components/BulkActionBar';
import BulkConfirmModal from '@/shared-components/BulkConfirmModal';
import { Brain, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReconcileLoader } from '../../_components/ReconcileLoader';

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
    currentPlan?: string;
    organizationApprovalStatus: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    isDeleted?: boolean;
    portfolioReport?: {
        analysis: string;
        generatedAt: string;
        reconciledAt?: string;
    };
    teacherReview?: {
        factor1Rating: number;
        factor2Rating: number;
        factor3Rating: number;
        aggregateScore: number;
        suggestions: string;
        reviewedAt: string;
    };
}
const PLAN_RIBBONS: Record<string, { border: string; chip: string; label: string }> = {
    Silver: {
        border: "bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500",
        chip: "bg-slate-300/90 text-slate-900",
        label: "SILVER",
    },
    Gold: {
        border: "bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-500",
        chip: "bg-amber-300/95 text-amber-950",
        label: "GOLD",
    },
    Diamond: {
        border: "bg-gradient-to-br from-cyan-200 via-sky-300 to-indigo-400",
        chip: "bg-sky-200/95 text-sky-950",
        label: "DIAMOND",
    },
};

const PLAN_NAME_STYLES: Record<string, string> = {
    Silver: "bg-slate-300/10 text-slate-300 border-slate-300/20",
    Gold: "bg-amber-300/10 text-amber-300 border-amber-300/20",
    Diamond: "bg-sky-300/10 text-sky-200 border-sky-300/20",
};

export default function AllStudentsPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [reconciling, setReconciling] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // Action Modal States
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showUnarchiveModal, setShowUnarchiveModal] = useState(false);
    const [showPortfolioModal, setShowPortfolioModal] = useState(false);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);

    // Bulk Selection States
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkAction, setBulkAction] = useState<'archive' | 'unarchive' | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const studentsData = await organizationApi.getStudents();
            if (studentsData.success) {
                setStudents(studentsData.students || []);
            }
        } catch (e) {
            console.error('Failed to fetch students', e);
        } finally {
            setLoading(false);
        }
    };

    const handleEditStudent = (student: any) => {
        setSelectedStudent(student);
        setShowEditModal(true);
    };

    const handleArchiveStudent = (student: any) => {
        setSelectedStudent(student);
        setShowArchiveModal(true);
    };

    const handleViewPortfolio = (student: any) => {
        setSelectedStudent(student);
        setShowPortfolioModal(true);
    };

    const handleRowClick = (student: Student) => {
        setSelectedStudent(student);
        setShowAnalysisModal(true);
    };

    const handleReconcile = async () => {
        setReconciling(true);
        try {
            const result = await organizationApi.reconcileStudents();
            if (result.success) {
                setNotification({ type: 'success', message: result.message || `Reports generated for ${result.processed}/${result.total} students` });
                fetchStudents(); // Refresh to get updated portfolioReport flags

                // Redirect to review page after brief delay to show success toast
                setTimeout(() => {
                    router.push('/organization/reconcile-review');
                }, 1500);
            }
        } catch (e: any) {
            setNotification({ type: 'error', message: e.response?.data?.message || 'Reconciliation failed' });
        } finally {
            setReconciling(false);
        }
    };

    const filteredStudents = students.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.registrationNumber && student.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (student.department?.departmentName && student.department.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Clear selection when search changes
    useEffect(() => {
        setSelectedIds(new Set());
    }, [searchQuery]);

    // Bulk selection helpers
    const isAllSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s._id));
    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredStudents.map(s => s._id)));
        }
    };
    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleBulkConfirm = async () => {
        if (!bulkAction) return;
        setBulkLoading(true);
        try {
            await organizationApi.bulkAction({ studentIds: Array.from(selectedIds), action: bulkAction });
            setSelectedIds(new Set());
            setBulkAction(null);
            fetchStudents();
        } catch (e) {
            console.error('Bulk action failed', e);
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden p-6 md:p-10">
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 transition-opacity duration-300 ${notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : null}
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="opacity-50 hover:opacity-100">&times;</button>
                </div>
            )}

            {/* Global Loader for Reconciliation */}
            <ReconcileLoader isReconciling={reconciling} text="Analyzing Portfolios with AI..." />

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-down">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                                Student Directory
                            </h1>
                            <button
                                onClick={fetchStudents}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                                title="Refresh List"
                            >
                                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <p className="text-slate-500 mt-2 text-sm font-medium tracking-wide">
                            Organization Portal • All Students
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReconcile}
                            disabled={reconciling || students.length === 0}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Brain className="w-4 h-4" />
                            Reconcile
                        </button>

                        <div className="bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            <span className="text-blue-400 font-bold">{students.length} Total Students</span>
                        </div>

                        <button
                            onClick={() => setShowImportModal(true)}
                            className="bg-[#0F172A] hover:bg-[#1E293B] text-slate-200 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 transition-all"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span className="hidden md:inline">Import CSV</span>
                        </button>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden md:inline">Add Student</span>
                        </button>
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
                                placeholder="Search by name, email, dept..."
                                className="block w-full pl-11 pr-4 py-3.5 bg-[#020617] border border-white/5 rounded-2xl text-sm text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all outline-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {/* Placeholder for future export/filter features */}
                        </div>
                    </div>

                    <div className="relative min-h-[400px]">
                        {loading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F172A]/50 z-20">
                                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                                <p className="mt-4 text-sm text-slate-400 font-medium animate-pulse">Fetching students...</p>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="h-20 w-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                    <Search className="h-8 w-8 text-slate-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white">No Students Found</h3>
                                <p className="text-slate-500 mt-2 max-w-xs mx-auto">We couldn't find any students matching your search.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-white/5 bg-[#020617]/50">
                                            <th className="pb-4 pt-4 pl-4 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    onChange={toggleSelectAll}
                                                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                                                />
                                            </th>
                                            <th className="pb-4 pt-4 pl-4 font-semibold">Student Name</th>
                                            <th className="pb-4 pt-4 font-semibold">Department</th>
                                            <th className="pb-4 pt-4 font-semibold">Contact & Info</th>
                                            <th className="pb-4 pt-4 font-semibold">Score</th>
                                            <th className="pb-4 pt-4 font-semibold">Status</th>
                                            <th className="pb-4 pt-4 font-semibold">Joined Date</th>
                                            <th className="pb-4 pt-4 pr-8 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-white/5">
                                        {filteredStudents.map((student, index) => (
                                            <tr
                                                key={student._id}
                                                onClick={() => handleRowClick(student)}
                                                className="group hover:bg-white/[0.02] cursor-pointer transition-colors"
                                                style={{ animation: `slideUp 0.3s ease-out ${index * 0.05}s backwards` }}
                                            >
                                                {(() => {
                                                    const ribbon = PLAN_RIBBONS[student.currentPlan || ""] || null;
                                                    return (
                                                        <>
                                                <td className="py-4 pl-4 w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(student._id)}
                                                        onChange={() => toggleSelectOne(student._id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                                                    />
                                                </td>
                                                <td className="py-4 pl-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <div className={`h-10 w-10 rounded-full p-[2px] ${ribbon ? ribbon.border : "bg-white/10"}`}>
                                                                <div className="h-full w-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex-shrink-0 shadow-lg flex items-center justify-center text-sm font-bold text-white border border-white/10">
                                                                {student.name.charAt(0).toUpperCase()}
                                                                </div>
                                                            </div>
                                                            {ribbon ? (
                                                                <span className={`absolute -bottom-1.5 left-1/2 z-10 -translate-x-1/2 px-1.5 py-[1px] rounded-full text-[8px] font-black tracking-wide border border-white/30 shadow-lg ${ribbon.chip}`}>
                                                                    {ribbon.label}
                                                                </span>
                                                            ) : null}
                                                            {student.teacherReview?.aggregateScore !== undefined && (
                                                                <div className="absolute -top-1 -left-1 bg-red-600 p-[2px] rounded-full border border-white" title="Reviewed by Teacher">
                                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{student.name}</div>
                                                            {PLAN_NAME_STYLES[student.currentPlan || ""] ? (
                                                                <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.18em] ${PLAN_NAME_STYLES[student.currentPlan || ""]}`}>
                                                                    {student.currentPlan}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                                                            {student.department?.departmentName || 'N/A'}
                                                        </span>
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
                                                        {student.registrationNumber && (
                                                            <div className="flex items-center gap-2 text-slate-400">
                                                                <div className="w-3.5 h-3.5 flex items-center justify-center font-mono text-[10px] font-bold">#</div>
                                                                <span className="font-mono text-xs">{student.registrationNumber}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    {student.teacherReview?.aggregateScore !== undefined ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2.5 py-1 rounded text-xs font-bold border ${student.teacherReview.aggregateScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                student.teacherReview.aggregateScore >= 60 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                    student.teacherReview.aggregateScore >= 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                        'bg-red-500/10 text-red-500 border-red-500/20'
                                                                }`}>
                                                                {student.teacherReview.aggregateScore}/100
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600 italic">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {student.isDeleted ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                                                            ARCHIVED
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${student.organizationApprovalStatus === 'approved'
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                            : student.organizationApprovalStatus === 'rejected'
                                                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                            }`}>
                                                            {student.organizationApprovalStatus === 'approved' ? 'ACTIVE' : student.organizationApprovalStatus?.toUpperCase()}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 text-slate-400">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(student.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <StudentActionMenu
                                                        student={student}
                                                        onEdit={(s) => { setSelectedStudent(s); setShowEditModal(true); }}
                                                        onArchive={(s) => { setSelectedStudent(s); setShowArchiveModal(true); }}
                                                        onUnarchive={(s) => { setSelectedStudent(s); setShowUnarchiveModal(true); }}
                                                        onViewPortfolio={(s) => { setSelectedStudent(s); setShowPortfolioModal(true); }}
                                                        hasReport={!!student.portfolioReport?.analysis}
                                                    />
                                                </td>
                                                        </>
                                                    );
                                                })()}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddStudentModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    fetchStudents();
                }}
            />

            <ImportCSVModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => fetchStudents()}
            />

            <EditStudentModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                student={selectedStudent}
                onSuccess={() => fetchStudents()}
            />

            <ArchiveStudentModal
                isOpen={showArchiveModal}
                onClose={() => setShowArchiveModal(false)}
                student={selectedStudent}
                onSuccess={() => fetchStudents()}
            />

            <UnarchiveStudentModal
                isOpen={showUnarchiveModal}
                onClose={() => setShowUnarchiveModal(false)}
                student={selectedStudent}
                onSuccess={() => fetchStudents()}
            />

            <ViewPortfolioModal
                isOpen={showPortfolioModal}
                onClose={() => setShowPortfolioModal(false)}
                student={selectedStudent}
            />

            <StudentAnalysisModal
                isOpen={showAnalysisModal}
                onClose={() => setShowAnalysisModal(false)}
                student={selectedStudent}
            />

            {/* Bulk Action Components */}
            <BulkActionBar
                selectedCount={selectedIds.size}
                onArchive={() => setBulkAction('archive')}
                onUnarchive={() => setBulkAction('unarchive')}
                onClearSelection={() => setSelectedIds(new Set())}
            />
            <BulkConfirmModal
                isOpen={bulkAction !== null}
                onClose={() => setBulkAction(null)}
                onConfirm={handleBulkConfirm}
                action={bulkAction || 'archive'}
                count={selectedIds.size}
                loading={bulkLoading}
            />

            {/* Global CSS for Animations */}
            {/* Global CSS for Animations - Moved to globals.css */}
        </div >
    );
}
