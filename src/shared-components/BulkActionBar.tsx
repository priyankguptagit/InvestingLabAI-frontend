"use client";

import { Archive, ArchiveRestore, X } from 'lucide-react';

interface BulkActionBarProps {
    selectedCount: number;
    onArchive: () => void;
    onUnarchive: () => void;
    onClearSelection: () => void;
}

export default function BulkActionBar({ selectedCount, onArchive, onUnarchive, onClearSelection }: BulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center gap-3 px-6 py-3.5 bg-[#0F172A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/5">
                {/* Selection Count */}
                <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                    <div className="h-7 w-7 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-indigo-400 text-xs font-bold">{selectedCount}</span>
                    </div>
                    <span className="text-sm text-slate-300 font-medium whitespace-nowrap">
                        selected
                    </span>
                </div>

                {/* Actions */}
                <button
                    onClick={onArchive}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl border border-red-500/20 transition-all"
                >
                    <Archive className="w-4 h-4" />
                    Archive
                </button>

                <button
                    onClick={onUnarchive}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-xl border border-emerald-500/20 transition-all"
                >
                    <ArchiveRestore className="w-4 h-4" />
                    Unarchive
                </button>

                {/* Clear */}
                <button
                    onClick={onClearSelection}
                    className="ml-1 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    title="Clear Selection"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
