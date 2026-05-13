"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mail, User, CheckCircle, Building2, Phone, UserCircle2, AlertCircle } from "lucide-react";
import { authApi, organizationApi, departmentApi } from "@/lib/api";
import { LocationSelect } from "@/shared-components/LocationSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared-components/ui/dialog";
import { Input } from "@/shared-components/ui/input";
import { Button } from "@/shared-components/ui/button";
import { Label } from "@/shared-components/ui/label";
import { Separator } from "@/shared-components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared-components/ui/tabs";

const DESIGNATIONS = [
  { label: "Dean", value: "dean" },
  { label: "Director", value: "director" },
  { label: "Principal", value: "principal" },
  { label: "Admin", value: "admin" },
  { label: "Other", value: "other" },
];

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [registerMode, setRegisterMode] = useState<'user' | 'organization'>('user');

  // Async Data
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");

  const [stateError, setStateError] = useState("");
  const [cityError, setCityError] = useState("");

  useEffect(() => {
    organizationApi.getPublicList()
      .then(res => setOrganizations(res.organizations || []))
      .catch(err => console.error("Failed to fetch organizations", err));
  }, []);

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    setSelectedDeptId("");
    if (orgId) {
      departmentApi.getPublicDepartments(orgId)
        .then(res => setDepartments(res.departments || []))
        .catch(err => console.error("Failed to fetch departments", err));
    } else {
      setDepartments([]);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [orgFormData, setOrgFormData] = useState({
    organizationName: "",
    organizationType: "university" as 'university' | 'college' | 'institute' | 'school' | 'other',
    address: "",
    city: "",
    state: "",
    pincode: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    registeredByName: "",
    registeredByDesignation: "",
  });

  // Replaced with LocationSelect handled locally

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (registerMode === 'user') {
        await authApi.register({
          email: formData.email,
          name: formData.name,
          organizationId: selectedOrgId || undefined,
          departmentId: selectedDeptId || undefined,
        });
      } else {
        // Client-side required guard for react-select fields (bypasses HTML5 validation)
        let hasError = false;
        if (!orgFormData.state) { setStateError("Please select a state."); hasError = true; } else { setStateError(""); }
        if (!orgFormData.city) { setCityError("Please select a city."); hasError = true; } else { setCityError(""); }
        if (!orgFormData.registeredByDesignation) { setError("Please select your designation."); hasError = true; }
        
        if (hasError) {
          setIsLoading(false);
          return;
        }

        await organizationApi.register({
          organizationName: orgFormData.organizationName,
          organizationType: orgFormData.organizationType,
          address: orgFormData.address,
          city: orgFormData.city,
          state: orgFormData.state,
          pincode: orgFormData.pincode,
          contactEmail: orgFormData.contactEmail,
          contactPhone: orgFormData.contactPhone,
          website: orgFormData.website || undefined,
          registeredBy: {
            name: orgFormData.registeredByName,
            designation: orgFormData.registeredByDesignation,
          },
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        if (registerMode === 'user') {
          setFormData({ name: "", email: "" });
        } else {
          setOrgFormData({
            organizationName: "", organizationType: "university", address: "", city: "",
            state: "", pincode: "", contactEmail: "", contactPhone: "",
            website: "", registeredByName: "", registeredByDesignation: "",
          });
        }
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />

        <div className="p-6 pt-8 pb-8">
          {success ? (
            <div className="text-center py-8 animate-in zoom-in duration-500">
              <div className="mx-auto bg-green-50 dark:bg-green-500/10 h-20 w-20 rounded-full flex items-center justify-center mb-6 ring-8 ring-white dark:ring-slate-950 shadow-sm">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                Check Your Email! 🎉
              </h3>
              <p className="text-gray-500 dark:text-slate-400 mb-2">
                We've sent a verification link to
              </p>
              <p className="text-green-600 dark:text-green-400 font-semibold mb-6 text-lg">
                {registerMode === 'user' ? formData.email : orgFormData.contactEmail}
              </p>
              <p className="text-sm text-gray-400 font-medium">
                Click the link to complete your registration
              </p>
            </div>
          ) : (
            <>
              <DialogHeader className="text-center sm:text-center pb-6">
                <div className="mx-auto bg-purple-50 dark:bg-purple-500/10 h-16 w-16 rounded-full flex items-center justify-center mb-4 ring-8 ring-white dark:ring-slate-950 shadow-sm">
                  <User className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Create Account
                </DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-slate-400 pt-1.5">
                  Join thousands of users building the future
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-500/10 border-l-2 border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-r-md text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  {error}
                </div>
              )}

              <Tabs 
                defaultValue="user"
                value={registerMode} 
                onValueChange={(val) => setRegisterMode(val as 'user'|'organization')}
                className="w-full mb-6"
              >
                <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 dark:bg-slate-900/80 rounded-lg">
                  <TabsTrigger value="user" className="rounded-md font-medium text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-sm transition-all duration-200">User</TabsTrigger>
                  <TabsTrigger value="organization" className="rounded-md font-medium text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all duration-200">Organization</TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={handleRegister} className="space-y-4">
                {registerMode === 'user' ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="orgSelect" className="text-sm font-medium">Organization (Optional)</Label>
                        <select
                          id="orgSelect"
                          value={selectedOrgId}
                          onChange={(e) => handleOrgChange(e.target.value)}
                          className="w-full h-11 px-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-purple-500 focus-visible:border-purple-500 outline-none text-gray-900 dark:text-white transition-all shadow-sm"
                        >
                          <option value="">Select Organization</option>
                          {organizations.map((org: any) => (
                            <option key={org._id || org.id} value={org._id || org.id}>
                              {org.organizationName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deptSelect" className="text-sm font-medium">Department (Optional)</Label>
                        <select
                          id="deptSelect"
                          value={selectedDeptId}
                          onChange={(e) => setSelectedDeptId(e.target.value)}
                          className="w-full h-11 px-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-purple-500 focus-visible:border-purple-500 outline-none text-gray-900 dark:text-white transition-all shadow-sm disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-slate-900"
                          disabled={!selectedOrgId}
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept: any) => (
                            <option key={dept._id || dept.id} value={dept._id || dept.id}>
                              {dept.departmentName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                      <div className="relative">
                        <UserCircle2 className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Arjun Singh"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="pl-10 pb-0 pt-0 h-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-purple-500 focus-visible:border-purple-500 shadow-sm transition-all rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="pl-10 pb-0 pt-0 h-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-purple-500 focus-visible:border-purple-500 shadow-sm transition-all rounded-lg"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-11 mt-4 bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md rounded-lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Creating account...</span>
                        </div>
                      ) : (
                        "Get Started Free"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 animate-in fade-in pb-2 custom-scrollbar">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Organization Details</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="orgType" className="text-sm font-medium">Organization Type *</Label>
                          <select
                            id="orgType"
                            required
                            value={orgFormData.organizationType}
                            onChange={(e) => setOrgFormData({ ...orgFormData, organizationType: e.target.value as any })}
                            className="w-full h-10 px-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white transition-all shadow-sm"
                          >
                            <option value="">Select type...</option>
                            <option value="university">University</option>
                            <option value="college">College</option>
                            <option value="institute">Institute</option>
                            <option value="school">School</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="orgName" className="text-sm font-medium">Organization Name *</Label>
                          <Input
                            id="orgName"
                            placeholder="ABC University"
                            required
                            value={orgFormData.organizationName}
                            onChange={(e) => setOrgFormData({ ...orgFormData, organizationName: e.target.value })}
                            className="h-10 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 shadow-sm rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium">Address *</Label>
                        <Input
                          id="address"
                          placeholder="123 Main Street"
                          required
                          value={orgFormData.address}
                          onChange={(e) => setOrgFormData({ ...orgFormData, address: e.target.value })}
                          className="h-10 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 shadow-sm rounded-lg"
                        />
                      </div>

                      <LocationSelect
                        onStateChange={(name, code) => {
                          setOrgFormData(prev => ({ ...prev, state: name, city: "" }));
                          setStateError("");
                          setCityError("");
                        }}
                        onCityChange={(name) => {
                          setOrgFormData(prev => ({ ...prev, city: name }));
                          setCityError("");
                        }}
                        stateError={stateError}
                        cityError={cityError}
                        disabled={isLoading}
                      />
                      <div className="space-y-2">
                        <Label htmlFor="pincode" className="text-sm font-medium">Pincode *</Label>
                        <Input
                          id="pincode"
                          placeholder="400001"
                          required
                          value={orgFormData.pincode}
                          onChange={(e) => setOrgFormData({ ...orgFormData, pincode: e.target.value })}
                          className="h-10 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 shadow-sm rounded-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-sm font-medium">Website (Optional)</Label>
                        <Input
                          id="website"
                          type="url"
                          placeholder="https://example.com"
                          value={orgFormData.website}
                          onChange={(e) => setOrgFormData({ ...orgFormData, website: e.target.value })}
                          className="h-10 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 shadow-sm rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                        <Phone className="h-4 w-4 text-indigo-500" />
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Contact Information</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contactEmail" className="text-sm font-medium">Contact Email *</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            placeholder="contact@example.com"
                            required
                            value={orgFormData.contactEmail}
                            onChange={(e) => setOrgFormData({ ...orgFormData, contactEmail: e.target.value })}
                            className="h-10 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 shadow-sm rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactPhone" className="text-sm font-medium">Contact Phone *</Label>
                          <Input
                            id="contactPhone"
                            type="tel"
                            placeholder="+91 9876543210"
                            required
                            value={orgFormData.contactPhone}
                            onChange={(e) => setOrgFormData({ ...orgFormData, contactPhone: e.target.value })}
                            className="h-10 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 shadow-sm rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                        <UserCircle2 className="h-4 w-4 text-purple-500" />
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Admin Details</h3>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminName" className="text-sm font-medium">Admin Name *</Label>
                        <Input
                          id="adminName"
                          placeholder="John Doe"
                          required
                          value={orgFormData.registeredByName}
                          onChange={(e) => setOrgFormData({ ...orgFormData, registeredByName: e.target.value })}
                          className="h-10 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-purple-500 focus-visible:border-purple-500 shadow-sm rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="designation" className="text-sm font-medium">Designation *</Label>
                        <select
                          id="designation"
                          required
                          value={orgFormData.registeredByDesignation}
                          onChange={(e) => setOrgFormData({ ...orgFormData, registeredByDesignation: e.target.value })}
                          className="w-full h-10 px-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 dark:text-white transition-all shadow-sm"
                        >
                          <option value="">Select designation...</option>
                          {DESIGNATIONS.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-11 mt-6 bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md rounded-lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Registering Organization...</span>
                        </div>
                      ) : (
                        "Register Organization"
                      )}
                    </Button>
                  </div>
                )}
              </form>



              <div className="mt-8 text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-semibold text-purple-600 hover:text-purple-700"
                  onClick={() => {
                    onClose();
                    onSwitchToLogin();
                  }}
                >
                  Sign in
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
