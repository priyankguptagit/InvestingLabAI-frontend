"use client";

import { NewsArticle } from "@/lib/types/news.types";
import { ExternalLink, Calendar, TrendingUp, Zap, Globe, Newspaper, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

// Helper for source colors
const getSourceStyles = (source: string, isDark: boolean) => {
  if (isDark) {
    switch (source) {
      case 'MONEYCONTROL': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'ECONOMIC_TIMES': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      case 'NSE': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  } else {
    switch (source) {
      case 'MONEYCONTROL': return 'text-green-700 bg-green-50 border-green-200';
      case 'ECONOMIC_TIMES': return 'text-pink-700 bg-pink-50 border-pink-200';
      case 'NSE': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  }
};

// Category Icons
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'MARKET': return TrendingUp;
    case 'STOCKS': return Zap;
    case 'ECONOMY': return Globe;
    default: return Newspaper;
  }
};

interface CardProps {
    article: NewsArticle;
    index: number;
    isDark: boolean;
}

export default function NewsDashboardCard({ article, index, isDark }: CardProps) {
  const CategoryIcon = getCategoryIcon(article.category);
  const sourceClass = getSourceStyles(article.source, isDark);

  // Time format
  const timeAgo = (dateStr: string) => {
    const diff = (new Date().getTime() - new Date(dateStr).getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <motion.div
      // --- SCROLL ANIMATION ---
      initial={{ opacity: 0, y: 50, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      
      className={`
        group relative flex flex-col rounded-[24px] border transition-all duration-300 overflow-hidden
        ${isDark 
            ? 'bg-slate-900/60 border-white/10 hover:border-indigo-500/30 hover:bg-slate-900/80' 
            : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100'}
      `}
    >
      <div className="p-8 flex flex-col h-full">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${sourceClass}`}>
            <Globe className="w-3 h-3" />
            {article.source.replace('_', ' ')}
          </div>
          <span className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <Calendar className="w-3.5 h-3.5" />
            {timeAgo(article.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className={`text-2xl font-bold mb-4 leading-snug group-hover:text-indigo-500 transition-colors ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          {article.title}
        </h3>

        {/* Description */}
        <p className={`text-base leading-relaxed mb-8 flex-grow ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {article.description}
        </p>

        {/* Footer */}
        <div className={`flex items-center justify-between pt-6 border-t mt-auto ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex gap-2">
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${isDark ? 'bg-white/5 text-slate-400 border-white/5' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
              <CategoryIcon className="w-3.5 h-3.5" />
              {article.category}
            </span>
          </div>

          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`
                flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all
                ${isDark 
                    ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white' 
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'}
            `}
          >
            Read Story <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}