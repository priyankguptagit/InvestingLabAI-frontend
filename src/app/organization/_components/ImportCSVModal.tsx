"use client";

import { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { organizationApi } from '@/lib/api';

interface ImportCSVModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportCSVModal({ isOpen, onClose, onSuccess }: ImportCSVModalProps) {
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setCsvFile(null);
        setImportResult(null);
        setError(null);
        onClose();
    };

    const downloadTemplate = () => {
        const csvContent = "name,email,department\nJohn Doe,john@example.com,Computer Science\nJane Smith,jane@example.com,Mechanical Engineering";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "student_import_template_org.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const parseCSV = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const lines = text.split('\n');
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

                const result = [];
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const currentline = lines[i].split(',');
                    const obj: any = {};
                    for (let j = 0; j < headers.length; j++) {
                        obj[headers[j]] = currentline[j]?.trim();
                    }
                    if (obj.name && obj.email && obj.department) {
                        result.push(obj);
                    }
                }
                resolve(result);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    };

    const processImport = async () => {
        if (!csvFile) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const parsedData = await parseCSV(csvFile);
            if (parsedData.length === 0) {
                setError('No valid data found in CSV. Please check the format.');
                setIsSubmitting(false);
                return;
            }

            const response = await organizationApi.importStudentsCSV({ students: parsedData });

            if (response.success) {
                setImportResult(response);
                if (response.summary.successfullyAdded > 0) {
                    onSuccess(); // Trigger refresh on parent, but keep modal open to show results
                }
            }
        } catch (err: any) {
            console.error('Import failed', err);
            setError(err.response?.data?.message || 'Failed to import CSV');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Import Students via CSV</h3>
                    <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {!importResult ? (
                    <div className="space-y-6">
                        {/* Template Download */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-blue-400 text-sm">Need a template?</h4>
                                <p className="text-slate-400 text-xs mt-1">Download sample CSV file to see required format</p>
                            </div>
                            <button
                                onClick={downloadTemplate}
                                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                            >
                                <Download className="w-3 h-3" /> Download
                            </button>
                        </div>

                        {/* File Upload */}
                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 hover:bg-white/[0.02] transition-colors text-center cursor-pointer relative group">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center gap-3 group-hover:scale-105 transition-transform duration-200">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">
                                        {csvFile ? csvFile.name : "Click to upload or drag & drop"}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">CSV files only (max 5MB)</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={processImport}
                            disabled={!csvFile || isSubmitting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
                            {isSubmitting ? 'Processing...' : 'Import Students'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                        {/* Success Summary */}
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                <h4 className="font-bold text-emerald-400">Import Complete</h4>
                            </div>
                            <p className="text-sm text-slate-300">
                                Successfully added <span className="text-white font-bold">{importResult.summary.successfullyAdded}</span> students.
                            </p>
                        </div>

                        {/* Skipped Items */}
                        {importResult.details.skipped.length > 0 && (
                            <div>
                                <h4 className="font-bold text-amber-400 text-sm mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Skipped ({importResult.details.skipped.length})
                                </h4>
                                <div className="bg-[#020617] rounded-xl border border-white/5 p-3 max-h-32 overflow-y-auto space-y-2 custom-scrollbar">
                                    {importResult.details.skipped.map((item: any, idx: number) => (
                                        <div key={idx} className="text-xs text-slate-400 border-b border-white/5 pb-1 last:border-0 last:pb-0">
                                            <span className="text-white">{item.email}</span>: {item.reason}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Errors */}
                        {importResult.details.errors.length > 0 && (
                            <div>
                                <h4 className="font-bold text-red-400 text-sm mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Errors ({importResult.details.errors.length})
                                </h4>
                                <div className="bg-[#020617] rounded-xl border border-white/5 p-3 max-h-32 overflow-y-auto space-y-2 custom-scrollbar">
                                    {importResult.details.errors.map((item: any, idx: number) => (
                                        <div key={idx} className="text-xs text-slate-400 border-b border-white/5 pb-1 last:border-0 last:pb-0">
                                            Row {item.row}: {item.error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleClose}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
