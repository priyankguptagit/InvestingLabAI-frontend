"use client";

import { Loader2, Archive, ArchiveRestore, Ban, Unlock } from 'lucide-react';

export type BulkActionType = 'archive' | 'unarchive' | 'block' | 'unblock';

interface BulkConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    action: BulkActionType;
    count: number;
    loading: boolean;
}

export default function BulkConfirmModal({ isOpen, onClose, onConfirm, action, count, loading }: BulkConfirmModalProps) {
    if (!isOpen) return null;

    const config = {
        archive: {
            title: 'Archive',
            desc: 'remove platform access for',
            color: 'red',
            icon: <Archive className="h-6 w-6 text-red-500" />,
            borderClass: 'border-red-500/20',
            bgClass: 'bg-red-500/10',
            btnClass: 'bg-red-600 hover:bg-red-700 shadow-red-500/20',
        },
        unarchive: {
            title: 'Unarchive',
            desc: 'restore platform access for',
            color: 'emerald',
            icon: <ArchiveRestore className="h-6 w-6 text-emerald-500" />,
            borderClass: 'border-emerald-500/20',
            bgClass: 'bg-emerald-500/10',
            btnClass: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',
        },
        block: {
            title: 'Block',
            desc: 'suspend platform access for',
            color: 'rose',
            icon: <Ban className="h-6 w-6 text-rose-500" />,
            borderClass: 'border-rose-500/20',
            bgClass: 'bg-rose-500/10',
            btnClass: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
        },
        unblock: {
            title: 'Unblock',
            desc: 'reactivate platform access for',
            color: 'blue',
            icon: <Unlock className="h-6 w-6 text-blue-500" />,
            borderClass: 'border-blue-500/20',
            bgClass: 'bg-blue-500/10',
            btnClass: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20',
        },
    }[action];

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`bg-[#0F172A] border ${config.borderClass} rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200`}>
                <div className="flex flex-col items-center text-center">
                    <div className={`h-12 w-12 rounded-full ${config.bgClass} flex items-center justify-center mb-4`}>
                        {config.icon}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                        {config.title} {count} Student{count > 1 ? 's' : ''}?
                    </h3>
                    <p className="text-slate-400 mb-6">
                        This will {config.desc} {count} selected student{count > 1 ? 's' : ''}.
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 py-2.5 rounded-xl ${config.btnClass} text-white transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg`}
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading
                                ? `${config.title}ing...`
                                : `Yes, ${config.title}`
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
