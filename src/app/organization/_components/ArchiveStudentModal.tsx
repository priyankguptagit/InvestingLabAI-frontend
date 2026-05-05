"use client";

import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { organizationApi } from '@/lib/api';

interface ArchiveStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
    onSuccess: () => void;
}

export default function ArchiveStudentModal({ isOpen, onClose, student, onSuccess }: ArchiveStudentModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !student) return null;

    const handleArchive = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await organizationApi.archiveStudent(student._id);
            if (response.success) {
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to archive student');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0F172A] border border-red-500/20 rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">Archive Student?</h3>
                    <p className="text-slate-400 mb-6">
                        Are you sure you want to archive <span className="text-white font-medium">{student.name}</span>?
                        This will remove their access to the platform.
                    </p>

                    {error && (
                        <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleArchive}
                            disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Archiving...' : 'Yes, Archive'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
