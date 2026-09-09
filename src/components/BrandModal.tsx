import React, { useState, useEffect } from "react";
import { X, ShieldAlert, CheckCircle, AlertTriangle, HelpCircle, Activity } from "lucide-react";

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
}

export default function BrandModal({ isOpen, onClose, brandName }: BrandModalProps) {
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalysis = async () => {
    if (!brandName) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/analyze-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName }),
      });
      const data = await response.json();
      setAnalysis(data.analysis || "");
    } catch (err) {
      console.error("Error analyzing brand risk:", err);
      setAnalysis("Wystąpił błąd podczas analizowania marki przez AI.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && brandName) {
      fetchAnalysis();
    } else {
      setAnalysis("");
    }
  }, [isOpen, brandName]);

  if (!isOpen || !brandName) return null;

  // Simple risk extraction
  const isHighRisk = analysis.toLowerCase().includes("wysoki");
  const isMediumRisk = analysis.toLowerCase().includes("średni") || analysis.toLowerCase().includes("sredni");
  
  let riskColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  let RiskIcon = CheckCircle;
  let riskLabel = "NISKIE RYZYKO";

  if (isHighRisk) {
    riskColor = "text-brand-red bg-brand-red/10 border-brand-red/20";
    RiskIcon = ShieldAlert;
    riskLabel = "WYSOKIE RYZYKO";
  } else if (isMediumRisk) {
    riskColor = "text-brand-yellow bg-brand-yellow/10 border-brand-yellow/20";
    RiskIcon = AlertTriangle;
    riskLabel = "ŚREDNIE RYZYKO";
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all font-sans">
      <div className="bg-sidebar-dark border border-brand-dark rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark bg-sidebar-dark">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-brand-blue animate-pulse" />
            <h3 className="font-semibold text-sm uppercase tracking-wide text-white">
              AI Analizator Ryzyka Marki
            </h3>
          </div>
          <button 
            id="close-brand-modal"
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-800/50 p-1.5 rounded-lg transition-colors cursor-pointer bg-transparent border-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-300">
          
          {/* Brand & Risk Score */}
          <div className="flex items-center justify-between bg-bg-dark p-4 rounded-lg border border-brand-dark">
            <div>
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">MARKA / PRODUCENT</span>
              <h4 className="text-lg font-extrabold text-slate-200 tracking-tight">{brandName}</h4>
            </div>

            <div className={`border px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 font-semibold text-xs ${riskColor}`}>
              <RiskIcon className="w-4 h-4" />
              <span>{riskLabel}</span>
            </div>
          </div>

          {/* Analysis Markdown Container */}
          <div className="bg-bg-dark border border-brand-dark rounded-lg p-5 min-h-[180px]">
            {isLoading ? (
              <div className="h-[150px] flex flex-col items-center justify-center space-y-3">
                <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400 animate-pulse font-mono text-center">Przeszukiwanie kartotek i baz ochrony patentowej...</span>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-4 text-slate-300 font-sans">
                {analysis.split("\n\n").map((paragraph, index) => {
                  if (paragraph.startsWith("###")) {
                    return <h5 key={index} className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono border-b border-brand-dark pb-1 pt-2">{paragraph.replace("###", "").trim()}</h5>;
                  }
                  if (paragraph.startsWith("*") || paragraph.startsWith("-")) {
                    return (
                      <ul key={index} className="list-disc pl-4 space-y-1">
                        {paragraph.split("\n").map((line, lIdx) => (
                          <li key={lIdx} className="text-slate-300">{line.replace(/^[\*\-\s]+/, "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={index} className="text-slate-400">{paragraph}</p>;
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-dark bg-bg-dark flex justify-end">
          <button 
            id="close-brand-modal-footer-btn"
            onClick={onClose} 
            className="px-5 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-xs transition-all cursor-pointer border-0"
          >
            Zamknij analizę
          </button>
        </div>

      </div>
    </div>
  );
}
