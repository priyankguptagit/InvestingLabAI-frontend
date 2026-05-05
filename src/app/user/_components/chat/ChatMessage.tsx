import { Bot, User, Copy, Check, Terminal } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/lib/api/chat.api';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import remarkGfm from 'remark-gfm';

interface Props {
  message: ChatMessageType;
  theme?: 'light' | 'dark';
}

export default function ChatMessage({ message, theme = 'dark' }: Props) {
  const isUser = message.role === 'user';
  const isDark = theme === 'dark';

  // --- STYLES CONFIGURATION ---
  const styles = {
    // Avatar
    avatarUser: isDark ? 'bg-white text-black' : 'bg-slate-900 text-white',
    avatarBot: isDark 
      ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400' 
      : 'bg-indigo-100 text-indigo-600 border border-indigo-200',
    
    // Bubble Container
    bubbleUser: isDark 
      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/20 border border-white/10' 
      : 'bg-slate-900 text-white shadow-md',
    bubbleBot: isDark 
      ? 'bg-white/[0.03] text-slate-200 border border-white/[0.06] backdrop-blur-sm' 
      : 'bg-white text-slate-700 border border-slate-100 shadow-sm',
    
    // Text Colors
    heading: isDark ? 'text-white' : 'text-slate-900',
    bold: isDark ? 'text-indigo-200' : 'text-indigo-700',
    codeBg: isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200',
    tableBorder: isDark ? 'border-white/10' : 'border-slate-200',
    tableHeader: isDark ? 'bg-white/5 text-white' : 'bg-slate-50 text-slate-900',
    link: isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700',
  };

  return (
    <div className={`group flex gap-4 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      
      {/* 1. AVATAR */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${isUser ? styles.avatarUser : styles.avatarBot}`}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* 2. MESSAGE CONTENT */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        <div className={`px-5 py-4 rounded-2xl text-sm leading-7 transition-all ${isUser ? `rounded-tr-sm ${styles.bubbleUser}` : `rounded-tl-sm ${styles.bubbleBot}`}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap break-words font-medium tracking-wide">
              {message.content}
            </p>
          ) : (
            // --- CUSTOM MARKDOWN RENDERER ---
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Paragraphs
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  
                  // Headings
                  h1: ({ children }) => <h1 className={`text-lg font-bold mt-4 mb-2 ${styles.heading}`}>{children}</h1>,
                  h2: ({ children }) => <h2 className={`text-base font-bold mt-4 mb-2 ${styles.heading}`}>{children}</h2>,
                  h3: ({ children }) => <h3 className={`text-sm font-bold mt-3 mb-1 uppercase tracking-wider ${styles.heading}`}>{children}</h3>,
                  
                  // Formatting
                  strong: ({ children }) => <span className={`font-bold ${styles.bold}`}>{children}</span>,
                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-2 ${styles.link}`}>{children}</a>,
                  
                  // Lists
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1 marker:text-indigo-500">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1 marker:text-indigo-500">{children}</ol>,
                  li: ({ children }) => <li className="pl-1">{children}</li>,
                  
                  // Code Blocks & Inline Code
                  code: ({ className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    return isInline ? (
                      <code className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-medium ${styles.codeBg} text-indigo-400`}>
                        {children}
                      </code>
                    ) : (
                      <div className={`relative my-4 rounded-xl overflow-hidden border ${styles.codeBg}`}>
                        <div className={`flex items-center justify-between px-3 py-1.5 border-b ${styles.tableBorder} bg-white/5`}>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                            <Terminal className="w-3 h-3" />
                            <span>{match?.[1] || 'code'}</span>
                          </div>
                        </div>
                        <div className="p-3 overflow-x-auto">
                          <code className="text-xs font-mono !bg-transparent text-slate-300 block" {...props}>
                            {children}
                          </code>
                        </div>
                      </div>
                    );
                  },

                  // Tables (Financial Data Style)
                  table: ({ children }) => (
                    <div className={`my-4 overflow-hidden rounded-xl border ${styles.tableBorder}`}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">{children}</table>
                      </div>
                    </div>
                  ),
                  thead: ({ children }) => <thead className={styles.tableHeader}>{children}</thead>,
                  tbody: ({ children }) => <tbody className={`divide-y ${styles.tableBorder}`}>{children}</tbody>,
                  tr: ({ children }) => <tr className={`group transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>{children}</tr>,
                  th: ({ children }) => <th className="px-4 py-3 font-semibold uppercase tracking-wider">{children}</th>,
                  td: ({ children }) => <td className={`px-4 py-2.5 ${styles.tableBorder} border-l first:border-l-0`}>{children}</td>,
                  blockquote: ({children}) => <blockquote className="border-l-2 border-indigo-500 pl-4 my-2 italic opacity-80">{children}</blockquote>
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        {/* 3. TIMESTAMP */}
        <span className={`text-[10px] font-medium mt-1.5 px-1 select-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {isUser ? 'You • ' : 'Praedico AI • '}
          {new Date(message.timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}