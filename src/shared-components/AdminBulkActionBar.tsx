"use client";

import { Archive, ArchiveRestore, Ban, Unlock, X } from 'lucide-react';

interface AdminBulkActionBarProps {
    selectedCount: number;
    onArchive: () => void;
    onUnarchive: () => void;
    onBlock: () => void;
    onUnblock: () => void;
    onClearSelection: () => void;
}

export default function AdminBulkActionBar({ selectedCount, onArchive, onUnarchive, onBlock, onUnblock, onClearSelection }: AdminBulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0F172A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ring-1 ring-white/5">
                {/* Selection Count */}
                <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                    <div className="h-7 w-7 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-indigo-400 text-xs font-bold">{selectedCount}</span>
                    </div>
                    <span className="text-sm text-slate-300 font-medium whitespace-nowrap hidden sm:inline-block">
                        selected
                    </span>
                </div>

                {/* Actions */}
                <button
                    onClick={onArchive}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-sm font-semibold rounded-xl border border-amber-500/20 transition-all"
                    title="Archive Selected"
                >
                    <Archive className="w-4 h-4" />
                    <span className="hidden sm:inline-block">Archive</span>
                </button>

                <button
                    onClick={onUnarchive}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-xl border border-emerald-500/20 transition-all"
                    title="Unarchive Selected"
                >
                    <ArchiveRestore className="w-4 h-4" />
                    <span className="hidden sm:inline-block">Unarchive</span>
                </button>

                <button
                    onClick={onBlock}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-semibold rounded-xl border border-rose-500/20 transition-all"
                    title="Block Selected"
                >
                    <Ban className="w-4 h-4" />
                    <span className="hidden sm:inline-block">Block</span>
                </button>

                <button
                    onClick={onUnblock}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-semibold rounded-xl border border-blue-500/20 transition-all"
                    title="Unblock Selected"
                >
                    <Unlock className="w-4 h-4" />
                    <span className="hidden sm:inline-block">Unblock</span>
                </button>

                {/* Clear */}
                <button
                    onClick={onClearSelection}
                    className="ml-1 p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    title="Clear Selection"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
