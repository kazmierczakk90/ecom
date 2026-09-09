import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, TrendingUp, Compass, AlertCircle, Search, ArrowRight, Zap, Target } from "lucide-react";

interface SuggestedCategory {
  name: string;
  potential: string;
  avgRoi: string;
  reason: string;
}

interface NicheSuggestion {
  keyword: string;
  expectedVolume: string;
  difficulty: string;
}

interface TrendData {
  trendScore: number;
  keyword: string;
  demandLevel: string;
  competitionLevel: string;
  marketAnalysis: string;
  suggestedCategories: SuggestedCategory[];
  nicheSuggestions: NicheSuggestion[];
}

interface SmartDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeKeyword?: string;
  onSearchKeyword: (keyword: string) => void;
}

export default function SmartDiscoveryModal({
  isOpen,
  onClose,
  activeKeyword,
  onSearchKeyword
}: SmartDiscoveryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTrendAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/smart-discovery", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ keyword: activeKeyword })
        });

        if (!response.ok) {
          throw new Error(`Błąd serwera (Status: ${response.status})`);
        }

        const data = await response.json();
        setTrendData(data);
      } catch (err: any) {
        console.error("Smart discovery fetch error:", err);
        setError(err.message || "Wystąpił problem podczas pobierania analizy trendów.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendAnalysis();
  }, [isOpen, activeKeyword]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 70) return "text-brand-blue bg-brand-blue/10 border-brand-blue/30";
    return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  };

  const getDifficultyColor = (diff: string) => {
    const d = diff.toLowerCase();
    if (d.includes("łatw") || d.includes("easy")) return "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
    if (d.includes("średn") || d.includes("medium")) return "text-amber-400 bg-amber-500/10 border border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border border-rose-500/20";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#07080b]/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-4xl max-h-[85vh] bg-[#11141c] border border-brand-dark/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans z-10"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark bg-[#151822]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-brand-blue/10 border border-brand-blue/30 rounded-lg flex items-center justify-center text-brand-blue">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5 uppercase">
                    Smart Discovery <span className="text-slate-400 font-mono text-[10px] lowercase px-1.5 py-0.5 bg-bg-dark rounded border border-brand-dark">powered by Gemini</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Inteligentny asystent nisz rynkowych i trendów e-commerce
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer border-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 border-2 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
                    <Sparkles className="w-5 h-5 text-brand-blue absolute animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-white">Gemini analizuje dane rynkowe...</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {activeKeyword 
                        ? `Badanie popytu i rentowności dla frazy "${activeKeyword}"` 
                        : "Kompilacja najbardziej dochodowych nisz e-commerce"
                      }
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex items-start gap-3.5 max-w-2xl mx-auto my-8">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-red-300">Wystąpił błąd analizy</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {error}
                    </p>
                    <button
                      onClick={() => {
                        // Retry trigger
                        onClose();
                        setTimeout(() => onClose(), 100);
                      }}
                      className="mt-3 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                    >
                      Spróbuj ponownie
                    </button>
                  </div>
                </div>
              ) : trendData ? (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Top Dashboard Meta */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    
                    {/* Left Analysis & Overview */}
                    <div className="md:col-span-8 bg-card-dark/40 border border-brand-dark rounded-xl p-5 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-brand-blue" />
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Podsumowanie Rynkowe: <strong className="text-white font-semibold">"{trendData.keyword}"</strong>
                          </h4>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-300">
                          {trendData.marketAnalysis}
                        </p>
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-brand-dark flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Popyt: <strong className="text-emerald-400 uppercase font-bold">{trendData.demandLevel}</strong></span>
                        </div>
                        <div className="w-[1px] h-3 bg-brand-dark" />
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Konkurencja: <strong className="text-amber-400 uppercase font-bold">{trendData.competitionLevel}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Right Circular Gauge */}
                    <div className="md:col-span-4 bg-card-dark/40 border border-brand-dark rounded-xl p-5 flex flex-col items-center justify-center text-center">
                      <div className="relative flex items-center justify-center">
                        {/* Circular Progress Path */}
                        <svg className="w-28 h-28 transform -rotate-90">
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            className="stroke-bg-dark fill-transparent"
                            strokeWidth="8"
                          />
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            className="stroke-brand-blue fill-transparent transition-all duration-1000"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 48}
                            strokeDashoffset={2 * Math.PI * 48 * (1 - trendData.trendScore / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-2xl font-extrabold text-white font-mono">{trendData.trendScore}</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-sans">Index</span>
                        </div>
                      </div>
                      
                      <div className="mt-3.5 text-center">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getScoreColor(trendData.trendScore)}`}>
                          Wskaźnik Trendu {trendData.trendScore >= 80 ? "Znakomity" : trendData.trendScore >= 65 ? "Dobry" : "Umiarkowany"}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Suggested Categories Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Rekomendowane Podkategorie Produktowe
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {trendData.suggestedCategories.map((cat, idx) => (
                        <div 
                          key={idx} 
                          className="bg-card-dark/30 border border-brand-dark/70 hover:border-brand-dark rounded-xl p-4 flex flex-col justify-between transition-all group"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h5 className="text-xs font-bold text-white group-hover:text-brand-blue transition-colors">
                                {cat.name}
                              </h5>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
                                ROI: {cat.avgRoi}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {cat.reason}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-brand-dark/40 flex items-center justify-between">
                            <span className="text-[9px] font-bold font-mono text-slate-500 uppercase">Rekomendacja</span>
                            <span className="text-[9px] font-bold text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded border border-brand-green/20">
                              {cat.potential}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Niche Specific Search Ideas */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Gorące Nisze i Słowa Kluczowe (Kliknij aby Przeszukać)
                      </h4>
                    </div>

                    <div className="bg-card-dark/30 border border-brand-dark/70 rounded-xl divide-y divide-brand-dark">
                      {trendData.nicheSuggestions.map((niche, idx) => (
                        <div 
                          key={idx}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-[#151922] transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue group-hover:scale-150 transition-transform" />
                              <span className="text-xs font-semibold text-white group-hover:text-brand-blue transition-colors">
                                {niche.keyword}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                              <span>Obroty: <strong>{niche.expectedVolume}</strong></span>
                              <span className="w-1 h-1 rounded-full bg-slate-600" />
                              <span className="flex items-center gap-1">
                                Trudność: 
                                <strong className={`px-1.5 rounded text-[9px] ${getDifficultyColor(niche.difficulty)}`}>
                                  {niche.difficulty}
                                </strong>
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onSearchKeyword(niche.keyword);
                              onClose();
                            }}
                            className="self-start sm:self-center px-3.5 py-1.5 bg-brand-blue hover:bg-brand-blue/90 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-blue/10 active:scale-95 border-0 hover:translate-x-0.5"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>Szukaj na żywo</span>
                            <ArrowRight className="w-3 h-3 text-white/70" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center text-slate-400 py-12">
                  Brak dostępnych analiz trendu.
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-brand-dark bg-[#151822] flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">
                Model: Gemini 2.5 Flash · Analiza oparta o trendy rynkowe i popyt w UE
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-lg transition-all cursor-pointer border-0"
              >
                Zamknij
              </button>
            </div>

          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}
