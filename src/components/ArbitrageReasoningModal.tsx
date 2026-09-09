import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Brain, CheckCircle2, AlertTriangle, XCircle, TrendingUp, DollarSign, ArrowRight, Send, RefreshCw, HelpCircle, ShieldCheck, Zap, Info } from "lucide-react";
import { ProductListing, ArbitrageSettings } from "../types";

interface ReasoningStep {
  stepTitle: string;
  status: "passed" | "warning" | "failed";
  detail: string;
}

interface FinancialBreakdown {
  buyPriceEUR: number;
  buyPricePLN: number;
  sellPricePLN: number;
  netProfitPLN: number;
  roiPercent: number;
  vatArbitrageGainPLN: number;
  estimatedFeesPLN: number;
}

interface MarketInsights {
  recommendedSellingPricePLN: number;
  targetRoi: string;
  estimatedMonthlySales: number;
  competitionRating: string;
}

interface ReasoningData {
  arbitrageScore: number;
  verdict: string;
  verdictBadgeColor: "emerald" | "amber" | "rose";
  reasoningSteps: ReasoningStep[];
  financialBreakdown: FinancialBreakdown;
  marketInsights?: MarketInsights;
  actionableAdvice: string[];
  customAnswer?: string;
}

interface ArbitrageReasoningModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductListing | null;
  settings: ArbitrageSettings;
}

export default function ArbitrageReasoningModal({
  isOpen,
  onClose,
  product,
  settings
}: ArbitrageReasoningModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reasoningData, setReasoningData] = useState<ReasoningData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom question state
  const [customQuestion, setCustomQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<{ q: string; a: string }[]>([]);

  useEffect(() => {
    if (!isOpen || !product) {
      setReasoningData(null);
      setQaHistory([]);
      setCustomQuestion("");
      setError(null);
      return;
    }

    fetchReasoning();
  }, [isOpen, product]);

  const fetchReasoning = async (userQuestion?: string) => {
    if (!product) return;

    if (userQuestion) {
      setIsAsking(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch("/api/arbitrage/reasoning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          customQuestion: userQuestion,
          settings
        })
      });

      if (!response.ok) {
        throw new Error(`Błąd serwera (${response.status})`);
      }

      const data: ReasoningData = await response.json();
      setReasoningData(data);

      if (userQuestion && data.customAnswer) {
        setQaHistory(prev => [...prev, { q: userQuestion, a: data.customAnswer! }]);
        setCustomQuestion("");
      }
    } catch (err: any) {
      console.error("Arbitrage reasoning error:", err);
      setError(err.message || "Problem podczas pobierania rozumowania Gemini AI.");
    } finally {
      setIsLoading(false);
      setIsAsking(false);
    }
  };

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || isAsking) return;
    fetchReasoning(customQuestion.trim());
  };

  if (!isOpen || !product) return null;

  const getBadgeStyle = (color?: string) => {
    if (color === "emerald" || reasoningData?.arbitrageScore! >= 75) {
      return "bg-emerald-500/15 border-emerald-500/40 text-emerald-400";
    }
    if (color === "amber" || reasoningData?.arbitrageScore! >= 55) {
      return "bg-amber-500/15 border-amber-500/40 text-amber-400";
    }
    return "bg-rose-500/15 border-rose-500/40 text-rose-400";
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-sans">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#07080b]/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-[#11141c] border border-brand-dark/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark bg-[#151822]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400">
                  <Brain className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2 uppercase">
                    Rozumowanie Arbitrażu AI <span className="text-purple-300 font-mono text-[10px] lowercase px-2 py-0.5 bg-purple-500/10 rounded-full border border-purple-500/30">Gemini 3.6 Thinking</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-md sm:max-w-xl">
                    Produkt: <strong className="text-slate-200 font-semibold">{product.name}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchReasoning()}
                  title="Ponów analizę"
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer border-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-blue" : ""}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer border-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="w-14 h-14 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    <Sparkles className="w-6 h-6 text-purple-400 absolute animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                      Gemini analizuje opłacalność i ryzyka...
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Weryfikowanie arbitrażu podatkowego VAT DE vs PL, cen konkurencji i marży czystej
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Wystąpił błąd weryfikacji rozumowania Gemini</span>
                  </div>
                  <p>{error}</p>
                </div>
              ) : reasoningData ? (
                <>
                  {/* Top Score Banner */}
                  <div className="bg-bg-dark border border-brand-dark rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
                    <div className="space-y-1 z-10">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Werdykt Potencjału Arbitrażowego</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg border text-xs sm:text-sm font-extrabold font-mono uppercase tracking-wide ${getBadgeStyle(reasoningData.verdictBadgeColor)}`}>
                          {reasoningData.verdict}
                        </span>
                        <span className="text-slate-400 text-xs font-mono">
                          Ocena pewności: <strong className="text-white font-bold">{reasoningData.arbitrageScore}/100</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-brand-dark pt-3 sm:pt-0 sm:pl-5 font-mono text-xs z-10 w-full sm:w-auto justify-between sm:justify-start">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Kupno (Buy)</div>
                        <div className="text-sm font-bold text-emerald-400">
                          {reasoningData.financialBreakdown.buyPriceEUR} EUR
                          <span className="text-[10px] text-slate-400 block font-normal">
                            (~{reasoningData.financialBreakdown.buyPricePLN} PLN)
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Sprzedaż (Sell)</div>
                        <div className="text-sm font-bold text-white">
                          {reasoningData.financialBreakdown.sellPricePLN} PLN
                        </div>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-right">
                        <div className="text-[9px] text-emerald-400 uppercase font-bold">Zysk czysty</div>
                        <div className="text-sm font-extrabold text-emerald-300">
                          +{reasoningData.financialBreakdown.netProfitPLN} PLN
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chain of Thought / Reasoning Steps */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span>KROKI LOGICZNE RZETELNEGO ROZUMOWANIA (CHAIN-OF-THOUGHT)</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {reasoningData.reasoningSteps.map((step, idx) => (
                        <div key={idx} className="bg-[#151822] border border-brand-dark hover:border-slate-700 rounded-xl p-4 transition-all space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <div className="flex items-center gap-2 text-white font-sans">
                              {getStepIcon(step.status)}
                              <span>{step.stepTitle}</span>
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                              step.status === "passed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              step.status === "warning" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}>
                              {step.status === "passed" ? "Zgodne / Pozytywne" : step.status === "warning" ? "Wymaga uwagi" : "Ryzykowne"}
                            </span>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed font-sans pl-6">
                            {step.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial & Tax Breakdown Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Financial details */}
                    <div className="bg-[#151822] border border-brand-dark rounded-xl p-4 space-y-3 font-mono text-xs">
                      <div className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-sans border-b border-brand-dark pb-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span>Rozbicie Podatkowe i Opłat</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Arbitraż podatkowy VAT ({settings.defaultVatSource}% DE → {settings.defaultVatTarget}% PL):</span>
                          <span className="font-bold text-emerald-400">+{reasoningData.financialBreakdown.vatArbitrageGainPLN} PLN</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Szacowane opłaty (prowizja + logistyka):</span>
                          <span className="font-bold text-amber-400">-{reasoningData.financialBreakdown.estimatedFeesPLN} PLN</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Zwrot z inwestycji (ROI):</span>
                          <span className="font-extrabold text-emerald-300">{reasoningData.financialBreakdown.roiPercent}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Market insights */}
                    <div className="bg-[#151822] border border-brand-dark rounded-xl p-4 space-y-3 font-mono text-xs">
                      <div className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-sans border-b border-brand-dark pb-2">
                        <TrendingUp className="w-4 h-4 text-brand-blue" />
                        <span>Wskazówki Rynkowe Gemini</span>
                      </div>
                      <div className="space-y-2">
                        {reasoningData.marketInsights?.recommendedSellingPricePLN && (
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Sugerowana cena na Allegro:</span>
                            <span className="font-bold text-white">{reasoningData.marketInsights.recommendedSellingPricePLN} PLN</span>
                          </div>
                        )}
                        {reasoningData.marketInsights?.estimatedMonthlySales && (
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Estymacja sprzedaży:</span>
                            <span className="font-bold text-brand-blue">~{reasoningData.marketInsights.estimatedMonthlySales} szt./mc</span>
                          </div>
                        )}
                        {reasoningData.marketInsights?.competitionRating && (
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Poziom konkurencji:</span>
                            <span className="font-bold text-slate-200">{reasoningData.marketInsights.competitionRating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actionable Advice */}
                  {reasoningData.actionableAdvice && reasoningData.actionableAdvice.length > 0 && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2 text-xs">
                      <div className="font-bold text-emerald-300 uppercase font-mono flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Rekomendowane Krok po Kroku Działania Operacyjne:</span>
                      </div>
                      <ul className="space-y-1.5 text-slate-300 pl-1">
                        {reasoningData.actionableAdvice.map((adv, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{adv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* QA History */}
                  {qaHistory.length > 0 && (
                    <div className="space-y-3 border-t border-brand-dark pt-4">
                      <div className="text-xs font-bold text-purple-300 font-mono uppercase tracking-wider">
                        💬 Pytania i Odpowiedzi Gemini AI
                      </div>
                      <div className="space-y-2">
                        {qaHistory.map((item, index) => (
                          <div key={index} className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 space-y-1.5 text-xs">
                            <div className="font-bold text-purple-200 flex items-center gap-1.5">
                              <span>❓</span>
                              <span>{item.q}</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed font-sans pl-5 border-l-2 border-purple-500/30">
                              {item.a}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ask Gemini Box */}
                  <form onSubmit={handleAskSubmit} className="space-y-2 border-t border-brand-dark pt-4">
                    <label className="text-xs font-bold text-slate-300 font-mono uppercase flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-purple-400" />
                      <span>Zapytaj Gemini AI o ten produkt / specyfikację:</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="np. Jakie jest ryzyko reklamacji? Czy na ten produkt wymagany jest CE? Jaka marża po Smart?..."
                        className="flex-1 bg-bg-dark border border-brand-dark rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-hidden font-sans"
                      />
                      <button
                        type="submit"
                        disabled={!customQuestion.trim() || isAsking}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border-0"
                      >
                        {isAsking ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Zapytaj</span>
                            <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : null}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-brand-dark bg-[#151822] text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Analiza stworzona z uwzględnieniem podatków DE/PL i kursu EUR {settings.exchangeRate} PLN
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-sidebar-dark hover:bg-slate-800 border border-brand-dark text-slate-200 rounded-lg font-bold cursor-pointer transition-all"
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
