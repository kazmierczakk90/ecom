import React, { useState, useEffect } from "react";
import { X, Copy, Check, FileText, RefreshCw, Send, Sparkles } from "lucide-react";
import { ProductListing } from "../types";

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductListing | null;
}

export default function OfferModal({ isOpen, onClose, product }: OfferModalProps) {
  const [offerText, setOfferText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");

  const fetchOffer = async (guidelines = "") => {
    if (!product) return;
    setIsLoading(true);
    setCopied(false);
    try {
      const response = await fetch("/api/generate-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product.name,
          platform: "Allegro",
          price: product.pricePLN + 224, // estimate selling price
          category: product.category,
          customInstructions: guidelines
        }),
      });
      const data = await response.json();
      setOfferText(data.offerText || "");
    } catch (err) {
      console.error("Error generating offer copy:", err);
      setOfferText("Błąd podczas generowania opisu przez AI.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      fetchOffer();
    } else {
      setOfferText("");
      setCustomInstructions("");
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(offerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    fetchOffer(customInstructions);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all font-sans">
      <div className="bg-sidebar-dark border border-brand-dark rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark bg-sidebar-dark">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-brand-yellow animate-pulse" />
            <h3 className="font-semibold text-sm uppercase tracking-wide text-white">
              AI Kreator Oferty Allegro
            </h3>
          </div>
          <button 
            id="close-offer-modal"
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-800/50 p-1.5 rounded-lg transition-colors cursor-pointer bg-transparent border-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-300 flex flex-col">
          
          {/* Target Product */}
          <div className="bg-bg-dark p-3 rounded-lg border border-brand-dark flex justify-between items-center shrink-0">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider font-bold">Model referencyjny</span>
              <h4 className="font-semibold text-slate-200 text-xs">{product.name}</h4>
            </div>
            <span className="text-[10px] bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow font-mono font-semibold px-2.5 py-0.5 rounded-full">
              Allegro Draft
            </span>
          </div>

          {/* AI Custom guidelines field */}
          <div className="space-y-1.5 shrink-0">
            <label className="text-xs font-mono text-slate-400">Wytyczne dla AI (np. "użyj emotek", "dodaj info o darmowej dostawie"):</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Wpisz wskazówki, np. Napisz opis w stylu młodzieżowym, dodaj bullet-points..."
                className="w-full bg-bg-dark border border-brand-dark rounded px-3 py-2 text-xs text-white focus:outline-hidden"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRegenerate();
                }}
              />
              <button 
                onClick={handleRegenerate}
                disabled={isLoading}
                className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-xs rounded transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border-0"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Generuj</span>
              </button>
            </div>
          </div>

          {/* Description workspace */}
          <div className="flex-1 bg-bg-dark border border-brand-dark rounded-lg overflow-hidden flex flex-col min-h-[250px]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#16161A] border-b border-brand-dark shrink-0">
              <span className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-blue" />
                WYGENEROWANY TEKST OFERTY (MARKDOWN)
              </span>
              <button
                id="copy-offer-btn"
                onClick={handleCopy}
                disabled={isLoading || !offerText}
                className={`text-xs px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 font-semibold border ${
                  copied 
                    ? "bg-brand-green/25 text-brand-green border-brand-green/30" 
                    : "bg-sidebar-dark text-slate-300 border-brand-dark hover:bg-slate-800 hover:text-white"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Skopiowano!" : "Kopiuj opis"}</span>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-brand-blue animate-spin" />
                  <span className="text-slate-400 animate-pulse">Trwa optymalizacja SEO i pisanie oferty...</span>
                </div>
              ) : (
                <textarea
                  value={offerText}
                  onChange={(e) => setOfferText(e.target.value)}
                  className="w-full h-full bg-transparent border-0 resize-none outline-none focus:ring-0 text-slate-300 placeholder-slate-600"
                  placeholder="Tutaj pojawi się opis oferty..."
                />
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-dark bg-bg-dark flex justify-between items-center shrink-0">
          <span className="text-[10px] text-slate-500 font-mono">
            * Możesz edytować tekst opisu bezpośrednio w oknie przed skopiowaniem.
          </span>
          <button 
            id="close-offer-modal-footer-btn"
            onClick={onClose} 
            className="px-5 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-xs tracking-wide transition-all cursor-pointer border-0"
          >
            Zamknij kreator
          </button>
        </div>

      </div>
    </div>
  );
}
