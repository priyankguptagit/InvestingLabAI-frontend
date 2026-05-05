"use client";
import React, { useEffect, useState } from 'react';
import { Plus, Tag, RefreshCcw, Users, ArrowUpRight, Filter, MessageSquare, Activity, Settings, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { referralApi } from '@/lib/api/payment.api';
import { companyApi } from '@/lib/api';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared-components/ui/card";
import { Input } from "@/shared-components/ui/input";
import { Button } from "@/shared-components/ui/button";
import { Badge } from "@/shared-components/ui/badge";
import { Label } from "@/shared-components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared-components/ui/tabs";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from '@/shared-components/ui/dropdown-menu';

export default function ReferralsManagementPage() {
  const [role, setRole] = useState<string>('employee');
  const [codes, setCodes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<string>('10');
  const [newCode, setNewCode] = useState<string | null>(null);

  // Active Codes Filters
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set()); // 'active', 'disabled'
  const [selectedDiscountTiers, setSelectedDiscountTiers] = useState<Set<string>>(new Set()); // '0-5%', '6-15%', '16-20%'
  const [selectedUseState, setSelectedUseState] = useState<Set<string>>(new Set()); // 'used', 'unused'

  // Purchase History Filters
  const [selectedPlanTypes, setSelectedPlanTypes] = useState<Set<string>>(new Set());
  const [selectedCommStatus, setSelectedCommStatus] = useState<Set<string>>(new Set()); // 'paid', 'pending'

  // Pagination
  const [codesPage, setCodesPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;

  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) => {
    setter(prev => { const n = new Set(prev); n.has(val) ? n.delete(val) : n.add(val); return n; });
  };

  useEffect(() => {
    const init = async () => {
      try {
        const profile = await companyApi.getMe();
        if (profile.success && profile.user) {
          setRole(profile.user.role);
          await fetchCodes(profile.user.role);
        }
      } catch (err) {
        console.error('Failed to load profile or codes', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchCodes = async (userRole: string) => {
    try {
      let codesData;
      let historyData;

      if (userRole === 'admin' || userRole === 'super_admin') {
        const [c, h] = await Promise.all([referralApi.getAllCodes(), referralApi.getAllHistory()]);
        codesData = c;
        historyData = h;
      } else {
        const [c, h] = await Promise.all([referralApi.getMyCodes(), referralApi.getHistory()]);
        codesData = c;
        historyData = h;
      }

      if (codesData?.success) setCodes(codesData.data);
      if (historyData?.success) setHistory(historyData.data);
    } catch (err) {
      console.error('Failed to fetch codes or history', err);
    }
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Allow clearing the input completely
    if (val === '') {
      setDiscountPercent('');
      return;
    }

    // Only allow numbers
    if (!/^\d+$/.test(val)) return;

    const num = parseInt(val, 10);
    // Enforce 0-20 limits
    if (num >= 0 && num <= 20) {
      setDiscountPercent(num.toString());
    }
  };

  const handleGenerateCode = async () => {
    if (discountPercent === '') {
      alert("Please enter a valid discount percentage.");
      return;
    }

    const numericDiscount = parseInt(discountPercent, 10);

    if (numericDiscount < 0 || numericDiscount > 20) {
      alert("Discount must be between 0 and 20%");
      return;
    }

    setIsGenerating(true);
    setNewCode(null);
    try {
      const result = await referralApi.generateCode(numericDiscount);
      if (result.success) {
        setNewCode(result.data.code);
        await fetchCodes(role); // Refresh table
      } else {
        alert(result.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleStatus = async (codeId: string) => {
    try {
      const result = await referralApi.toggleStatus(codeId);
      if (result.success) {
        setCodes(prev => prev.map(c => c._id === codeId ? { ...c, isActive: !c.isActive } : c));
      } else {
        alert(result.message || 'Failed to toggle status');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const totalUsage = codes.reduce((sum, c) => sum + c.usageCount, 0);
  const currentDiscountNumber = discountPercent === '' ? 0 : parseInt(discountPercent, 10);
  const employeeCommission = 20 - currentDiscountNumber;

  const totalCommissionEarned = history.reduce((sum, h) => sum + (h.commissionEarned || 0), 0);
  const totalSalesGenerated = history.reduce((sum, h) => sum + (h.amountPaid || 0), 0);

  // --- FILTER CALCULATIONS ---
  const getDiscountTier = (discount: number) => {
    if (discount <= 5) return '0-5%';
    if (discount <= 15) return '6-15%';
    return '16-20%';
  };

  const DISCOUNT_TIERS = ['0-5%', '6-15%', '16-20%'];

  const filteredCodes = codes.filter(c => {
    if (selectedStatuses.size > 0 && !selectedStatuses.has(c.isActive ? 'active' : 'disabled')) return false;
    if (selectedDiscountTiers.size > 0 && !selectedDiscountTiers.has(getDiscountTier(c.discountPercent))) return false;
    if (selectedUseState.size > 0 && !selectedUseState.has(c.usageCount > 0 ? 'used' : 'unused')) return false;
    return true;
  });

  const availablePlanTypes = Array.from(new Set(history.map(h => h.planName || 'Unknown')));

  const filteredHistory = history.filter(h => {
    if (selectedPlanTypes.size > 0 && !selectedPlanTypes.has(h.planName || 'Unknown')) return false;
    if (selectedCommStatus.size > 0 && !selectedCommStatus.has(h.status || 'pending')) return false;
    return true;
  });

  const codeFilterCount = selectedStatuses.size + selectedDiscountTiers.size + selectedUseState.size;
  const historyFilterCount = selectedPlanTypes.size + selectedCommStatus.size;

  // Apply Pagination
  const totalCodesPages = Math.ceil(filteredCodes.length / itemsPerPage);
  const currentCodes = filteredCodes.slice((codesPage - 1) * itemsPerPage, codesPage * itemsPerPage);

  const totalHistoryPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const currentHistory = filteredHistory.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);
  // --- END FILTER CALCULATIONS ---

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-6 lg:p-8 pb-10 text-slate-200 w-full max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Referral Management</h1>
          <p className="text-slate-400 text-sm mt-1">Generate codes, track usage, and view commissions.</p>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-[#0f172a] border-slate-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Codes</CardTitle>
            <Tag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{codes.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f172a] border-slate-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Uses</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f172a] border-slate-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Net Commission</CardTitle>
            <span className="h-4 w-4 text-emerald-500 font-bold flex items-center justify-center">₹</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500 whitespace-nowrap overflow-hidden text-ellipsis">₹{totalCommissionEarned.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f172a] border-slate-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Gross Sales Generated</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400 whitespace-nowrap overflow-hidden text-ellipsis">₹{totalSalesGenerated.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="codes" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-[#0f172a] border border-slate-800">
            <TabsTrigger value="codes" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400">Active Codes</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400">Purchase History</TabsTrigger>
          </TabsList>

          <Button variant="outline" size="sm" onClick={() => fetchCodes(role)} className="border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300">
            <RefreshCcw size={14} className="mr-2" /> Refresh Data
          </Button>
        </div>

        <TabsContent value="codes" className="mt-0 outline-none">

          {/* GENERATOR AND TABLE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* GENERATOR CARD */}
            <Card className="lg:col-span-1 shadow-md border-indigo-500/30 bg-[#0f172a] text-white">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-500">
                  <Plus size={24} />
                </div>
                <CardTitle>Create New Referral</CardTitle>
                <CardDescription className="text-slate-400">
                  Assign a discount percentage up to 20%. The remaining balance becomes your commission.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="discount" className="text-slate-300">User Discount %</Label>
                  <Input
                    id="discount"
                    type="text"
                    inputMode="numeric"
                    value={discountPercent}
                    onChange={handleDiscountChange}
                    placeholder="Ex: 10"
                    className="text-lg py-6 bg-slate-900 border-slate-700 text-white focus-visible:ring-indigo-500"
                  />
                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-slate-400">0 - 20% limit</span>
                    <span className="text-emerald-500 font-medium tracking-wide">
                      Your Commission: {employeeCommission}%
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                  size="lg"
                  onClick={handleGenerateCode}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate Code'}
                </Button>

                {newCode && (
                  <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1 uppercase tracking-wider">Success! Your code:</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-500 font-mono tracking-wider select-all">{newCode}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CODES DATA TABLE */}
            <Card className="lg:col-span-2 shadow-md bg-[#0f172a] border-slate-800 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle>
                    {(role === 'admin' || role === 'super_admin') ? 'Master Referral View' : 'My Referral Codes'}
                  </CardTitle>
                  <CardDescription className="mt-1.5 text-slate-400">
                    Overview and usage tracking.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">

                  {/* Type Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className={`border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 gap-2 ${selectedStatuses.size > 0 ? 'border-indigo-500/40 text-indigo-300' : ''}`}>
                        <Filter className="w-3.5 h-3.5" />
                        Status
                        {selectedStatuses.size > 0 && (
                          <span className="bg-indigo-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{selectedStatuses.size}</span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40 bg-[#0f172a] border-slate-700 text-slate-200" align="end">
                      <DropdownMenuLabel className="text-slate-400 text-xs">Filter by Status</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuCheckboxItem checked={selectedStatuses.has('active')} onCheckedChange={() => toggleSet(setSelectedStatuses, 'active')} className="focus:bg-slate-800">
                        Active
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={selectedStatuses.has('disabled')} onCheckedChange={() => toggleSet(setSelectedStatuses, 'disabled')} className="focus:bg-slate-800">
                        Disabled
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Discount Tier Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className={`border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 gap-2 ${selectedDiscountTiers.size > 0 ? 'border-emerald-500/40 text-emerald-300' : ''}`}>
                        <Tag className="w-3.5 h-3.5" />
                        Discount
                        {selectedDiscountTiers.size > 0 && (
                          <span className="bg-emerald-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{selectedDiscountTiers.size}</span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40 bg-[#0f172a] border-slate-700 text-slate-200" align="end">
                      <DropdownMenuLabel className="text-slate-400 text-xs">Filter by Discount</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      {DISCOUNT_TIERS.map(tier => (
                        <DropdownMenuCheckboxItem key={tier} checked={selectedDiscountTiers.has(tier)} onCheckedChange={() => toggleSet(setSelectedDiscountTiers, tier)} className="focus:bg-slate-800">
                          {tier}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Usage Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className={`border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 gap-2 ${selectedUseState.size > 0 ? 'border-violet-500/40 text-violet-300' : ''}`}>
                        <Activity className="w-3.5 h-3.5" />
                        Usage
                        {selectedUseState.size > 0 && (
                          <span className="bg-violet-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{selectedUseState.size}</span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-44 bg-[#0f172a] border-slate-700 text-slate-200" align="end">
                      <DropdownMenuLabel className="text-slate-400 text-xs">Usage Status</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuCheckboxItem checked={selectedUseState.has('used')} onCheckedChange={() => toggleSet(setSelectedUseState, 'used')} className="focus:bg-slate-800 text-emerald-400">
                        Has Uses
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={selectedUseState.has('unused')} onCheckedChange={() => toggleSet(setSelectedUseState, 'unused')} className="focus:bg-slate-800 text-slate-400">
                        No Uses Yet
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {codeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedStatuses(new Set()); setSelectedDiscountTiers(new Set()); setSelectedUseState(new Set()); }} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs h-8 px-2 ml-1">
                      Clear ({codeFilterCount})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-slate-500">Loading codes...</div>
                ) : filteredCodes.length === 0 ? (
                  <div className="text-center py-12 border border-slate-800 border-dashed rounded-lg bg-slate-900/50">
                    {codes.length === 0 ? (
                      <p className="text-slate-400 text-sm">No referral codes found. Generate one to get started!</p>
                    ) : (
                      <p className="text-slate-400 text-sm">No codes perfectly match your selected filters.</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-md border border-slate-800">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-800/50 font-medium">
                          <tr className="border-b border-slate-800">
                            <th className="h-10 px-4 text-slate-400">Code</th>
                            {(role === 'admin' || role === 'super_admin') && (
                              <th className="h-10 px-4 text-slate-400">Creator</th>
                            )}
                            <th className="h-10 px-4 text-center text-slate-400">Discount</th>
                            <th className="h-10 px-4 text-center text-slate-400">Commission</th>
                            <th className="h-10 px-4 text-center text-slate-400">Uses</th>
                            <th className="h-10 px-4 text-right text-slate-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentCodes.map((codeObj, idx) => (
                            <tr key={idx} className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30 last:border-0">
                              <td className="p-4">
                                <code className="relative rounded bg-blue-500/10 border border-blue-500/20 px-[0.5rem] py-[0.3rem] font-mono text-sm font-bold text-blue-400 select-all">
                                  {codeObj.code}
                                </code>
                              </td>
                              {(role === 'admin' || role === 'super_admin') && (
                                <td className="p-4 align-middle text-slate-300">
                                  {codeObj.employeeId?.name || 'Unknown'}
                                </td>
                              )}
                              <td className="p-4 align-middle text-center font-medium text-slate-200">{codeObj.discountPercent}%</td>
                              <td className="p-4 align-middle text-center font-medium text-emerald-500">{codeObj.commissionPercent}%</td>
                              <td className="p-4 align-middle text-center font-medium text-slate-300">{codeObj.usageCount}</td>
                              <td className="p-4 align-middle text-right">
                                <Badge 
                                  variant={codeObj.isActive ? "default" : "destructive"}
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleToggleStatus(codeObj._id)}
                                >
                                  {codeObj.isActive ? 'Active' : 'Disabled'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Codes Pagination */}
                    {totalCodesPages > 1 && (
                      <div className="flex items-center justify-between pt-4 mt-2">
                        <span className="text-sm text-slate-500">
                          Showing {(codesPage - 1) * itemsPerPage + 1} to {Math.min(codesPage * itemsPerPage, filteredCodes.length)} of {filteredCodes.length} entries
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCodesPage(p => Math.max(1, p - 1))}
                            disabled={codesPage === 1}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800/50 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 border border-white/5"
                          >
                            <ChevronLeft size={16} /> Prev
                          </button>
                          <div className="flex items-center gap-1 px-2 hidden sm:flex">
                            {Array.from({ length: totalCodesPages }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCodesPage(i + 1)}
                                className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-all ${codesPage === i + 1
                                  ? 'bg-indigo-500 text-white'
                                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setCodesPage(p => Math.min(totalCodesPages, p + 1))}
                            disabled={codesPage === totalCodesPages}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800/50 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 border border-white/5"
                          >
                            Next <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0 outline-none">
          <Card className="shadow-md bg-[#0f172a] border-slate-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Referral Purchase History</CardTitle>
                <CardDescription className="mt-1.5 text-slate-400">
                  Detailed logs of all successful user subscriptions tied to your referral codes.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {/* Plan Type Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={`border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 gap-2 ${selectedPlanTypes.size > 0 ? 'border-indigo-500/40 text-indigo-300' : ''}`}>
                      <Filter className="w-3.5 h-3.5" />
                      Plan Category
                      {selectedPlanTypes.size > 0 && (
                        <span className="bg-indigo-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{selectedPlanTypes.size}</span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-[#0f172a] border-slate-700 text-slate-200" align="end">
                    <DropdownMenuLabel className="text-slate-400 text-xs">Filter by Plan Type</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    {availablePlanTypes.map(pt => (
                      <DropdownMenuCheckboxItem key={pt} checked={selectedPlanTypes.has(pt)} onCheckedChange={() => toggleSet(setSelectedPlanTypes, pt)} className="focus:bg-slate-800 capitalize">
                        {pt}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {availablePlanTypes.length === 0 && (
                      <div className="px-2 py-2 text-xs text-slate-500">No active plan data...</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Status Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={`border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 gap-2 ${selectedCommStatus.size > 0 ? 'border-emerald-500/40 text-emerald-300' : ''}`}>
                      <Activity className="w-3.5 h-3.5" />
                      Payout Status
                      {selectedCommStatus.size > 0 && (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{selectedCommStatus.size}</span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-44 bg-[#0f172a] border-slate-700 text-slate-200" align="end">
                    <DropdownMenuLabel className="text-slate-400 text-xs">Filter Status</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuCheckboxItem checked={selectedCommStatus.has('paid')} onCheckedChange={() => toggleSet(setSelectedCommStatus, 'paid')} className="focus:bg-slate-800 text-emerald-400">
                      Paid Out
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={selectedCommStatus.has('pending')} onCheckedChange={() => toggleSet(setSelectedCommStatus, 'pending')} className="focus:bg-slate-800 text-slate-400">
                      Pending
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {historyFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedPlanTypes(new Set()); setSelectedCommStatus(new Set()); }} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs h-8 px-2 ml-1">
                    Clear ({historyFilterCount})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading history...</div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12 border border-slate-800 border-dashed rounded-lg bg-slate-900/50">
                  {history.length === 0 ? (
                    <p className="text-slate-400 text-sm">No purchases have been made with your codes yet.</p>
                  ) : (
                    <p className="text-slate-400 text-sm">No purchase history matches your selected filters.</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-md border border-slate-800">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-800/50 font-medium">
                        <tr className="border-b border-slate-800">
                          <th className="h-10 px-4 text-slate-400">Date</th>
                          <th className="h-10 px-4 text-slate-400">Purchaser</th>
                          <th className="h-10 px-4 text-slate-400">Code Used</th>
                          <th className="h-10 px-4 text-center text-slate-400">Plan</th>
                          <th className="h-10 px-4 text-right text-slate-400">Sale Total</th>
                          <th className="h-10 px-4 text-right text-emerald-400">Commission</th>
                          <th className="h-10 px-4 text-right text-slate-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentHistory.map((logObj, idx) => (
                          <tr key={idx} className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30 last:border-0">
                            <td className="p-4 align-middle text-slate-300">
                              {new Date(logObj.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-200">{logObj.userId?.name || 'Unknown User'}</span>
                                <span className="text-xs text-slate-500">{logObj.userId?.email || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <Badge variant="outline" className="font-mono text-blue-400 border-blue-500/20 bg-blue-500/5 select-all">
                                {logObj.referralCode}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle text-center">
                              <span className="font-medium text-slate-300 capitalize">{logObj.planName}</span>
                              <div className="text-[10px] text-slate-500 line-through">₹{logObj.originalPrice}</div>
                            </td>
                            <td className="p-4 align-middle text-right font-semibold text-slate-200">
                              ₹{logObj.amountPaid}
                            </td>
                            <td className="p-4 align-middle text-right font-bold text-emerald-500">
                              +₹{logObj.commissionEarned}
                            </td>
                            <td className="p-4 align-middle text-right">
                              <Badge variant={logObj.status === 'paid' ? "default" : "secondary"}>
                                {logObj.status === 'paid' ? 'Paid Out' : 'Pending'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* History Pagination */}
                  {totalHistoryPages > 1 && (
                    <div className="flex items-center justify-between pt-4 mt-2">
                      <span className="text-sm text-slate-500">
                        Showing {(historyPage - 1) * itemsPerPage + 1} to {Math.min(historyPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} entries
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                          disabled={historyPage === 1}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800/50 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 border border-white/5"
                        >
                          <ChevronLeft size={16} /> Prev
                        </button>
                        <div className="flex items-center gap-1 px-2 hidden sm:flex">
                          {Array.from({ length: totalHistoryPages }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setHistoryPage(i + 1)}
                              className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-all ${historyPage === i + 1
                                ? 'bg-indigo-500 text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                          disabled={historyPage === totalHistoryPages}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800/50 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 border border-white/5"
                        >
                          Next <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs >
    </div >
  );
}
