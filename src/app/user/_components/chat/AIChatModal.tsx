'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, Trash2, Loader2, Sparkles, MessageSquare, 
  TrendingUp, PieChart, BarChart, Bot, User, ArrowRight
} from 'lucide-react';
import { chatApi, ChatMessage as ChatMessageType } from '@/lib/api/chat.api';
import ChatMessage from './ChatMessage';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export default function AIChatModal({ isOpen, onClose, theme = 'dark' }: Props) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Action Center State
  const [activeMode, setActiveMode] = useState<'chat' | 'stock' | 'portfolio'>('chat');
  const [stockSymbol, setStockSymbol] = useState('');
  const [portfolioBudget, setPortfolioBudget] = useState('');
  const [portfolioRisk, setPortfolioRisk] = useState<'low' | 'medium' | 'high'>('medium');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const isDark = theme === 'dark';

  // --- THEME ENGINE ---
  const styles = {
    // Containers
    backdrop: isDark ? 'bg-black/60' : 'bg-slate-900/20',
    modalBg: isDark ? 'bg-[#050505]' : 'bg-white',
    modalBorder: isDark ? 'border-white/[0.08]' : 'border-slate-200',
    
    // Header
    headerBg: isDark ? 'bg-[#0A0A0A]/80' : 'bg-white/80',
    headerBorder: isDark ? 'border-white/[0.06]' : 'border-slate-100',
    headerText: isDark ? 'text-white' : 'text-slate-900',
    headerSubText: isDark ? 'text-slate-400' : 'text-slate-500',
    
    // Chat Area
    chatBg: isDark ? 'bg-gradient-to-b from-[#050505] to-[#080808]' : 'bg-slate-50/50',
    noiseOpacity: isDark ? 'opacity-[0.02]' : 'opacity-[0.4]',
    
    // Message Bubbles
    userBubble: isDark ? 'bg-white text-slate-900' : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20',
    botBubble: isDark ? 'bg-white/[0.04] text-slate-200 border-white/[0.05]' : 'bg-white text-slate-800 border-slate-100 shadow-sm',
    
    // Input Area
    inputSectionBg: isDark ? 'bg-[#0A0A0A]' : 'bg-white',
    inputBg: isDark ? 'bg-white/[0.03]' : 'bg-slate-100',
    inputBorder: isDark ? 'border-white/[0.08]' : 'border-slate-200',
    inputText: isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400',
    inputFocus: isDark ? 'focus-within:bg-white/[0.05]' : 'focus-within:bg-white',
    
    // Buttons & Icons
    iconButton: isDark ? 'hover:bg-white/[0.05] text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900',
    sendButton: isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white',
    actionCardBg: isDark ? 'bg-white/[0.03] border-white/[0.05]' : 'bg-slate-50 border-slate-200',
  };

  // --- LIFECYCLE ---
  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeMode, loading]);

  // --- API ---
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await chatApi.getChatHistory(50);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleSend = async (overrideText?: string) => {
    const text = overrideText || input.trim();
    if (!text || loading) return;

    if (!overrideText) setInput('');
    setActiveMode('chat'); 
    setLoading(true);

    addMessage({ _id: Date.now().toString(), role: 'user', content: text, userId: 'me', timestamp: new Date().toISOString() });

    try {
      const response = await chatApi.sendMessage(text);
      addMessage({
        _id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        userId: 'bot',
        timestamp: response.data.timestamp
      });
    } catch (error: any) {
      addMessage({
        _id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.response?.data?.message || "Connection error. Please try again.",
        userId: 'bot',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStockAnalysis = async () => {
    if (!stockSymbol.trim()) return;
    setLoading(true);
    setActiveMode('chat');
    setStockSymbol('');
    addMessage({ _id: Date.now().toString(), role: 'user', content: `Analyze ${stockSymbol.toUpperCase()}`, userId: 'me', timestamp: new Date().toISOString() });

    try {
      const response = await chatApi.analyzeStock(stockSymbol.toUpperCase());
      addMessage({
        _id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.analysis,
        userId: 'bot',
        timestamp: response.data.timestamp,
        metadata: { queryType: 'stock_analysis', stockSymbol: stockSymbol.toUpperCase() }
      });
    } catch (error: any) {
        addMessage({
          _id: Date.now().toString(),
          role: 'assistant',
          content: error.response?.data?.message || "Analysis failed.",
          userId: 'bot',
          timestamp: new Date().toISOString()
        });
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolio = async () => {
    const budget = parseFloat(portfolioBudget);
    if (!budget) return;
    setLoading(true);
    setActiveMode('chat');
    setPortfolioBudget('');
    addMessage({ _id: Date.now().toString(), role: 'user', content: `Build a ${portfolioRisk} risk portfolio for ₹${budget.toLocaleString()}`, userId: 'me', timestamp: new Date().toISOString() });

    try {
      const response = await chatApi.recommendPortfolio(budget, portfolioRisk);
      addMessage({
        _id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.recommendation,
        userId: 'bot',
        timestamp: response.data.timestamp,
        metadata: { queryType: 'portfolio_recommendation' }
      });
    } catch (error: any) {
        addMessage({
          _id: Date.now().toString(),
          role: 'assistant',
          content: error.response?.data?.message || "Portfolio generation failed.",
          userId: 'bot',
          timestamp: new Date().toISOString()
        });
    } finally {
        setLoading(false);
    }
  };

  const handleClear = async () => {
    if(!confirm("Clear history?")) return;
    setMessages([]);
    await chatApi.clearChatHistory();
  };

  const addMessage = (msg: ChatMessageType) => setMessages(prev => [...prev, msg]);

  // --- RENDER ---
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className={`fixed inset-0 backdrop-blur-sm z-[100] ${styles.backdrop}`}
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
          className={`w-full max-w-5xl h-[85vh] ${styles.modalBg} rounded-[24px] shadow-2xl border ${styles.modalBorder} flex flex-col pointer-events-auto overflow-hidden relative ring-1 ring-black/5`}
        >
          
          {/* HEADER */}
          <div className={`h-16 border-b ${styles.headerBorder} ${styles.headerBg} backdrop-blur-xl flex items-center justify-between px-6 relative z-20`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${styles.headerText} tracking-wide`}>PRAEDICO AI</h3>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${styles.headerSubText}`}>Online</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button onClick={handleClear} className={`p-2 rounded-lg transition-colors ${styles.iconButton}`} title="Clear">
                    <Trash2 className="w-4 h-4" />
                </button>
                <div className={`w-[1px] h-4 mx-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${styles.iconButton}`}>
                    <X className="w-5 h-5" />
                </button>
            </div>
          </div>

          {/* CHAT AREA */}
          <div className={`flex-1 overflow-y-auto custom-scrollbar-dark p-6 space-y-6 relative ${styles.chatBg}`}>
            {/* Texture */}
            <div className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay ${styles.noiseOpacity}`} />

            {loadingHistory ? (
               <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-xs uppercase tracking-widest font-medium">Loading Memory...</span>
               </div>
            ) : messages.length === 0 ? (
               <EmptyState onAction={handleSend} isDark={isDark} />
            ) : (
                <>
                    {messages.map((msg, idx) => (
                        <MessageItem key={msg._id || idx} message={msg} styles={styles} isDark={isDark} />
                    ))}
                    
                    {loading && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                                <Bot className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div className="flex items-center gap-1 h-10 px-3">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </>
            )}
          </div>

          {/* INPUT AREA */}
          <div className={`${styles.inputSectionBg} border-t ${styles.headerBorder} p-5 relative z-30`}>
            
            {/* Action Center */}
            <AnimatePresence mode='wait'>
                {activeMode !== 'chat' && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }} 
                        animate={{ height: 'auto', opacity: 1, marginBottom: 16 }} 
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }} 
                        className="overflow-hidden"
                    >
                        <div className={`${styles.actionCardBg} border ${styles.headerBorder} rounded-xl p-4 relative`}>
                            <button onClick={() => setActiveMode('chat')} className={`absolute top-2 right-2 p-1 rounded-lg ${styles.iconButton}`}><X className="w-4 h-4" /></button>

                            {activeMode === 'stock' && (
                                <div className="flex gap-3 items-end">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Analyze Asset</label>
                                        <input 
                                            autoFocus
                                            value={stockSymbol}
                                            onChange={(e) => setStockSymbol(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleStockAnalysis()}
                                            placeholder="Enter Symbol (e.g. RELIANCE)"
                                            className={`w-full ${isDark ? 'bg-black/40' : 'bg-white'} border ${styles.headerBorder} rounded-lg px-3 py-2 text-sm ${styles.headerText} focus:outline-none focus:border-indigo-500 transition-colors`}
                                        />
                                    </div>
                                    <button onClick={handleStockAnalysis} disabled={!stockSymbol} className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20">Analyze</button>
                                </div>
                            )}

                            {activeMode === 'portfolio' && (
                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase font-bold text-purple-500 tracking-wider">Portfolio Builder</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input 
                                            type="number" 
                                            placeholder="Budget (₹)"
                                            value={portfolioBudget}
                                            onChange={(e) => setPortfolioBudget(e.target.value)}
                                            className={`col-span-1 ${isDark ? 'bg-black/40' : 'bg-white'} border ${styles.headerBorder} rounded-lg px-3 py-2 text-sm ${styles.headerText} focus:outline-none focus:border-purple-500`}
                                        />
                                        <div className="col-span-2 flex gap-2">
                                            {(['low', 'medium', 'high'] as const).map(risk => (
                                                <button 
                                                    key={risk}
                                                    onClick={() => setPortfolioRisk(risk)}
                                                    className={`flex-1 text-xs font-bold uppercase rounded-lg border transition-all ${portfolioRisk === risk ? 'bg-purple-600 border-purple-500 text-white' : `${isDark ? 'bg-transparent border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'} hover:border-purple-500/50`}`}
                                                >
                                                    {risk}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={handlePortfolio} disabled={!portfolioBudget} className="w-full h-10 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-purple-500/20">Generate Strategy</button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Bar */}
            <div className="flex items-end gap-3">
                {activeMode === 'chat' && (
                    <div className="flex gap-2 pb-1">
                        <ModeButton icon={TrendingUp} onClick={() => setActiveMode('stock')} color="text-indigo-500" isDark={isDark} />
                        <ModeButton icon={PieChart} onClick={() => setActiveMode('portfolio')} color="text-purple-500" isDark={isDark} />
                    </div>
                )}

                <div className={`flex-1 relative ${styles.inputBg} border ${styles.inputBorder} rounded-2xl ${styles.inputFocus} focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all duration-300`}>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                        placeholder="Ask Praedico..."
                        className={`w-full bg-transparent ${styles.inputText} text-sm px-4 py-3.5 pr-12 focus:outline-none resize-none custom-scrollbar-dark min-h-[50px] max-h-32`}
                        rows={1}
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className={`absolute right-2 bottom-2 p-2 ${styles.sendButton} rounded-xl transition-all disabled:opacity-0 disabled:scale-75 shadow-lg shadow-indigo-500/20`}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// --- SUB-COMPONENTS ---

const MessageItem = ({ message, styles, isDark }: { message: ChatMessageType, styles: any, isDark: boolean }) => {
    const isUser = message.role === 'user';
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isUser ? (isDark ? 'bg-white text-black border-white' : 'bg-indigo-600 text-white border-indigo-600') : (isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white text-indigo-600 border-slate-200')}`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[85%] space-y-1 ${isUser ? 'items-end flex flex-col' : ''}`}>
                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed border ${isUser ? `${styles.userBubble} border-transparent rounded-tr-sm` : `${styles.botBubble} rounded-tl-sm`}`}>
                    <ChatMessage message={message} theme={isDark ? "dark" : "light"}/>
                </div>
                <span className={`text-[10px] px-1 opacity-60 ${styles.headerSubText}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>
        </motion.div>
    )
}

const EmptyState = ({ onAction, isDark }: { onAction: (text: string) => void, isDark: boolean }) => (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border mb-6 rotate-3 ${isDark ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-white/5' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
            <MessageSquare className="w-8 h-8 text-indigo-500" />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Welcome to Praedico</h2>
        <p className={`max-w-md text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Your personal financial analyst. Ask me to analyze stocks, plan investments, or explain complex market trends.
        </p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
            <QuickAction onClick={() => onAction('Market trend today?')} icon={TrendingUp} label="Market Trend" isDark={isDark} />
            <QuickAction onClick={() => onAction('Top 5 gainers')} icon={BarChart} label="Top Gainers" isDark={isDark} />
        </div>
    </div>
)

const QuickAction = ({ onClick, icon: Icon, label, isDark }: any) => (
    <button onClick={onClick} className={`flex items-center gap-3 p-4 border rounded-xl transition-all group text-left ${isDark ? 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.05] hover:border-white/[0.1]' : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-200 shadow-sm'}`}>
        <div className={`p-2 rounded-lg ${isDark ? 'bg-white/5 text-slate-400' : 'bg-indigo-50 text-indigo-500'} group-hover:text-indigo-500 transition-colors`}>
            <Icon className="w-4 h-4" />
        </div>
        <span className={`text-sm font-medium ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>{label}</span>
    </button>
)

const ModeButton = ({ icon: Icon, onClick, color, isDark }: any) => (
    <button onClick={onClick} className={`h-[52px] w-[52px] flex items-center justify-center rounded-xl border transition-all group ${isDark ? 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] hover:border-white/[0.2]' : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-500'}`}>
        <Icon className={`w-5 h-5 ${color} opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all`} />
    </button>
)
