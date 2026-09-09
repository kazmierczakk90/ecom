import React, { useState, useEffect } from "react";
import { X, Search, MapPin, Zap, Filter, Compass, ArrowRight, Hash, Coins, Percent, Truck, Settings2, Bookmark, Plus, Trash2, RotateCcw } from "lucide-react";
import { ArbitrageSettings, SearchTemplate } from "../types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: ArbitrageSettings;
  searchTemplates?: SearchTemplate[];
  onSaveTemplate?: (template: SearchTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onSearch: (params: {
    keyword: string;
    sourcePlatform: string;
    targetPlatform: string;
    priceMin: number;
    priceMax: number;
    resultsLimit: number;
    category?: string;
    actionType: string;
    thenAction: string;
    exchangeRate: number;
    vatSource: number;
    vatTarget: number;
    shippingCostEUR: number;
    commissionPercent: number;
  }) => void;
}

const CATEGORIES_LIST = [
  "Wszystkie kategorie",
  "Elektronika",
  "AGD",
  "Komputery i GSM",
  "Dom i Ogród",
  "Sport i Turystyka",
  "Uroda i Zdrowie",
  "Zabawki i Dziecko",
  "Odzież i Obuwie",
  "Motoryzacja",
  "Książki i Produkty cyfrowe",
];

const BUY_SOURCES = [
  { id: "Amazon.de", name: "Amazon DE (Buy)", ico: "🇩🇪" },
  { id: "Amazon.pl", name: "Amazon PL (Buy)", ico: "📦" },
  { id: "Allegro", name: "Allegro (Buy)", ico: "🛒" },
  { id: "Ceneo", name: "Ceneo (Buy)", ico: "💰" },
  { id: "eBay", name: "eBay (Buy)", ico: "🌐" },
];

const SELL_TARGETS = [
  { id: "Allegro", name: "Allegro (Sell)", ico: "🛒" },
  { id: "Amazon.pl", name: "Amazon PL (Sell)", ico: "📦" },
  { id: "eBay", name: "eBay (Sell)", ico: "🌐" },
  { id: "Ceneo", name: "Ceneo (Sell)", ico: "💰" },
  { id: "Amazon.de", name: "Amazon DE (Sell)", ico: "🇩🇪" },
];

const ACTIONS = ["PORÓWNAJ", "ANALIZUJ", "DODAJ", "PODSUMUJ"];

const THEN_ACTIONS = [
  { id: "list", name: "Dodaj do listy", ico: "📋" },
  { id: "roi", name: "Analizuj ROI", ico: "📈" },
  { id: "details", name: "Pobierz detale", ico: "📥" },
  { id: "offer", name: "Utwórz ofertę", ico: "📄" },
  { id: "similar", name: "Wyszukaj podobne", ico: "🔎" },
  { id: "brand", name: "Przeanalizuj brand", ico: "🏷️" },
  { id: "best", name: "Najlepsza oferta", ico: "💎" },
];

const LIMIT_OPTIONS = [3, 5, 10, 15, 25, 50];

export default function SearchModal({ 
  isOpen, 
  onClose, 
  initialSettings, 
  searchTemplates = [],
  onSaveTemplate,
  onDeleteTemplate,
  onSearch 
}: SearchModalProps) {
  // Clean empty default parameters for new search
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("Wszystkie kategorie");
  const [sourcePlatform, setSourcePlatform] = useState("Amazon.de");
  const [targetPlatform, setTargetPlatform] = useState("Allegro");
  const [resultsLimit, setResultsLimit] = useState(5);
  
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [actionType, setActionType] = useState("PORÓWNAJ");
  const [isInclude, setIsInclude] = useState(true);
  const [thenAction, setThenAction] = useState("roi");
  
  // Custom temporary search variables
  const [exchangeRate, setExchangeRate] = useState(4.31);
  const [vatSource, setVatSource] = useState(19);
  const [vatTarget, setVatTarget] = useState(23);
  const [shippingCostEUR, setShippingCostEUR] = useState(4.99);
  const [commissionPercent, setCommissionPercent] = useState(8);

  const [showVariables, setShowVariables] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  // Load defaults from initial settings
  useEffect(() => {
    if (initialSettings) {
      setExchangeRate(initialSettings.exchangeRate || 4.31);
      setVatSource(initialSettings.defaultVatSource || 19);
      setVatTarget(initialSettings.defaultVatTarget || 23);
      setShippingCostEUR(initialSettings.defaultShippingCostEUR || 4.99);
      setCommissionPercent(initialSettings.defaultCommissionPercent || 8);
      if (initialSettings.defaultSourcePlatform) {
        setSourcePlatform(initialSettings.defaultSourcePlatform);
      }
      if (initialSettings.defaultTargetPlatform) {
        setTargetPlatform(initialSettings.defaultTargetPlatform);
      }
    }
  }, [initialSettings, isOpen]);

  if (!isOpen) return null;

  const handleApplyTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    if (!tplId) return;
    const tpl = searchTemplates.find(t => t.id === tplId);
    if (tpl) {
      setKeyword(tpl.keyword || "");
      if (tpl.category) setCategory(tpl.category);
      setSourcePlatform(tpl.sourcePlatform || "Amazon.de");
      setTargetPlatform(tpl.targetPlatform || "Allegro");
      setPriceMin(tpl.priceMin ? String(tpl.priceMin) : "");
      setPriceMax(tpl.priceMax && tpl.priceMax < 90000 ? String(tpl.priceMax) : "");
      setResultsLimit(tpl.resultsLimit || 5);
    }
  };

  const handleClearForm = () => {
    setKeyword("");
    setCategory("Wszystkie kategorie");
    setPriceMin("");
    setPriceMax("");
    setSelectedTemplateId("");
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) return;
    if (onSaveTemplate) {
      onSaveTemplate({
        id: `tpl-${Date.now()}`,
        name: newTemplateName.trim(),
        keyword,
        sourcePlatform,
        targetPlatform,
        priceMin: Number(priceMin) || 0,
        priceMax: Number(priceMax) || 99999,
        resultsLimit,
        category,
        searchSource: "local-db"
      });
    }
    setNewTemplateName("");
    setIsSavingTemplate(false);
  };

  const handleDeleteSelectedTemplate = () => {
    if (selectedTemplateId && onDeleteTemplate) {
      onDeleteTemplate(selectedTemplateId);
      setSelectedTemplateId("");
    }
  };

  const handleSubmit = () => {
    onSearch({
      keyword: keyword.trim() || "Wszystkie okazje",
      sourcePlatform,
      targetPlatform,
      priceMin: Number(priceMin) || 0,
      priceMax: Number(priceMax) || 99999,
      resultsLimit,
      category,
      actionType,
      thenAction,
      exchangeRate,
      vatSource,
      vatTarget,
      shippingCostEUR,
      commissionPercent
    });
    onClose();
  };

  return (
    <div className="popup-overlay fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in overflow-y-auto">
      <div className="popup bg-sidebar-dark border border-brand-dark rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden font-sans my-8">
        
        {/* Header */}
        <div className="popup-header flex items-center justify-between px-6 py-4 border-b border-brand-dark bg-sidebar-dark">
          <div className="popup-title text-slate-100 flex items-center gap-2.5">
            <span className="popup-step bg-brand-blue text-white font-mono text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
              1
            </span>
            <span className="font-semibold text-sm uppercase tracking-wide">Konfiguracja Arbitrażu</span>
          </div>
          <button 
            id="close-search-modal-btn"
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer text-xl font-light bg-transparent border-0"
          >
            ×
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="popup-body p-6 space-y-6 max-h-[70vh] overflow-y-auto text-sm">
          
          {/* TEMPLATE MANAGER SECTION */}
          <div className="bg-bg-dark border border-brand-dark/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] tracking-wider text-slate-300 font-bold uppercase font-mono flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-brand-blue" />
                📑 ZARZĄDZANIE SZABLONAMI USTAWIENIA
              </div>
              <button
                type="button"
                onClick={handleClearForm}
                className="text-[11px] text-slate-400 hover:text-brand-yellow font-mono flex items-center gap-1 cursor-pointer bg-transparent border-0"
                title="Wyczyść wszystkie parametry"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Wyczyść parametry</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <select
                value={selectedTemplateId}
                onChange={(e) => handleApplyTemplate(e.target.value)}
                className="w-full sm:w-auto flex-1 bg-sidebar-dark border border-brand-dark rounded-lg px-3 py-2 text-white text-xs font-sans focus:border-brand-blue focus:outline-hidden"
              >
                <option value="">-- Wybierz zapisany szablon wyszukiwania --</option>
                {searchTemplates.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsSavingTemplate(!isSavingTemplate)}
                  className="px-3 py-2 bg-brand-blue/20 hover:bg-brand-blue/30 text-brand-blue border border-brand-blue/40 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Zapisz szablon</span>
                </button>

                {selectedTemplateId && (
                  <button
                    type="button"
                    onClick={handleDeleteSelectedTemplate}
                    className="p-2 bg-brand-red/15 hover:bg-brand-red/30 text-brand-red border border-brand-red/40 rounded-lg text-xs cursor-pointer transition-colors"
                    title="Usuń ten szablon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {isSavingTemplate && (
              <div className="flex items-center gap-2 pt-2 border-t border-brand-dark animate-fade-in">
                <input
                  type="text"
                  placeholder="Nazwa nowego szablonu (np. Smartwatche Garmin DE -> Allegro)..."
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="flex-1 bg-sidebar-dark border border-brand-dark rounded-lg px-3 py-1.5 text-xs text-white focus:border-brand-blue focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleCreateTemplate}
                  className="px-3 py-1.5 bg-brand-green hover:bg-brand-green/90 text-white rounded-lg text-xs font-semibold cursor-pointer border-0"
                >
                  Zapisz
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingTemplate(false)}
                  className="px-2 py-1.5 text-slate-400 hover:text-white text-xs cursor-pointer bg-transparent border-0"
                >
                  Anuluj
                </button>
              </div>
            )}
          </div>

          {/* BESTSELLER & 100% MATCHING BADGE */}
          <div className="bg-gradient-to-r from-brand-blue/15 via-emerald-500/10 to-transparent border border-brand-blue/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                <span className="text-amber-400">🔥</span>
                <span>Wyszukiwanie Najlepiej Sprzedających Się Modelu (Bestsellers)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Pobiera najpopularniejsze produkty z platformy zakupu, sortuje wg wielkości sprzedaży i odszukuje <strong>100% dokładne odpowiedniki</strong> na drugiej platformie (wymagana zgodność firmy/marki oraz min. 2 parametrów: model, kolor, rozmiar, EAN/ASIN/GTIN).
              </p>
            </div>
            <span className="shrink-0 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              🎯 100% Zgodności
            </span>
          </div>

          {/* SZUKAJ & KATEGORIA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <div className="popup-section-title text-[10px] tracking-wider text-slate-400 font-bold uppercase font-mono flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-brand-blue" />
                🔍 SZUKAJ · Fraza, EAN, ASIN lub Link
              </div>
              <div className="relative">
                <input 
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Wpisz frazę, ASIN, EAN lub wklej bezpośredni link..." 
                  className="w-full bg-bg-dark border border-brand-dark rounded-lg px-4 py-2.5 text-white text-xs font-sans focus:border-brand-blue focus:outline-hidden"
                />
                {(keyword.startsWith("http://") || keyword.startsWith("https://")) && (
                  <div className="text-[10px] text-brand-blue font-semibold mt-1.5 flex items-center gap-1 font-mono animate-pulse">
                    <span>🔗</span>
                    <span>Wykryto link produktu/listingu</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="popup-section-title text-[10px] tracking-wider text-slate-400 font-bold uppercase font-mono flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-brand-blue" />
                  🏷️ KATEGORIA
                </span>
                {category && category !== "Wszystkie kategorie" && (
                  <span className="text-brand-green font-bold text-[9px]">● Aktywna</span>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-bg-dark border border-brand-dark rounded-lg px-3 py-2.5 text-white text-xs font-sans focus:border-brand-blue focus:outline-hidden cursor-pointer"
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DUAL PLATFORMS (BUY SOURCE -> SELL TARGET) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Źródło Zakupu */}
            <div className="space-y-2">
              <div className="popup-section-title text-[10px] tracking-wider text-slate-400 font-bold uppercase font-mono flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-blue" />
                🛒 1. ŹRÓDŁO ZAKUPU (BUY)
              </div>
              <div className="flex flex-col gap-1.5">
                {BUY_SOURCES.map((plat) => {
                  const isSelected = sourcePlatform === plat.id;
                  return (
                    <button
                      key={plat.id}
                      onClick={() => setSourcePlatform(plat.id)}
                      className={`cursor-pointer text-xs px-3 py-2 rounded-lg border font-medium flex items-center gap-2.5 transition-all text-left ${
                        isSelected 
                          ? "bg-brand-blue/15 border-brand-blue text-brand-blue font-semibold" 
                          : "bg-bg-dark border-brand-dark text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-base">{plat.ico}</span>
                      <span>{plat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Miejsce Sprzedaży */}
            <div className="space-y-2">
              <div className="popup-section-title text-[10px] tracking-wider text-slate-400 font-bold uppercase font-mono flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-brand-green" />
                📈 2. MIEJSCE SPRZEDAŻY (SELL)
              </div>
              <div className="flex flex-col gap-1.5">
                {SELL_TARGETS.map((plat) => {
                  const isSelected = targetPlatform === plat.id;
                  return (
                    <button
                      key={plat.id}
                      onClick={() => setTargetPlatform(plat.id)}
                      className={`cursor-pointer text-xs px-3 py-2 rounded-lg border font-medium flex items-center gap-2.5 transition-all text-left ${
                        isSelected 
                          ? "bg-brand-green/15 border-brand-green text-brand-green font-semibold" 
                          : "bg-bg-dark border-brand-dark text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-base">{plat.ico}</span>
                      <span>{plat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ILOŚĆ GENEROWANYCH WYNIKÓW (LIMIT) */}
          <div className="space-y-2">
            <div className="popup-section-title text-[10px] tracking-wider text-slate-400 font-bold uppercase font-mono flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-brand-blue" />
              🔢 ILOŚĆ GENEROWANYCH WYNIKÓW
            </div>
            <div className="flex flex-wrap gap-2">
              {LIMIT_OPTIONS.map((val) => {
                const isSelected = resultsLimit === val;
                return (
                  <button
                    key={val}
                    onClick={() => setResultsLimit(val)}
                    className={`cursor-pointer text-xs px-4 py-2 rounded-lg font-mono font-bold border transition-all ${
                      isSelected 
                        ? "bg-brand-blue text-white border-brand-blue shadow-md shadow-brand-blue/20" 
                        : "bg-bg-dark border-brand-dark text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {val} {val === 5 ? "(Domyślnie)" : ""}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 font-sans italic">
              Określ ile unikalnych par produktowych ma zostać poddanych analizie i wygenerowanych przez silnik AI.
            </p>
          </div>

          {/* AKCJA */}
          <div className="space-y-2">
            <div className="popup-section-title text-[10px] tracking-wider text-slate-400 font-bold uppercase font-mono flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-blue" />
              ⚡ AKCJA · Operacja
            </div>
            <div className="action-chips flex flex-wrap gap-2">
              {ACTIONS.map((act) => {
                const isSelected = actionType === act;
                return (
                  <button
                    key={act}
                    onClick={() => setActionType(act)}
                    className={`action-chip cursor-pointer text-xs px-4 py-2 rounded-lg font-mono font-medium border tracking-wide transition-all ${
                      isSelected 
                        ? "bg-brand-blue text-white border-brand-blue shadow-md shadow-brand-blue/20" 
                        : "bg-bg-dark border-brand-dark text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {act}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DYNAMIC VARIABLE MODIFIER (ZMIENNE) */}
          <div className="border border-brand-dark bg-bg-dark rounded-xl p-4 space-y-4">
            <button
              type="button"
              onClick={() => setShowVariables(!showVariables)}
              className="w-full flex items-center justify-between text-left text-slate-300 hover:text-white transition-colors bg-transparent border-0 cursor-pointer p-0"
            >
              <div className="text-[10px] tracking-wider font-bold uppercase font-mono flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-brand-yellow animate-spin-slow" />
                ⚙ ZMIENNE ANALIZY (WALUTY, TAX, PROWIZJE)
              </div>
              <span className="text-xs text-brand-blue font-mono">
                {showVariables ? "[ UKRYJ ]" : "[ EDYTUJ ZMIENNE ]"}
              </span>
            </button>

            {showVariables && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-brand-dark/40 animate-fade-in text-xs">
                {/* Exchange Rate */}
                <div className="space-y-1">
                  <label className="text-slate-400 flex items-center gap-1">
                    <Coins className="w-3 h-3 text-brand-blue" /> Kurs EUR / PLN
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                    className="w-full bg-sidebar-dark border border-brand-dark rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Shipping cost */}
                <div className="space-y-1">
                  <label className="text-slate-400 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-brand-blue" /> Koszt wysyłki (EUR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={shippingCostEUR}
                    onChange={(e) => setShippingCostEUR(Number(e.target.value))}
                    className="w-full bg-sidebar-dark border border-brand-dark rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Vat Source */}
                <div className="space-y-1">
                  <label className="text-slate-400 flex items-center gap-1">
                    <Percent className="w-3 h-3 text-brand-blue" /> VAT Zakupu ({sourcePlatform})
                  </label>
                  <input
                    type="number"
                    value={vatSource}
                    onChange={(e) => setVatSource(Number(e.target.value))}
                    className="w-full bg-sidebar-dark border border-brand-dark rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Vat Target */}
                <div className="space-y-1">
                  <label className="text-slate-400 flex items-center gap-1">
                    <Percent className="w-3 h-3 text-brand-green" /> VAT Sprzedaży ({targetPlatform})
                  </label>
                  <input
                    type="number"
                    value={vatTarget}
                    onChange={(e) => setVatTarget(Number(e.target.value))}
                    className="w-full bg-sidebar-dark border border-brand-dark rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Commission */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-400 flex items-center gap-1">
                    <Percent className="w-3 h-3 text-brand-yellow" /> Prowizja platformy sprzedaży
                  </label>
                  <input
                    type="number"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(Number(e.target.value))}
                    className="w-full bg-sidebar-dark border border-brand-dark rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* WARUNKI */}
          <div className="space-y-3 bg-bg-dark p-4 rounded-lg border border-brand-dark">
            <div className="popup-section-title text-[10px] tracking-wider text-slate-400 font-bold uppercase font-mono flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-brand-blue" />
              ⚙ CENA MIN / MAX (ZAKRES FILTRACJI)
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="space-y-1 w-full md:w-auto">
                <div className="text-slate-500 text-[10px] uppercase font-mono">Zakres cen (PLN)</div>
                <div className="price-range flex items-center gap-2">
                  <input 
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="od" 
                    className="w-24 bg-sidebar-dark border border-brand-dark rounded px-3 py-1.5 text-white text-xs font-mono focus:border-brand-blue focus:outline-hidden"
                  />
                  <span className="price-sep text-slate-500">—</span>
                  <input 
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="do" 
                    className="w-24 bg-sidebar-dark border border-brand-dark rounded px-3 py-1.5 text-white text-xs font-mono focus:border-brand-blue focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1 w-full md:w-auto">
                <div className="text-slate-500 text-[10px] uppercase font-mono">Kierunek filtracji</div>
                <div className="include-toggle flex bg-sidebar-dark p-0.5 rounded border border-brand-dark text-xs font-mono">
                  <button 
                    onClick={() => setIsInclude(true)}
                    className={`px-3 py-1.5 rounded transition-all cursor-pointer border-0 ${isInclude ? "bg-brand-green text-white font-semibold" : "text-slate-500 hover:text-slate-300 bg-transparent"}`}
                  >
                    UWZGLĘDNIJ
                  </button>
                  <button 
                    onClick={() => setIsInclude(false)}
                    className={`px-3 py-1.5 rounded transition-all cursor-pointer border-0 ${!isInclude ? "bg-brand-red text-white font-semibold" : "text-slate-500 hover:text-slate-300 bg-transparent"}`}
                  >
                    OPUŚĆ
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* WTEDY */}
          <div className="space-y-2">
            <div className="popup-section-title text-[10px] tracking-wider text-slate-400 font-bold uppercase font-mono flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-brand-blue" />
              🎯 WTEDY · Wynik akcji
            </div>
            <div className="then-actions grid grid-cols-2 md:grid-cols-3 gap-2">
              {THEN_ACTIONS.map((act) => {
                const isSelected = thenAction === act.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => setThenAction(act.id)}
                    className={`then-action cursor-pointer text-xs p-3 rounded-lg border flex items-center gap-2 transition-all ${
                      isSelected 
                        ? "bg-brand-blue/15 border-brand-blue text-brand-blue shadow-md font-semibold" 
                        : "bg-bg-dark border-brand-dark text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="ta-ico text-base">{act.ico}</span>
                    <span>{act.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="popup-footer flex items-center justify-between px-6 py-4 border-t border-brand-dark bg-bg-dark">
          <button 
            id="cancel-search-btn"
            onClick={onClose} 
            className="btn btn-ghost text-xs px-4 py-2 border border-brand-dark text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer bg-transparent"
          >
            Anuluj
          </button>
          
          <div className="flex gap-2">
            <button 
              id="run-search-btn"
              onClick={handleSubmit}
              className="btn btn-primary text-xs px-5 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-brand-blue/20 flex items-center gap-2 cursor-pointer border-0"
            >
              🔍 &nbsp;Uruchom wyszukiwanie
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
