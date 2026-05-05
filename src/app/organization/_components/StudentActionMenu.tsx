"use client";

import { useState } from 'react';
import { MoreVertical, Edit, Trash2, PieChart, RefreshCw } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface StudentActionMenuProps {
    student: any;
    onEdit: (student: any) => void;
    onArchive: (student: any) => void;
    onUnarchive: (student: any) => void;
    onViewPortfolio: (student: any) => void;
    onDownloadReport?: (student: any) => void;
    hasReport?: boolean;
}

export default function StudentActionMenu({ student, onEdit, onArchive, onUnarchive, onViewPortfolio, onDownloadReport, hasReport }: StudentActionMenuProps) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    className="min-w-[12rem] bg-[#0F172A] rounded-lg border border-slate-800 p-1 shadow-xl animate-in fade-in zoom-in-95 duration-200 z-50"
                    sideOffset={5}
                >
                    <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Actions
                    </DropdownMenu.Label>

                    <DropdownMenu.Separator className="h-px bg-slate-800 my-1" />

                    <DropdownMenu.Item
                        onSelect={() => onEdit(student)}
                        className="flex items-center px-2 py-2 text-sm text-slate-200 rounded-md cursor-pointer hover:bg-slate-800 focus:bg-slate-800 focus:text-white outline-none group mb-1"
                    >
                        <Edit className="w-4 h-4 mr-2 text-blue-400 group-hover:text-blue-300" />
                        Edit Details
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        onSelect={() => onViewPortfolio(student)}
                        className="flex items-center px-2 py-2 text-sm text-slate-200 rounded-md cursor-pointer hover:bg-slate-800 focus:bg-slate-800 focus:text-white outline-none group mb-1"
                    >
                        <PieChart className="w-4 h-4 mr-2 text-indigo-400 group-hover:text-indigo-300" />
                        View Portfolio
                    </DropdownMenu.Item>

                    {hasReport && onDownloadReport && (
                        <DropdownMenu.Item
                            onSelect={() => onDownloadReport(student)}
                            className="flex items-center px-2 py-2 text-sm text-slate-200 rounded-md cursor-pointer hover:bg-slate-800 focus:bg-slate-800 focus:text-white outline-none group mb-1"
                        >
                            <span className="w-4 h-4 mr-2 text-emerald-400 group-hover:text-emerald-300 flex items-center justify-center">↓</span>
                            Download AI Report
                        </DropdownMenu.Item>
                    )}

                    <DropdownMenu.Separator className="h-px bg-slate-800 my-1" />

                    {student.isDeleted ? (
                        <DropdownMenu.Item
                            onSelect={() => onUnarchive(student)}
                            className="flex items-center px-2 py-2 text-sm text-emerald-400 rounded-md cursor-pointer hover:bg-emerald-900/20 focus:bg-emerald-900/20 focus:text-emerald-300 outline-none group"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Unarchive Student
                        </DropdownMenu.Item>
                    ) : (
                        <DropdownMenu.Item
                            onSelect={() => onArchive(student)}
                            className="flex items-center px-2 py-2 text-sm text-red-400 rounded-md cursor-pointer hover:bg-red-900/20 focus:bg-red-900/20 focus:text-red-300 outline-none group"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Archive Student
                        </DropdownMenu.Item>
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
