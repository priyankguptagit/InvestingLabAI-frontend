"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    LogOut, User, Settings, Menu, Users, Camera, Loader2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared-components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared-components/ui/avatar";
import { Button } from "@/shared-components/ui/button";
import { coordinatorApi } from "@/lib/api";
import axiosInstance from "@/lib/axios";

export default function CoordinatorNavbar() {
    const router = useRouter();

    const [coordName, setCoordName] = useState("Coordinator");
    const [coordEmail, setCoordEmail] = useState("Loading...");
    // Avatar from DepartmentCoordinatorModel — isolated from UserModel
    const [coordAvatar, setCoordAvatar] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await coordinatorApi.getMe();
                if (data.success && data.coordinator) {
                    setCoordName(data.coordinator.name || "Coordinator");
                    setCoordEmail(data.coordinator.email || "coordinator@org.com");
                    // Bind profilePhoto from DepartmentCoordinatorModel — never UserModel
                    setCoordAvatar(data.coordinator.profilePhoto || null);
                }
            } catch (e) {
                setCoordName("Coordinator");
            }
        };

        fetchProfile();

        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await coordinatorApi.logout();
        } catch (e) {
            console.error(e);
        } finally {
            router.push("/");
        }
    };

    // Avatar upload — writes to DepartmentCoordinatorModel via PUT /api/coordinator/me
    // Never touches UserModel
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!validTypes.includes(file.type)) return;
        if (file.size > 5 * 1024 * 1024) return;

        const localPreview = URL.createObjectURL(file);
        setCoordAvatar(localPreview);
        setAvatarUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);
            const res = await axiosInstance.post("/api/upload?folder=praedico_coord_avatars", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const cloudUrl: string = res.data?.url;
            if (!cloudUrl) throw new Error("No URL returned");
            // Persist to DepartmentCoordinatorModel only
            await coordinatorApi.updateProfile({ profilePhoto: cloudUrl });
            setCoordAvatar(cloudUrl);
            URL.revokeObjectURL(localPreview);
        } catch {
            setCoordAvatar(null);
            URL.revokeObjectURL(localPreview);
        } finally {
            setAvatarUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const initials = coordName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

    return (
        <header
            className={`sticky top-0 z-40 flex h-20 w-full items-center justify-between px-6 transition-all duration-500 ease-in-out border-b ${scrolled
                ? "bg-[#0f172a]/90 backdrop-blur-xl border-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
                : "bg-[#030712] border-transparent shadow-none"
                }`}
        >

            {/* =======================
          LEFT: BRAND & SEARCH
         ======================= */}
            <div className="flex items-center gap-8">

                {/* Mobile Toggle */}
                <Button variant="ghost" size="icon" className="md:hidden text-slate-400 hover:text-white hover:bg-white/10">
                    <Menu className="h-6 w-6" />
                </Button>


            </div>

            {/* =======================
          RIGHT: ACTIONS & PROFILE
         ======================= */}
            <div className="flex items-center gap-5">



                {/* User Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 group outline-none">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                                    {coordName}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase group-hover:text-slate-400">
                                    Coordinator
                                </p>
                            </div>

                            {/* Avatar — dynamically bound to DepartmentCoordinatorModel */}
                            <div className="relative h-11 w-11 p-[2px] rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-rose-500 group-hover:rotate-180 transition-all duration-700">
                                <Avatar className="h-full w-full border-2 border-[#0f172a] group-hover:rotate-[-180deg] transition-all duration-700">
                                    {coordAvatar ? (
                                        <AvatarImage src={coordAvatar} alt={coordName} />
                                    ) : null}
                                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-700 text-white font-bold text-sm">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 border-[3px] border-[#0f172a] rounded-full"></div>
                            </div>
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-64 bg-[#1e293b]/95 backdrop-blur-xl border-slate-700 text-slate-200 mt-2 mr-2 shadow-2xl shadow-black/50 rounded-2xl p-2" align="end" forceMount>

                        <div className="px-2 py-3 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl mb-2 border border-purple-500/10">
                            <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Signed in as</p>
                            <p className="text-sm font-medium text-white truncate">{coordEmail}</p>
                        </div>

                        {/* Avatar Upload — writes only to DepartmentCoordinatorModel */}
                        <div className="px-2 mb-2">
                            <button
                                onClick={() => !avatarUploading && fileInputRef.current?.click()}
                                disabled={avatarUploading}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 border border-dashed border-slate-700 hover:border-purple-500/40 transition-all duration-200"
                            >
                                {avatarUploading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Camera className="h-3.5 w-3.5" />
                                )}
                                {avatarUploading ? "Uploading..." : "Change Photo"}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </div>

                        <DropdownMenuGroup className="space-y-1">
                            <DropdownMenuItem className="cursor-pointer rounded-lg focus:bg-purple-600 focus:text-white transition-colors py-2.5">
                                <Users className="mr-3 h-4 w-4" />
                                <span className="font-medium">My Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer rounded-lg focus:bg-purple-600 focus:text-white transition-colors py-2.5">
                                <Settings className="mr-3 h-4 w-4" />
                                <span className="font-medium">Settings</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator className="bg-slate-700/50 my-2" />

                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-red-400 focus:text-white focus:bg-red-500 cursor-pointer rounded-lg py-2.5 transition-all hover:pl-4"
                        >
                            <LogOut className="mr-3 h-4 w-4" />
                            <span className="font-medium">Log out</span>
                        </DropdownMenuItem>

                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
