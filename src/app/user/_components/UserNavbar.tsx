"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authApi } from "@/lib/api";
import ProfileModal from "./ProfileModal";
import {
  LayoutDashboard, Briefcase, BarChart2, Wallet,
  ArrowRightLeft, LogOut, User, Settings, ChevronDown,
  Newspaper, Menu, X, Sun, Moon, MessageSquarePlus
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/shared-components/ui/dropdown-menu";
import { useTheme } from "next-themes";

export function UserNavbar() {
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("Loading...");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState("Free");
  const [isOrgStudent, setIsOrgStudent] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgLogoUrl, setOrgLogoUrl] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgLogoError, setOrgLogoError] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const CACHE_KEY = 'praedico_user_profile';
        const cached = sessionStorage.getItem(CACHE_KEY);
        let userData: any;
        if (cached) {
          userData = JSON.parse(cached);
        } else {
          const data = await authApi.getMe();
          if (data.success && data.user) {
            userData = data.user;
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(userData));
          }
        }
        if (userData) {
          const nameFromEmail = userData.email?.split('@')[0];
          setUserName(userData.name || nameFromEmail);
          setUserEmail(userData.email);
          setUserAvatar(userData.avatar || null);
          setCurrentPlan(userData.currentPlan || "Free");
          const orgStudent = !!userData.isOrgStudent;
          setIsOrgStudent(orgStudent);
          if (orgStudent) {
            setOrgName(userData.orgName || "");
            setOrgLogoUrl(userData.orgLogoUrl || "");
            setOrgWebsite(userData.orgWebsite || "");
          }
        }
      } catch (e) { console.error("Guest mode"); }
    };
    fetchProfile();
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
    { label: "Portfolio", href: "/user/portfolio", icon: Briefcase },
    { label: "Trading", href: "/user/dashboard/trading", icon: BarChart2 },
    { label: "News", href: "/user/news", icon: Newspaper },
    { label: "Premium", href: "/user/premium", icon: Wallet, hideForOrg: true },
    { label: "Reports", href: "/user/reports", icon: ArrowRightLeft },
    { label: "Feedback", href: "/user/feedback", icon: MessageSquarePlus },
  ];

  const visibleNavItems = navItems.filter(
    item => !(item.hideForOrg && isOrgStudent && currentPlan !== "Free")
  );

  // 3. Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isPremiumPage = pathname === '/user/premium';

  return (
    <>

      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 animate-slide-down ${scrolled || mobileMenuOpen || isPremiumPage
          ? "bg-white/70 dark:bg-background/80 backdrop-blur-2xl border-b border-indigo-100/50 dark:border-white/[0.02] shadow-sm shadow-indigo-500/5"
          : "bg-transparent border-transparent"
          }`}
      >

        <div className="max-w-[1920px] mx-auto px-6 md:px-8 h-16 md:h-20 flex items-center justify-between relative z-50">

          {/* LEFT: Praedico + Org Logo (for org students) */}
          <div className="flex items-center gap-2 xl:gap-4 shrink min-w-0">
            <Link href="/user/dashboard" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 bg-indigo-500 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                <img 
                  src="https://res.cloudinary.com/ddhxmcgl9/image/upload/v1776916113/praedico/praedico_logo.png" 
                  alt="Praedico Logo"
                  className="relative h-10 w-10 object-contain rounded-xl shadow-xl group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 hidden md:block tracking-tight drop-shadow-sm">
                Praedico Global Research
              </span>
            </Link>

            {/* Org Logo Badge — shown only for org students */}
            {isOrgStudent && (orgLogoUrl || orgName) && (
              (() => {
                const badgeContent = (
                  <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 dark:bg-slate-800/50 border border-white/10 dark:border-slate-700/40 backdrop-blur-md shadow-sm">
                    <div className="h-px w-4 bg-gradient-to-r from-transparent via-slate-400/40 to-transparent" />
                    {orgLogoUrl && !orgLogoError ? (
                      <img
                        src={orgLogoUrl}
                        alt={orgName || "Organization"}
                        title={orgName}
                        onError={() => setOrgLogoError(true)}
                        className="h-6 w-auto max-w-[80px] object-contain rounded opacity-90"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-300 tracking-wide max-w-[120px] truncate">{orgName}</span>
                    )}
                    {orgLogoUrl && !orgLogoError && orgName && (
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden lg:block truncate max-w-[100px]">{orgName}</span>
                    )}
                  </div>
                );
                return orgWebsite ? (
                  <a
                    href={orgWebsite.startsWith('http') ? orgWebsite : `https://${orgWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Visit ${orgName || 'organization'} website`}
                    className="hover:opacity-80 transition-opacity duration-200"
                  >
                    {badgeContent}
                  </a>
                ) : badgeContent;
              })()
            )}

            {/* DESKTOP NAV - Premium Pills */}
            <nav className="hidden xl:flex items-center gap-0.5 xl:gap-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/40 dark:border-slate-700/40 shadow-sm shrink-0">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 xl:gap-2 px-3 xl:px-4 2xl:px-5 py-2 rounded-full text-xs xl:text-sm font-semibold transition-all duration-300 ${isActive
                      ? "text-white shadow-md shadow-indigo-500/25"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60"
                      }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full -z-10 animate-fade-in" />
                    )}
                    <Icon size={16} className={`${isActive ? "stroke-[2.5px]" : "stroke-[2px] opacity-70"} xl:w-[18px] xl:h-[18px]`} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* RIGHT: ACTIONS */}
          <div className="flex items-center gap-2 xl:gap-3 shrink-0">



            {/* MOBILE TOGGLE BUTTON */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden h-11 w-11 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all active:scale-95 shrink-0"
            >
              {/* Lucide Menu/X icons will need to be imported if not already */}
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
              )}
            </button>


            {/* PROFILE DROPDOWN (shown on xl+ — hides below xl where hamburger takes over) */}
            <div className="hidden xl:block shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 xl:gap-2.5 pl-1.5 pr-2 xl:pr-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 group backdrop-blur-sm max-w-[160px] xl:max-w-[220px]">
                    <div className="h-8 w-8 xl:h-9 xl:w-9 ring-2 ring-white dark:ring-slate-700 shadow-sm rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                        {userAvatar ? (
                          <img src={userAvatar} alt="avatar" className="h-full w-full object-cover" />
                        ) : (
                          userName.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="text-left hidden 2xl:block min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors truncate max-w-[90px] xl:max-w-[110px]">{userName}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate max-w-[90px] xl:max-w-[110px]">{currentPlan} Account</p>
                    </div>
                    <ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-60 p-2 rounded-2xl border-slate-100 dark:border-white/10 shadow-xl shadow-indigo-500/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl"
                  align="end"
                  sideOffset={8}
                  collisionPadding={12}
                >
                  <DropdownMenuLabel className="font-normal px-3 py-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none text-slate-800 dark:text-white">{userName}</p>
                      <p className="text-xs leading-none text-slate-500 dark:text-slate-400 font-medium">{userEmail}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl focus:bg-indigo-50 dark:focus:bg-indigo-900/30 focus:text-indigo-700 dark:focus:text-indigo-300 py-2.5 font-medium transition-colors"
                    onClick={() => setProfileOpen(true)}
                  >
                    <User className="mr-3 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl focus:bg-indigo-50 dark:focus:bg-indigo-900/30 focus:text-indigo-700 dark:focus:text-indigo-300 py-2.5 font-medium transition-colors"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? <Sun className="mr-3 h-4 w-4" /> : <Moon className="mr-3 h-4 w-4" />}
                    <span>Switch to {theme === "dark" ? "Light" : "Dark"} Mode</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-xl py-2.5 font-bold cursor-pointer transition-colors"
                    onClick={async () => {
                      try {
                        await authApi.logout();
                        sessionStorage.removeItem('praedico_user_profile');
                        window.location.href = "/";
                      } catch (e) { }
                    }}
                  >
                    <LogOut className="mr-3 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          </div>
        </div>

        {/* --- BEAUTIFUL MOBILE TOP TOGGLE MENU --- */}
        {mobileMenuOpen && (
          <div className="absolute top-20 left-0 w-full bg-white/80 dark:bg-background/80 backdrop-blur-2xl border-b border-indigo-100/50 dark:border-white/10/50 shadow-2xl shadow-indigo-500/10 p-6 flex flex-col gap-4 animate-mobile-menu xl:hidden origin-top scale-y-100">

            {/* Mobile Profile Snippet */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 mb-2">
              <div className="h-12 w-12 ring-2 ring-white dark:ring-slate-700 shadow-sm rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-base shrink-0 overflow-hidden">
                {userAvatar ? (
                  <img src={userAvatar} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{userName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-200 border ${isActive
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300"
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200"
                      }`}
                  >
                    <Icon size={24} className={isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"} />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="h-px bg-slate-200/60 dark:bg-slate-700/60 my-2" />

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-full py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              <span>Switch to {theme === "dark" ? "Light" : "Dark"} Mode</span>
            </button>

            <button
              onClick={async () => {
                try { await authApi.logout(); sessionStorage.removeItem('praedico_user_profile'); window.location.href = "/"; } catch (e) { }
              }}
              className="w-full py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        )}

      </header>
      <ProfileModal 
        open={profileOpen} 
        onClose={() => setProfileOpen(false)} 
        onUpdate={(avatar, name) => {
          if (avatar !== undefined) setUserAvatar(avatar);
          if (name !== undefined) setUserName(name);
        }}
      />
    </>
  );
}
