"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared-components/ui/dropdown-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared-components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared-components/ui/dialog";
import { Button } from "@/shared-components/ui/button";
import { Input } from "@/shared-components/ui/input";
import { Label } from "@/shared-components/ui/label";
import { ImageIcon, Plus, Trash2, X, ChevronLeft, ChevronRight, Maximize2, Sparkles, FolderPlus, UploadCloud, FileImage, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Helpers ---
const truncateChars = (text: string | undefined, maxChars: number) => {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "…";
};

// --- Types ---
type Photo = {
  id: string;
  url: string;
  title: string;
  category: string;
  description?: string;
};

// Initial Categories
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

const INITIAL_IMAGES: Photo[] = [
  { id: "1", category: "Annual Gatherings", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop", title: "Global Summit 2025" },
  { id: "2", category: "Award Ceremony", url: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop", title: "Excellence Awards" },
  { id: "3", category: "Highlights", url: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop", title: "Keynote Session" },
  { id: "4", category: "Company Events", url: "https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=800&auto=format&fit=crop", title: "Q3 Townhall" },
  { id: "5", category: "Global Recognition", url: "https://images.unsplash.com/photo-1475721025505-c08974ee03fb?q=80&w=800&auto=format&fit=crop", title: "International Press" },
  { id: "6", category: "Award-winning Moments", url: "https://images.unsplash.com/photo-1561489413-985b06da5bee?q=80&w=800&auto=format&fit=crop", title: "Innovation Trophy" },
  { id: "7", category: "Team Retreats", url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop", title: "Leadership Retreat" },
  { id: "8", category: "Festivals Celebrations", url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=800&auto=format&fit=crop", title: "Diwali 2025" },
  { id: "9", category: "Attended Events", url: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=800&auto=format&fit=crop", title: "Tech Conference" },
  { id: "10", category: "Product Launches", url: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop", title: "V3.0 Unveiling" },
  { id: "11", category: "Highlights", url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop", title: "Founders Panel" },
  { id: "12", category: "Company Events", url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800&auto=format&fit=crop", title: "Hackathon Finals" },
];

export default function GalleryPage() {
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [photos, setPhotos] = useState<Photo[]>([]); // Start empty instead of mock data
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  
  // Custom Tab State for framer-motion sliders
  const [activeTabs, setActiveTabs] = useState<string[]>(["All"]);

  // Photo Dialog
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newPhotoTitle, setNewPhotoTitle] = useState("");
  const [newPhotoDescription, setNewPhotoDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [isDragging, setIsDragging] = useState(false);

  // Category Dialog
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Load Photos from Database
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/gallery`);
        const result = await response.json();
        if (result.success) {
          // Map MongoDB _id to React id
          const fetchedPhotos = result.data.map((p: any) => ({
            id: p._id,
            url: p.url,
            title: p.title,
            category: p.category,
            description: p.description
          }));
          setPhotos(fetchedPhotos);
          
          // Re-populate categories from dynamic data if they don't exist in INITIAL
          const dynamicCats = new Set<string>(INITIAL_CATEGORIES);
          fetchedPhotos.forEach((p: Photo) => dynamicCats.add(p.category));
          setCategories(Array.from(dynamicCats));
        }
      } catch (error) {
        console.error("Failed to load gallery:", error);
      } finally {
        setIsLoadingGallery(false);
      }
    };
    fetchGallery();
  }, []);



  // Displayed photos based on active tabs
  const displayedPhotos = useMemo(() => {
    if (activeTabs.includes("All")) {
      return photos;
    }
    return photos.filter(photo => activeTabs.includes(photo.category));
  }, [photos, activeTabs]);

  // Group photos
  const photosByCategory = useMemo(() => {
    const grouped: Record<string, Photo[]> = {};
    categories.forEach(cat => grouped[cat] = []);
    
    photos.forEach(photo => {
      if (grouped[photo.category]) {
        grouped[photo.category].push(photo);
      } else {
        grouped[photo.category] = [photo];
      }
    });
    return grouped;
  }, [photos, categories]);

  // Handle file selection logic
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Auto-fill title with file name if empty
    if (!newPhotoTitle) {
      const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
      setNewPhotoTitle(nameWithoutExt);
    }
  };

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Add Photo Submit Handler
  const handleAddPhoto = async () => {
    if (!selectedFile || !newPhotoTitle.trim()) return;
    
    setIsDragging(true); // Re-using this visually as a loading state for speed

    try {
      // 1. Prepare FormData
      const formData = new FormData();
      formData.append("image", selectedFile);
      
      // 2. Perform Upload POST to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Upload Failed");
      }

      // 3. Save to MongoDB Database
      const saveDbResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: result.url,
          title: newPhotoTitle,
          category: selectedCategory,
          description: newPhotoDescription || undefined,
        }),
      });
      const dbResult = await saveDbResponse.json();

      if (!dbResult.success) {
        throw new Error("Uploaded to cloud but failed to save to Database.");
      }

      // 4. Complete and append to local state
      setPhotos(prev => [
        {
          id: dbResult.data._id,
          url: dbResult.data.url, 
          title: dbResult.data.title,
          category: dbResult.data.category,
          description: dbResult.data.description,
        },
        ...prev
      ]);

      // Cleanup states
      setSelectedFile(null);
      setPreviewUrl(null);
      setNewPhotoTitle("");
      setNewPhotoDescription("");
      setIsAddPhotoOpen(false);
      
      // Auto-switch to the category where we appended
      if (!activeTabs.includes("All") && !activeTabs.includes(selectedCategory)) {
         setActiveTabs(prev => [...prev.filter(t => t !== "All"), selectedCategory]);
      }
    } catch (e: any) {
      alert("Failed to upload image: " + e.message);
    } finally {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Delete
  const handleDeletePhoto = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    
    // Optimistic UI update
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    
    // Delete from Database
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/gallery/${photoId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error("Failed to delete from DB", err);
      alert("Failed to delete image permanently.");
    }
  };
  
  // Add Category
  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    
    // Avoid exact duplicates
    if (!categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
        setCategories(prev => [...prev, trimmed]);
        setSelectedCategory(trimmed);
        setActiveTabs(prev => [...prev.filter(t => t !== "All"), trimmed]);
    }
    
    setNewCatName("");
    setIsAddCatOpen(false);
  };

  // --- Lightbox Handlers ---
  const activePhotosForLightbox = useMemo(() => {
    if (lightboxIndex === null) return [];
    return displayedPhotos;
  }, [lightboxIndex, displayedPhotos]);

  const activeLightboxLocalIndex = useMemo(() => {
    if (lightboxIndex === null) return -1;
    const activePhoto = photos[lightboxIndex];
    return activePhotosForLightbox.findIndex(p => p.id === activePhoto.id);
  }, [lightboxIndex, activePhotosForLightbox, photos]);

  const openLightbox = (photoId: string) => {
    const idx = photos.findIndex(p => p.id === photoId);
    if (idx !== -1) setLightboxIndex(idx);
  };
  
  const closeLightbox = () => setLightboxIndex(null);

  const prevPhoto = useCallback(() => {
    if (lightboxIndex === null) return;
    const newLocalIndex = (activeLightboxLocalIndex - 1 + activePhotosForLightbox.length) % activePhotosForLightbox.length;
    const nextPhotoRawIndex = photos.findIndex(p => p.id === activePhotosForLightbox[newLocalIndex].id);
    setLightboxIndex(nextPhotoRawIndex);
  }, [lightboxIndex, activeLightboxLocalIndex, activePhotosForLightbox, photos]);

  const nextPhoto = useCallback(() => {
    if (lightboxIndex === null) return;
    const newLocalIndex = (activeLightboxLocalIndex + 1) % activePhotosForLightbox.length;
    const nextPhotoRawIndex = photos.findIndex(p => p.id === activePhotosForLightbox[newLocalIndex].id);
    setLightboxIndex(nextPhotoRawIndex);
  }, [lightboxIndex, activeLightboxLocalIndex, activePhotosForLightbox, photos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, prevPhoto, nextPhoto]);

  // Reset description expansion when switching photos
  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [lightboxIndex]);

  return (
    <div className="min-h-screen bg-[#08090f] text-slate-200 p-6 md:p-10 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Magical Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] rounded-full bg-fuchsia-600/10 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        
        {/* Header Section */}
        <motion.div 
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, ease: "easeOut" }}
           className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="inline-flex items-center justify-center p-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.15)] backdrop-blur-md">
                <Sparkles className="text-indigo-400 w-5 h-5 mr-2" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Visual Suite</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 tracking-tight flex items-center gap-4 drop-shadow-sm">
              Gallery Control
            </h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base font-medium max-w-xl leading-relaxed">
              Curate and manage your magical collections. Create new categories, orchestrate events, and upload breathtaking visuals with premium Shadcn interfaces.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* ADD CATEGORY DIALOG */}
            <Dialog open={isAddCatOpen} onOpenChange={setIsAddCatOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-lg backdrop-blur-md transition-all h-10 px-4 group">
                  <FolderPlus className="mr-2 h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" /> 
                  <span className="font-semibold">New Category</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] bg-[#0c0d18]/95 backdrop-blur-2xl border border-white/10 text-white shadow-[0_0_60px_-15px_rgba(99,102,241,0.5)] overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-fuchsia-500" />
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <FolderPlus size={20} className="text-emerald-400" />
                    </div>
                    Create Category
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="space-y-3">
                    <Label htmlFor="catName" className="text-slate-300 font-medium">Category Name</Label>
                    <Input
                      id="catName"
                      placeholder="e.g. CSR Activities 2026"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="bg-[#0B0C15] border-white/10 focus-visible:ring-emerald-500 text-white h-12 shadow-inner"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddCatOpen(false)} className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white font-medium">
                    Cancel
                  </Button>
                  <Button onClick={handleAddCategory} disabled={!newCatName.trim()} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all">
                    Create Category
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ADD PHOTO DRAG & DROP DIALOG */}
            <Dialog open={isAddPhotoOpen} onOpenChange={(open) => {
              setIsAddPhotoOpen(open);
              if (!open) {
                // reset on close
                setTimeout(() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setNewPhotoTitle("");
                  setNewPhotoDescription("");
                }, 200);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(99,102,241,0.6)] transition-all h-10 px-5 border-0 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-150%] group-hover:animate-[shine-slide_1.5s_ease-in-out_infinite]" />
                  <UploadCloud className="mr-2 h-4 w-4 relative z-10" strokeWidth={3} /> 
                  <span className="font-bold relative z-10">Upload Media</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-[#0c0d18]/95 backdrop-blur-3xl border border-white/10 text-white shadow-[0_0_80px_-15px_rgba(139,92,246,0.3)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                     <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <ImageIcon size={20} className="text-indigo-400" />
                     </div>
                     Upload to Gallery
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-5 py-2">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-slate-300 font-medium">Destination Category</Label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="flex h-11 w-full rounded-lg border border-white/10 bg-[#0B0C15] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-inner"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div className="mt-2">
                    <Label className="text-slate-300 font-medium mb-2 block">Media File</Label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      hidden 
                      ref={fileInputRef} 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          processFile(e.target.files[0]);
                        }
                      }}
                    />

                    <AnimatePresence mode="wait">
                      {!previewUrl ? (
                        <motion.div
                          key="dropzone"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={cn(
                            "w-full h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group overflow-hidden relative",
                            isDragging 
                              ? "border-indigo-500 bg-indigo-500/10 scale-[1.02] shadow-[0_0_30px_rgba(99,102,241,0.2)]" 
                              : "border-white/20 bg-black/20 hover:border-indigo-400 hover:bg-white/5"
                          )}
                        >
                          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
                          
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform duration-300",
                            isDragging ? "bg-indigo-500/20 scale-110" : "bg-white/10 group-hover:scale-110 group-hover:bg-indigo-500/20"
                          )}>
                            <UploadCloud className={cn("w-6 h-6 transition-colors", isDragging ? "text-indigo-400" : "text-slate-400 group-hover:text-indigo-400")} />
                          </div>
                          
                          <p className="font-bold text-white text-base">
                            {isDragging ? "Drop magical image here!" : "Click or drag to upload"}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 font-medium">SVG, PNG, JPG, or GIF (max. 800x400px)</p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="w-full relative rounded-2xl border border-indigo-500/30 overflow-hidden shadow-lg bg-black/40 group h-44"
                        >
                          <img 
                            src={previewUrl} 
                            alt="Upload Preview" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="font-bold shadow-xl"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewUrl(null);
                                setSelectedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Remove Image
                            </Button>
                          </div>
                          <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs uppercase font-bold text-emerald-400 border border-emerald-500/20 tracking-wider flex items-center gap-1.5 shadow-xl">
                            <FileImage size={12} /> Ready
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Media Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-slate-300 font-medium">Media Title</Label>
                    <Input
                      id="title"
                      placeholder="Give it a catchy name..."
                      value={newPhotoTitle}
                      onChange={(e) => setNewPhotoTitle(e.target.value)}
                      className="bg-[#0B0C15] border-white/10 focus-visible:ring-indigo-500 text-white h-11"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <Label htmlFor="description" className="text-slate-300 font-medium">Description (max 500 characters)</Label>
                    <textarea
                      id="description"
                      placeholder="Add a brief description for this media..."
                      value={newPhotoDescription}
                      maxLength={500}
                      onChange={(e) => setNewPhotoDescription(e.target.value)}
                      className="mt-1 flex min-h-[100px] w-full rounded-lg border border-white/10 bg-[#0B0C15] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-inner resize-y"
                    />
                    <p className="mt-1 text-[11px] text-slate-500 text-right">
                      {newPhotoDescription.length}/500
                    </p>
                  </div>

                </div>
                <DialogFooter className="mt-2 border-t border-white/10 pt-4">
                  <Button variant="outline" onClick={() => setIsAddPhotoOpen(false)} className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white font-medium">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddPhoto} 
                    disabled={!previewUrl || isDragging} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] px-6 min-w-[150px] transition-all"
                  >
                    {isDragging ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                      </span>
                    ) : (
                      "Confirm Upload"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Gallery Interactive Area */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl relative"
        >
          {/* Framer Motion Custom Tabs */}
          <div className="w-full">
            
            {/* Category Filter Dropdown */}
            <div className="flex items-center justify-between pb-4 mb-6 md:mb-8 border-b border-white/5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white transition-all font-semibold shadow-sm h-10">
                    {activeTabs.includes("All") 
                      ? "All Categories" 
                      : activeTabs.length === 1 
                        ? activeTabs[0] 
                        : `${activeTabs.length} Categories Selected`}
                    <ChevronDown className="ml-2 h-4 w-4 text-indigo-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 bg-[#0c0d18]/95 backdrop-blur-xl border-white/10 text-white shadow-2xl">
                  <DropdownMenuLabel className="text-slate-400 text-xs uppercase tracking-wider font-bold">Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  
                  {["All", ...categories].map((cat) => {
                    const isActive = activeTabs.includes(cat);
                    const count = cat === "All" ? photos.length : (photosByCategory[cat]?.length || 0);
                    
                    return (
                      <DropdownMenuCheckboxItem
                        key={cat}
                        checked={isActive}
                        onCheckedChange={() => {
                          if (cat === "All") {
                            setActiveTabs(["All"]);
                          } else {
                            let newTabs = activeTabs.filter(t => t !== "All");
                            if (newTabs.includes(cat)) {
                              newTabs = newTabs.filter(t => t !== cat);
                            } else {
                              newTabs.push(cat);
                            }
                            if (newTabs.length === 0) newTabs = ["All"];
                            setActiveTabs(newTabs);
                          }
                        }}
                        className={cn(
                          "focus:bg-white/10 focus:text-white cursor-pointer py-2",
                          isActive && "text-indigo-300 focus:text-indigo-200"
                        )}
                      >
                        <span className="flex-1 font-medium">{cat}</span>
                        <span className={cn(
                          "ml-2 text-[10px] px-2 py-0.5 rounded-full border",
                          isActive ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" : "bg-white/5 text-slate-400 border-white/5"
                        )}>
                          {count}
                        </span>
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="text-sm font-medium text-slate-400 bg-black/20 px-4 py-2 rounded-full border border-white/5 shadow-inner">
                Showing <strong className="text-indigo-300 mx-1">{displayedPhotos.length}</strong> items
              </div>
            </div>

            {/* Tab Contents */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTabs.join("-")}
                initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.3 }}
              >
                  {/* Selected Content */}
                  <div className="outline-none focus:outline-none w-full relative">
                    
                    {displayedPhotos.length === 0 ? (
                      <div className="py-32 text-center flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-black/20 backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
                        
                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative z-10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                           <ImageIcon className="text-slate-400 h-10 w-10 drop-shadow-sm group-hover:text-indigo-400 transition-colors" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Blank Canvas</h3>
                        <p className="text-slate-400 text-sm max-w-sm relative z-10 leading-relaxed">
                          Your selected gallery view is empty. Upload premium content to bring it to life!
                        </p>
                        
                        <Button 
                          onClick={() => {
                            setSelectedCategory(activeTabs.includes("All") ? categories[0] : activeTabs[0]);
                            setIsAddPhotoOpen(true);
                          }}
                          className="mt-8 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 rounded-full px-6 transition-all relative z-10"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Seed Gallery
                        </Button>
                      </div>
                    ) : (
                      <div className="px-0 md:px-12 py-4">
                        <Carousel
                          opts={{ align: "start", loop: true, dragFree: true }}
                          className="w-full"
                        >
                          <CarouselContent className="-ml-6 py-4">
                            {displayedPhotos.map((photo) => (
                              <CarouselItem key={photo.id} className="pl-6 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                  <div 
                                    className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 aspect-[4/5] md:aspect-[4/3] shadow-2xl transition-all duration-500 cursor-pointer pointer-events-auto hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] hover:border-indigo-500/30"
                                    onClick={() => openLightbox(photo.id)}
                                  >
                                    
                                    {/* Glass reflection overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20" />
                                    
                                    {/* Photo */}
                                    <img
                                      src={photo.url}
                                      alt={photo.title}
                                      className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.15]"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1e1b4b/white?text=Broken+Image';
                                      }}
                                    />
                                    
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C15]/90 via-[#0B0C15]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 md:p-6 z-30">
                                      <div className="transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                        <h4 className="text-white font-bold text-lg md:text-xl truncate flex items-center justify-between drop-shadow-md">
                                          {photo.title}
                                          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                                            <Maximize2 size={14} className="text-white" />
                                          </div>
                                        </h4>
                                        
                                        <div className="flex items-center justify-between mt-4">
                                          <button 
                                            onClick={(e) => handleDeletePhoto(e, photo.id)}
                                            className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20"
                                            title="Permanently Delete Media"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                          
                                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/20">
                                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                             <span className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold font-mono">
                                               Access
                                             </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                  </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          
                          {/* Carousel Navigation (Hidden if 4 or less items) */}
                          {displayedPhotos.length > 4 && (
                            <>
                              <CarouselPrevious className="left-2 md:left-[-3rem] top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-xl border-white/20 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 text-white transition-colors shadow-2xl h-12 w-12" />
                              <CarouselNext className="right-2 md:right-[-3rem] top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-xl border-white/20 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 text-white transition-colors shadow-2xl h-12 w-12" />
                            </>
                          )}
                        </Carousel>
                      </div>
                    )}
                  </div>
              </motion.div>
            </AnimatePresence>

          </div>
        </motion.div>
      </div>

      {/* MAGICAL LIGHTBOX OVERLAY */}
      <AnimatePresence>
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0C15]/98 backdrop-blur-3xl p-4 md:p-8 overflow-hidden"
          >
            {/* Ambient Image Glow effect behind the image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-500/10 blur-[200px] pointer-events-none rounded-full" />
            
            {/* Top Toolbar */}
            <div className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/60 to-transparent">
               <div className="text-white flex items-center gap-4">
                  <span className="inline-flex items-center px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs font-bold font-mono rounded-xl uppercase tracking-widest shadow-lg">
                      <Sparkles size={12} className="mr-2 text-indigo-400" />
                      {photos[lightboxIndex].category}
                  </span>
                  <div className="h-6 w-px bg-white/20 hidden md:block" />
                  <span className="text-slate-400 text-sm font-medium hidden md:flex items-center gap-2">
                     Media View <strong className="text-white">{activeLightboxLocalIndex + 1}</strong> of <strong className="text-white">{activePhotosForLightbox.length}</strong>
                  </span>
               </div>
               
               <button
                  onClick={closeLightbox}
                  className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-rose-500/80 rounded-full text-white transition-all hover:rotate-90 hover:scale-110 shadow-xl border border-white/10"
                  title="Close (Esc)"
               >
                  <X className="w-5 h-5" />
               </button>
            </div>

            {/* Navigation Arrows */}
            {activePhotosForLightbox.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }} 
                  className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white/5 hover:bg-white/20 hover:border-white/20 border border-transparent backdrop-blur-sm rounded-full text-white transition-all transform hover:-translate-x-2 z-50"
                >
                  <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }} 
                  className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white/5 hover:bg-white/20 hover:border-white/20 border border-transparent backdrop-blur-sm rounded-full text-white transition-all transform hover:translate-x-2 z-50"
                >
                  <ChevronRight className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
                </button>
              </>
            )}

            {/* Main Image View */}
            <AnimatePresence mode="wait">
              <motion.div
                key={photos[lightboxIndex].id}
                initial={{ opacity: 0, scale: 0.9, y: 10, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)", transition: { duration: 0.2 } }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="w-full max-w-6xl max-h-[85vh] flex flex-col items-center justify-center select-none cursor-default"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = offset.x;
                  if (swipe < -60) nextPhoto();
                  else if (swipe > 60) prevPhoto();
                }}
              >
                <div className="w-full max-w-6xl bg-black/40 backdrop-blur-xl border border-white/10 p-4 md:p-8 rounded-[2.5rem] shadow-2xl overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-8 items-center md:items-stretch">
                    {/* Left: Image Panel */}
                    <div className="w-full md:w-[60%] flex items-center justify-center">
                      <div className="relative group/lightimg w-full h-full flex items-center justify-center">
                        <img
                          src={photos[lightboxIndex].url}
                          alt={photos[lightboxIndex].title}
                          className="max-w-full max-h-[50vh] md:max-h-[65vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/lightimg:opacity-100 transition-opacity duration-700 pointer-events-none" />
                      </div>
                    </div>

                    {/* Right: Info Panel */}
                    <div className="w-full md:w-[40%] flex flex-col justify-center text-left space-y-4">
                      <h3 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight leading-tight">
                        {photos[lightboxIndex].title}
                      </h3>
                      
                      {photos[lightboxIndex].description && (
                        <div className="space-y-3">
                          <div className={cn(
                            "text-slate-300 leading-relaxed text-sm md:text-base pr-2",
                            isDescriptionExpanded ? "max-h-[40vh] overflow-y-auto" : "max-h-24 overflow-hidden text-ellipsis"
                          )}>
                             {isDescriptionExpanded 
                               ? photos[lightboxIndex].description 
                               : truncateChars(photos[lightboxIndex].description, 100)}
                          </div>
                          
                          {photos[lightboxIndex].description.length > 100 && (
                            <button 
                              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                              className="text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center gap-1 transition-colors uppercase tracking-widest"
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
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
