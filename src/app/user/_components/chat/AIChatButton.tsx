"use client";

import { useState, useEffect } from 'react';
import { MessageSquare, Sparkles, X, Loader2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatModal from './AIChatModal';
import PremiumFeatureModal from '../PremiumFeatureModal';
import axiosInstance from '@/lib/axios';

export default function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data } = await axiosInstance.get('/api/users/me');
      if (data.success && data.user) {
        const isPremium = data.user.currentPlan !== 'Free';
        const isTrial = data.user.isOnTrial;
        setHasAccess(isPremium || isTrial);
      }
    } catch (error) {
      console.error('Failed to check user plan:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (loading) return;
    if (hasAccess) {
      setIsOpen(true);
    } else {
      setShowPremiumModal(true);
    }
  };

  // --- LOADING SKELETON (Prevents layout shift) ---
  if (loading) {
    return (
      <div className="fixed bottom-8 right-8 z-40">
        <div className="w-16 h-16 rounded-full bg-slate-200/20 backdrop-blur-md animate-pulse border border-white/10 shadow-xl" />
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-8 right-8 z-40 flex items-center justify-end">

        {/* HOVER LABEL (Slides out) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: -16, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm shadow-2xl border border-slate-100 hidden md:block"
            >
              Ask AI Assistant
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN BUTTON */}
        <motion.button
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative group w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] outline-none"
        >
          {/* 1. Animated Glow Background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 animate-gradient-xy opacity-90 group-hover:opacity-100 transition-opacity" />

          {/* 2. Glass Shine Effect */}
          <div className="absolute inset-[1px] rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

          {/* 3. Inner Ring */}
          <div className="absolute inset-0 rounded-full border border-white/10" />

          {/* 4. Icon Layer */}
          <div className="relative z-10 text-white">
            {hasAccess ? (
              <div className="relative">
                <MessageSquare className="w-7 h-7" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                </motion.div>
              </div>
            ) : (
              <Lock className="w-6 h-6 text-white/90" />
            )}
          </div>

          {/* 5. Ripple Pulse (Subtle) */}
          <span className="absolute -inset-1 rounded-full border border-indigo-500/30 animate-[ping_3s_ease-in-out_infinite] opacity-50 pointer-events-none"></span>
        </motion.button>
      </div>

      {/* CHAT INTERFACE */}
      {/* Passing theme="light" as requested for dashboard context */}
      <AIChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} theme="light" />

      {/* PREMIUM UPGRADE MODAL */}
      <PremiumFeatureModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </>
  );
}
