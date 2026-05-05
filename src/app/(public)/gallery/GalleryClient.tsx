"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Sparkles, ArrowRight, ChevronDown, ImageIcon, Image as ImageIconLucide, Maximize2, X, Loader2, ChevronLeft, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RegisterModal from "@/app/user/_components/RegisterModal";
import LoginModal from "@/app/user/_components/LoginModal";
import { cn } from "@/lib/utils";
import Scene from "./_components/Scene";
import { Badge } from "@/shared-components/ui/badge";
import { Card, CardContent } from "@/shared-components/ui/card";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared-components/ui/dropdown-menu";
import { Button } from "@/shared-components/ui/button";

// --- SECTIONS ADAPTED FOR 3D OVERLAY ---
const INITIAL_CATEGORIES = [
    "Annual Gatherings",
    "Attended Events",
    "Award Ceremony",
    "Award-winning Moments",
    "Company Events",
    "Festivals Celebrations",
    "Global Recognition",
    "Highlights",
    "Team Retreats",
    "Product Launches"
];

const HeroSection = ({ onGetStarted }: { onGetStarted: () => void }) => {
    return (
        <section className="h-[80vh] w-full flex items-center justify-center relative pointer-events-none">
            {/* Content Centered - Uses standard DOM flow inside the Scroll container */}
            <div className="text-center z-10 p-6 pointer-events-auto mt-32 lg:mt-40">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="inline-flex items-center gap-2 border border-white/10 bg-black/40 px-6 py-2 rounded-full text-xs font-mono text-indigo-300 mb-8 backdrop-blur-xl"
                >
                    <Sparkles className="w-3 h-3" />
                    <span className="tracking-[0.3em]">VISUAL JOURNEY</span>
                </motion.div>

                <h1 className="text-[10vw] md:text-[8vw] font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-transparent leading-[0.8] tracking-tighter mix-blend-overlay opacity-90">
                    OUR <br /> GALLERY
                </h1>

                <p className="mt-8 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                    Explore the moments that define our journey. A curated collection of excellence, innovation, and celebration.
                </p>
            </div>
        </section>
    )
}

// --- Helpers ---
const truncateChars = (text: string | undefined, maxChars: number) => {
    if (!text) return "";
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars) + "…";
};

// ─── TYPES ───
type Photo = {
    id: string;
    url: string;
    title: string;
    category: string;
    description?: string;
};

export default function GalleryClient() {
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const handleGetStarted = () => setIsRegisterModalOpen(true);
    const handleSwitchToLogin = () => { setIsRegisterModalOpen(false); setIsLoginModalOpen(true); };
    const handleSwitchToRegister = () => { setIsLoginModalOpen(false); setIsRegisterModalOpen(true); };

    const [selectedCategories, setSelectedCategories] = useState<string[]>(["All Categories"]);
    const [selectedImage, setSelectedImage] = useState<Photo | null>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // --- Dynamic DB State ---
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [categories, setCategories] = useState<string[]>(["All Categories"]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch live photos continuously synced from Cloudinary/DB
    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/gallery`);
                const result = await response.json();
                if (result.success) {
                    const fetchedPhotos = result.data.map((p: any) => ({
                        id: p._id,
                        url: p.url,
                        title: p.title,
                        category: p.category,
                        description: p.description
                    }));
                    setPhotos(fetchedPhotos);

                    // Reconstruct fresh category list based on Admin's predefined list + live images
                    const uniqueCats = new Set<string>(["All Categories", ...INITIAL_CATEGORIES]);
                    fetchedPhotos.forEach((p: Photo) => uniqueCats.add(p.category));
                    setCategories(Array.from(uniqueCats));
                }
            } catch (error) {
                console.error("Failed to load gallery:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGallery();
    }, []);

    const filteredImages = useMemo(() => {
        if (selectedCategories.includes("All Categories") || selectedCategories.length === 0) return photos;
        return photos.filter(img => selectedCategories.includes(img.category));
    }, [selectedCategories, photos]);

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev => {
            if (category === "All Categories") return ["All Categories"];

            const newCats = prev.filter(c => c !== "All Categories");
            if (newCats.includes(category)) {
                const filtered = newCats.filter(c => c !== category);
                return filtered.length === 0 ? ["All Categories"] : filtered;
            } else {
                return [...newCats, category];
            }
        });
    };

    // --- Lightbox Navigation Handlers ---
    const handleNext = useCallback(() => {
        if (!selectedImage || filteredImages.length <= 1) return;
        const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
        const nextIndex = (currentIndex + 1) % filteredImages.length;
        setSelectedImage(filteredImages[nextIndex]);
    }, [selectedImage, filteredImages]);

    const handlePrev = useCallback(() => {
        if (!selectedImage || filteredImages.length <= 1) return;
        const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
        const prevIndex = (currentIndex - 1 + filteredImages.length) % filteredImages.length;
        setSelectedImage(filteredImages[prevIndex]);
    }, [selectedImage, filteredImages]);

    // Handle Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedImage) return;
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "Escape") setSelectedImage(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedImage, handleNext, handlePrev]);

    useEffect(() => {
        setIsDescriptionExpanded(false);
    }, [selectedImage]);

    return (
        <>
            <Scene>
                <main className="w-full px-4 md:px-10 pb-40 text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-white">

                    {/* 1. HERO */}
                    <HeroSection onGetStarted={handleGetStarted} />

                    {/* 2. GALLERY INTERFACE */}
                    <section className="relative z-10 max-w-7xl mx-auto min-h-screen pb-32">

                        {/* Filters Interface */}
                        <div className="sticky top-24 lg:top-32 z-50 flex items-center justify-between bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 md:px-8 shadow-2xl mb-12">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
                                    <ImageIconLucide className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm md:text-base tracking-wide">Category Filter</h3>
                                    <p className="text-xs text-slate-500 font-mono hidden md:block">Select an event category</p>
                                </div>
                            </div>

                            {/* Premium Multi-Select Dropdown */}
                            <div className="relative min-w-[200px] md:min-w-[280px]">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full flex items-center justify-between px-5 h-12 md:h-14 bg-[#0F172A]/80 hover:bg-[#1E293B]/80 transition-all border border-white/10 rounded-xl text-sm font-medium focus:ring-1 focus:ring-indigo-500/50 outline-none text-slate-200"
                                        >
                                            <span className="truncate max-w-[150px] md:max-w-[200px]">
                                                {selectedCategories.includes("All Categories")
                                                    ? "All Categories"
                                                    : selectedCategories.join(", ")}
                                            </span>
                                            <ChevronDown className="w-4 h-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        sideOffset={8}
                                        className="w-[200px] md:w-[280px] bg-[#0F172A]/95 backdrop-blur-3xl border border-white/10 rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] text-slate-200 z-[100]"
                                    >
                                        <DropdownMenuLabel className="text-xs font-mono text-indigo-400/70 tracking-widest uppercase py-2 px-3">Filter by Category</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-white/5" />
                                        {categories.map((category) => (
                                            <DropdownMenuCheckboxItem
                                                key={category}
                                                checked={selectedCategories.includes(category)}
                                                onCheckedChange={() => toggleCategory(category)}
                                                onSelect={(e) => e.preventDefault()}
                                                className="focus:bg-indigo-500/20 focus:text-indigo-200 cursor-pointer rounded-lg my-0.5 mx-1 transition-colors pl-10 pr-4 py-2.5 text-sm data-[state=checked]:text-indigo-400"
                                            >
                                                {category}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Masonry/Grid Gallery */}
                        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    // SKELETON LOADING SPINNERS
                                    Array(6).fill(0).map((_, i) => (
                                        <motion.div
                                            key={`skeleton-${i}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="rounded-3xl bg-[#0F172A]/80 border border-white/5 aspect-[4/3] flex items-center justify-center backdrop-blur-sm"
                                        >
                                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500/50" />
                                                <span className="text-xs font-mono font-medium tracking-widest uppercase">Fetching Visuals...</span>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    filteredImages.map((image) => (
                                        <motion.div
                                            key={image.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                                            className="group cursor-pointer"
                                            onClick={() => setSelectedImage(image)}
                                        >
                                            <Card className="relative rounded-3xl overflow-hidden bg-white/5 border border-white/10 aspect-[4/3] border-none">
                                                <CardContent className="p-0 h-full w-full">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={image.url}
                                                        alt={image.title}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1e1b4b/white?text=Broken+Image';
                                                        }}
                                                    />

                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                                        <Badge variant="outline" className="w-fit mb-2 bg-indigo-500/10 border-indigo-500/20 text-indigo-400 uppercase tracking-wider text-[10px] font-mono">
                                                            {image.category}
                                                        </Badge>
                                                        <h4 className="text-xl font-bold text-white flex justify-between items-center">
                                                            {image.title}
                                                            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                                                                <Maximize2 className="w-4 h-4" />
                                                            </div>
                                                        </h4>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                            {!isLoading && filteredImages.length === 0 && (
                                <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-20 text-center">
                                    <div className="inline-flex w-16 h-16 rounded-2xl bg-white/5 border border-white/10 items-center justify-center mb-4">
                                        <ImageIcon className="w-8 h-8 text-slate-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Images Found</h3>
                                    <p className="text-slate-400">We are currently curating content for this category.</p>
                                </div>
                            )}
                        </motion.div>
                    </section>

                    {/* 3. FOOTER CTA */}
                    <section className="h-[60vh] flex flex-col items-center justify-center text-center">
                        <h2 className="text-5xl md:text-8xl font-bold text-white tracking-tighter mb-8">
                            Join the Story.
                        </h2>
                        <button onClick={handleGetStarted} className="px-10 py-4 bg-white text-black rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                            Become a Part
                        </button>
                    </section>

                </main>
            </Scene>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 z-[200] flex items-start justify-center pt-20 md:pt-32 pb-10 overflow-y-auto bg-black/95 backdrop-blur-xl px-4 md:px-8 cursor-pointer"
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-24 right-6 md:top-36 md:right-12 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 shadow-2xl backdrop-blur-md border border-white/10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                if (x < rect.width / 2) handlePrev();
                                else handleNext();
                            }}
                            className="w-full max-w-6xl flex flex-col cursor-auto relative my-auto md:my-0 mt-4 md:mt-0"
                        >
                            {/* Navigation Arrows for UI */}
                            {filteredImages.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-black/40 hover:bg-black/80 rounded-full text-white transition-all transform hover:-translate-x-1 z-50 border border-white/10 md:left-[-4rem]"
                                    >
                                        <ChevronLeft className="w-8 h-8" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-black/40 hover:bg-black/80 rounded-full text-white transition-all transform hover:translate-x-1 z-50 border border-white/10 md:right-[-4rem]"
                                    >
                                        <ChevronRight className="w-8 h-8" />
                                    </button>
                                </>
                            )}

                            <div className="w-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                <div className="flex flex-col md:flex-row gap-8 items-center md:items-stretch p-4 md:p-8">
                                    {/* Left: Image */}
                                    <div className="w-full md:w-[60%] flex items-center justify-center">
                                        <div className="relative group/lightimg w-full h-full flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={selectedImage?.url}
                                                alt={selectedImage?.title}
                                                className="max-w-full max-h-[50vh] md:max-h-[65vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
                                            />
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/lightimg:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Right: Info */}
                                    <div className="w-full md:w-[40%] flex flex-col justify-center text-left space-y-4">
                                        <div className="space-y-2">
                                            <Badge variant="outline" className="bg-indigo-500/10 border-indigo-500/30 text-indigo-300 px-4 py-1 text-xs font-mono uppercase tracking-widest">
                                                {selectedImage?.category}
                                            </Badge>
                                            <h3 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight leading-tight">
                                                {selectedImage?.title}
                                            </h3>
                                        </div>

                                        {selectedImage?.description && (
                                            <div className="space-y-4">
                                                <div className={cn(
                                                    "text-slate-300 leading-relaxed text-sm md:text-base pr-2 transition-all",
                                                    isDescriptionExpanded ? "max-h-[30vh] overflow-y-auto" : "max-h-24 overflow-hidden"
                                                )}>
                                                    {isDescriptionExpanded
                                                        ? selectedImage.description
                                                        : truncateChars(selectedImage.description, 100)}
                                                </div>

                                                {selectedImage.description.length > 100 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsDescriptionExpanded(!isDescriptionExpanded);
                                                        }}
                                                        className="text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center gap-1 transition-colors uppercase tracking-[0.2em]"
                                                    >
                                                        {isDescriptionExpanded ? "Show Less" : "Read More"}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <RegisterModal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} onSwitchToLogin={handleSwitchToLogin} />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onSwitchToRegister={handleSwitchToRegister} />
        </>
    );
}