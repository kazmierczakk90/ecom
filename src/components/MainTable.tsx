import React, { useState, useRef, useEffect } from "react";
import { Star, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Copy, Check, ShoppingCart, Package, Maximize2, Minimize2, GripHorizontal, MoveVertical, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Sparkles, X, Info, Brain } from "lucide-react";
import { ProductListing } from "../types";

interface MainTableProps {
  products: ProductListing[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onRowAction: (actionType: string, product: ProductListing) => void;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  onVerifyEan?: (product: ProductListing) => Promise<any>;
  onVerifyAllEans?: () => Promise<void>;
}

export default function MainTable({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRowAction,
  sortField,
  sortDirection,
  onSort,
  onVerifyEan,
  onVerifyAllEans,
}: MainTableProps) {
  const [isAdditionalCollapsed, setIsAdditionalCollapsed] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // EAN Verification states
  const [verifyingIds, setVerifyingIds] = useState<string[]>([]);
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);
  const [selectedVerificationModalProduct, setSelectedVerificationModalProduct] = useState<ProductListing | null>(null);

  const handleSingleVerify = async (p: ProductListing) => {
    if (!onVerifyEan) return;
    setVerifyingIds(prev => [...prev, p.id]);
    try {
      await onVerifyEan(p);
    } finally {
      setVerifyingIds(prev => prev.filter(id => id !== p.id));
    }
  };

  const handleBatchVerify = async () => {
    if (!onVerifyAllEans) return;
    setIsVerifyingAll(true);
    try {
      await onVerifyAllEans();
    } finally {
      setIsVerifyingAll(false);
    }
  };
  
  // Resizing state
  const [tableHeight, setTableHeight] = useState<number | null>(null); // null = auto flex
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number>(0);
  const startHeight = useRef<number>(500);
  const tableRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    startHeight.current = tableRef.current ? tableRef.current.clientHeight : 500;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = e.clientY - dragStartY.current;
      const newHeight = Math.max(250, Math.min(1200, startHeight.current + deltaY));
      setTableHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleCopy = (text: string, type: string, id: string) => {
    navigator.clipboard.writeText(text);
    const key = `${id}-${type}`;
    setCopiedId(key);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  // Helper functions for search links requested by user
  const cleanProductName = (name: string) => {
    return name.replace(/\s*\((Allegro|Amazon\.de|Ceneo|Amazon\.pl)\s*(Sell|Source)?\)/gi, "").trim();
  };

  const getAllegroUrl = (phrase: string) => `https://allegro.pl/listing?string=${encodeURIComponent(cleanProductName(phrase))}`;
  const getAmazonDeUrl = (phrase: string) => `https://www.amazon.de/s?k=${encodeURIComponent(cleanProductName(phrase))}`;

  const getProductPlatformUrl = (p: ProductListing) => {
    const clean = cleanProductName(p.name);
    if (p.platform === "Amazon.de") {
      return getAmazonDeUrl(clean);
    }
    return getAllegroUrl(clean);
  };

  // Split products into main and secondary/additional
  const mainProducts = products.filter(p => p.roi >= 45);
  const additionalProducts = products.filter(p => p.roi < 45);

  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  const renderStars = (rating: number = 0, count: number = 0) => {
    const safeRating = typeof rating === "number" && !isNaN(rating) ? rating : 0;
    const safeCount = typeof count === "number" && !isNaN(count) ? count : 0;
    const fullStars = Math.floor(safeRating);
    const hasHalf = safeRating % 1 >= 0.5;
    
    return (
      <span className="stars flex flex-wrap items-center text-amber-400 text-xs font-sans">
        <span className="flex mr-1 font-sans tracking-tighter">
          {Array.from({ length: 5 }).map((_, i) => {
            if (i < fullStars) return "★";
            if (i === fullStars && hasHalf) return "★";
            return "☆";
          })}
        </span>
        <span className="count text-[10px] text-slate-500 font-mono">
          ({safeRating.toFixed(1)} · {safeCount >= 1000 ? `${(safeCount / 1000).toFixed(1)}k` : safeCount})
        </span>
      </span>
    );
  };

  const getStatusBadge = (status: ProductListing["status"]) => {
    const configs = {
      Aktywny: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
      Promo: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
      B2B: { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", dot: "bg-blue-400" },
      Braki: { color: "text-rose-400 bg-rose-500/10 border-rose-500/20", dot: "bg-rose-400" },
      Nowy: { color: "text-purple-400 bg-purple-500/10 border-purple-500/20", dot: "bg-purple-400" },
    };

    const config = configs[status] || configs.Aktywny;

    return (
      <span className={`badge border text-[9px] font-mono px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${config.color}`}>
        <span className={`dot w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {status}
      </span>
    );
  };

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-600 inline ml-1 transition-colors group-hover:text-slate-400" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3 h-3 text-brand-blue inline ml-1" /> 
      : <ArrowDown className="w-3 h-3 text-brand-blue inline ml-1" />;
  };

  const renderCard = (p: ProductListing) => {
    const isSelected = selectedIds.includes(p.id);
    let roiBarColor = "bg-brand-green shadow-md shadow-brand-green/20";
    if (p.roi < 40) roiBarColor = "bg-brand-red shadow-md shadow-brand-red/20";
    else if (p.roi < 70) roiBarColor = "bg-brand-yellow shadow-md shadow-brand-yellow/20";

    const allegroLink = getAllegroUrl(p.name);
    const amazonLink = getAmazonDeUrl(p.name);

    return (
      <div 
        key={`card-${p.id}`}
        className={`bg-sidebar-dark/90 border rounded-xl p-4 transition-all space-y-3 font-sans relative ${
          isSelected 
            ? "border-brand-blue bg-brand-blue/5 shadow-lg shadow-brand-blue/10" 
            : "border-brand-dark hover:border-slate-700"
        }`}
      >
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSelect(p.id)}
              className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-all ${
                isSelected 
                  ? "bg-brand-blue border-brand-blue text-white font-bold" 
                  : "border-brand-dark bg-bg-dark text-transparent hover:border-slate-400"
              }`}
            >
              {isSelected ? "✓" : ""}
            </button>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              p.platform === "Amazon.de" 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 font-semibold"
                : p.platform === "Allegro"
                ? "bg-orange-500/10 border-orange-500/20 text-orange-400 font-semibold"
                : "bg-bg-dark border-brand-dark text-slate-300"
            }`}>
              {p.platform}
            </span>
            {getStatusBadge(p.status)}
          </div>

          <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
            ROI {p.roi}%
          </span>
        </div>

        {/* Product Title */}
        <div>
          <a 
            href={getProductPlatformUrl(p)} 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-bold text-slate-100 text-sm hover:text-brand-blue transition-colors flex items-center gap-1.5 cursor-pointer"
            title={`Otwórz na ${p.platform}: ${cleanProductName(p.name)}`}
          >
            <span className="line-clamp-2">{p.name}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-500 hover:text-brand-blue transition-colors" />
          </a>

          {/* Sub identifiers & Specifications */}
          <div className="flex items-center gap-2 flex-wrap mt-2 text-[10px] font-mono text-slate-400">
            {p.brand && (
              <span className="bg-brand-blue/15 text-brand-blue border border-brand-blue/30 px-1.5 py-0.5 rounded font-bold">
                🏷️ {p.brand}
              </span>
            )}
            {p.modelName && (
              <span className="bg-slate-800 text-slate-200 border border-brand-dark px-1.5 py-0.5 rounded">
                Model: {p.modelName}
              </span>
            )}
            <span className="text-slate-500">SKU: {p.sku}</span>
            {p.asin && (
              <button
                onClick={() => handleCopy(p.asin || "", "asin", p.id)}
                className="inline-flex items-center gap-1 bg-bg-dark hover:bg-slate-800 border border-brand-dark px-1.5 py-0.5 rounded cursor-pointer transition-all"
              >
                <span className="text-slate-500">ASIN:</span>
                <span className="font-bold text-slate-200">{p.asin}</span>
                {copiedId === `${p.id}-asin` ? <Check className="w-2.5 h-2.5 text-brand-green" /> : <Copy className="w-2.5 h-2.5 text-slate-600" />}
              </button>
            )}
            {p.ean && (
              <button
                onClick={() => handleCopy(p.ean || "", "ean", p.id)}
                className="inline-flex items-center gap-1 bg-bg-dark hover:bg-slate-800 border border-brand-dark px-1.5 py-0.5 rounded cursor-pointer transition-all"
              >
                <span className="text-slate-500">EAN:</span>
                <span className="font-bold text-slate-200">{p.ean}</span>
                {copiedId === `${p.id}-ean` ? <Check className="w-2.5 h-2.5 text-brand-green" /> : <Copy className="w-2.5 h-2.5 text-slate-600" />}
              </button>
            )}
            {p.gtin && p.gtin !== p.ean && (
              <span className="bg-bg-dark border border-brand-dark px-1.5 py-0.5 rounded text-slate-400">
                GTIN: {p.gtin}
              </span>
            )}
          </div>

          {/* Specifications Tags & Match Criteria */}
          {(p.specifications || (p.matchCriteria && p.matchCriteria.length > 0)) && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2 text-[10px]">
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold font-mono">
                🎯 100% Trafności
              </span>
              {p.specifications?.color && (
                <span className="bg-bg-dark text-slate-300 border border-brand-dark px-1.5 py-0.5 rounded">
                  🎨 {p.specifications.color}
                </span>
              )}
              {p.specifications?.size && (
                <span className="bg-bg-dark text-slate-300 border border-brand-dark px-1.5 py-0.5 rounded">
                  📏 {p.specifications.size}
                </span>
              )}
              {p.specifications?.type && (
                <span className="bg-bg-dark text-slate-300 border border-brand-dark px-1.5 py-0.5 rounded">
                  ⚙️ {p.specifications.type}
                </span>
              )}
              {p.specifications?.pieces && (
                <span className="bg-bg-dark text-slate-300 border border-brand-dark px-1.5 py-0.5 rounded">
                  📦 {p.specifications.pieces}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price & Stats Row */}
        <div className="grid grid-cols-3 gap-2 bg-bg-dark/80 p-2.5 rounded-lg border border-brand-dark">
          <div className="col-span-1">
            <div className="text-[9px] uppercase font-mono text-slate-500 font-bold flex items-center gap-1">
              <span>Cena</span>
            </div>
            <div className="flex flex-col mt-0.5">
              <span className="text-sm font-extrabold text-white font-mono">
                {(p.pricePLN ?? 0).toLocaleString("pl-PL")} zł
                {p.priceEUR && <span className="text-[10px] text-slate-400 font-normal ml-1">({p.priceEUR} €)</span>}
              </span>
              {p.originalPricePLN && (
                <span className="old line-through text-[10px] text-slate-500 font-mono">
                  {(p.originalPricePLN ?? 0).toLocaleString("pl-PL")} zł
                </span>
              )}
            </div>
          </div>

          <div className="col-span-1">
            <div className="text-[9px] uppercase font-mono text-slate-500 font-bold">Sprzedaż / msc</div>
            <div className="text-sm font-bold text-brand-blue font-mono mt-0.5">
              {(p.salesPerMonth ?? 0).toLocaleString("pl-PL")} szt.
            </div>
          </div>

          <div className="col-span-1">
            <div className="text-[9px] uppercase font-mono text-slate-500 font-bold">Opinie</div>
            <div className="mt-0.5">
              {renderStars(p.rating, p.ratingCount)}
            </div>
          </div>
        </div>

        {/* ROI Track Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Marża ROI</span>
            <span className="font-bold text-slate-200">{p.roi}%</span>
          </div>
          <div className="w-full bg-bg-dark border border-brand-dark h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${roiBarColor}`}
              style={{ width: `${Math.min(p.roi, 100)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons Row & Direct Search Links */}
        <div className="pt-3 border-t border-brand-dark flex flex-col gap-2">
          {/* Main Actions */}
          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
            <button 
              onClick={() => onRowAction("ROI", p)}
              className="px-2 py-2 bg-brand-blue/10 border border-brand-blue/30 text-brand-blue hover:bg-brand-blue/20 rounded font-semibold transition-all cursor-pointer flex items-center justify-center"
            >
              ROI
            </button>
            <button 
              onClick={() => onRowAction("Detale", p)}
              className="px-2 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded font-semibold transition-all cursor-pointer flex items-center justify-center"
            >
              Detale
            </button>
            <button 
              onClick={() => onRowAction("Oferta", p)}
              className="px-2 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded font-semibold transition-all cursor-pointer flex items-center justify-center"
            >
              Oferta
            </button>
          </div>

          {/* Quick External Launch Buttons */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <a
              href={allegroLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Wyszukaj na Allegro"
              className="px-2 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Allegro ↗
            </a>
            <a
              href={amazonLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Wyszukaj na Amazon.de"
              className="px-2 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" /> Amazon.de ↗
            </a>
          </div>
        </div>
      </div>
    );
  };

  const renderRow = (p: ProductListing) => {
    const isSelected = selectedIds.includes(p.id);
    
    let roiBarColor = "bg-brand-green shadow-md shadow-brand-green/20";
    if (p.roi < 40) roiBarColor = "bg-brand-red shadow-md shadow-brand-red/20";
    else if (p.roi < 70) roiBarColor = "bg-brand-yellow shadow-md shadow-brand-yellow/20";

    const allegroLink = getAllegroUrl(p.name);
    const amazonLink = getAmazonDeUrl(p.name);

    return (
      <tr 
        key={p.id} 
        className={`border-b border-brand-dark hover:bg-card-dark/50 transition-all font-sans text-xs ${
          isSelected ? "bg-brand-blue/5 selected-row border-l-2 border-l-brand-blue" : ""
        }`}
      >
        {/* Checkbox */}
        <td className="py-3 px-4 w-10 text-center">
          <button
            onClick={() => onToggleSelect(p.id)}
            className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${
              isSelected 
                ? "bg-brand-blue border-brand-blue text-white font-bold" 
                : "border-brand-dark bg-sidebar-dark text-transparent hover:border-slate-400"
            }`}
          >
            {isSelected ? "✓" : ""}
          </button>
        </td>

        {/* Product Name */}
        <td className="py-3 px-4 max-w-sm">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <a 
                href={getProductPlatformUrl(p)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-semibold text-slate-100 text-xs tracking-wide hover:text-brand-blue hover:underline transition-all cursor-pointer inline-flex items-center gap-1"
                title={`Otwórz na ${p.platform}: ${cleanProductName(p.name)}`}
              >
                <span>{p.name}</span>
                <ExternalLink className="w-3 h-3 text-slate-500 hover:text-brand-blue transition-colors" />
              </a>
            </div>

            <div className="sub text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-slate-500">SKU: {p.sku}</span>
              
              {p.asin && (
                <button
                  onClick={() => handleCopy(p.asin || "", "asin", p.id)}
                  title="Kliknij, aby skopiować ASIN"
                  className="inline-flex items-center gap-1 bg-sidebar-dark/80 hover:bg-slate-800 border border-brand-dark hover:border-slate-500 px-1.5 py-0.5 rounded cursor-pointer transition-all text-slate-300 group/btn"
                >
                  <span className="text-slate-500">ASIN:</span>
                  <span className="font-bold text-slate-200">{p.asin}</span>
                  {copiedId === `${p.id}-asin` ? (
                    <span className="inline-flex items-center text-brand-green gap-0.5 text-[9px] font-sans">
                      <Check className="w-2.5 h-2.5" /> Skopiowano!
                    </span>
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-slate-600 group-hover/btn:text-slate-300 transition-colors ml-0.5" />
                  )}
                </button>
              )}

              {p.ean && (
                <button
                  onClick={() => handleCopy(p.ean || "", "ean", p.id)}
                  title="Kliknij, aby skopiować EAN"
                  className="inline-flex items-center gap-1 bg-sidebar-dark/80 hover:bg-slate-800 border border-brand-dark hover:border-slate-500 px-1.5 py-0.5 rounded cursor-pointer transition-all text-slate-300 group/btn"
                >
                  <span className="text-slate-500">EAN:</span>
                  <span className="font-bold text-slate-200">{p.ean}</span>
                  {copiedId === `${p.id}-ean` ? (
                    <span className="inline-flex items-center text-brand-green gap-0.5 text-[9px] font-sans">
                      <Check className="w-2.5 h-2.5" /> Skopiowano!
                    </span>
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-slate-600 group-hover/btn:text-slate-300 transition-colors ml-0.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </td>

        {/* Platform & Quick Direct Search links */}
        <td className="py-3 px-4">
          <div className="flex flex-col items-start gap-1">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              p.platform === "Amazon.de" 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 font-semibold"
                : p.platform === "Allegro"
                ? "bg-orange-500/10 border-orange-500/20 text-orange-400 font-semibold"
                : "bg-sidebar-dark border-brand-dark text-slate-300"
            }`}>
              {p.platform}
            </span>
            <div className="flex items-center gap-1 text-[9px] font-mono">
              <a 
                href={allegroLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-orange-400/80 hover:text-orange-300 hover:underline cursor-pointer"
                title="Wyszukaj produkt na Allegro"
              >
                Allegro ↗
              </a>
              <span className="text-slate-600">·</span>
              <a 
                href={amazonLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-amber-400/80 hover:text-amber-300 hover:underline cursor-pointer"
                title="Wyszukaj produkt na Amazon.de"
              >
                Amazon.de ↗
              </a>
            </div>
          </div>
        </td>

        {/* Weryfikacja EAN / Specyfikacji */}
        <td className="py-3 px-4 whitespace-nowrap">
          {verifyingIds.includes(p.id) ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-blue/10 border border-brand-blue/30 text-brand-blue text-[10px] font-mono rounded-lg">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Weryfikowanie...</span>
            </div>
          ) : p.eanVerification ? (
            <button
              onClick={() => setSelectedVerificationModalProduct(p)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer transition-all hover:scale-105 shadow-xs ${
                p.eanVerification.matchPercentage >= 90
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                  : p.eanVerification.matchPercentage >= 70
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                  : "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25"
              }`}
              title="Kliknij, aby otworzyć raport weryfikacji specyfikacji technicznej"
            >
              {p.eanVerification.matchPercentage >= 90 ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : p.eanVerification.matchPercentage >= 70 ? (
                <AlertTriangle className="w-3 h-3 text-amber-400" />
              ) : (
                <XCircle className="w-3 h-3 text-rose-400" />
              )}
              <span>{p.eanVerification.matchPercentage}% Zgodny</span>
            </button>
          ) : (
            <button
              onClick={() => handleSingleVerify(p)}
              className="px-2.5 py-1 bg-sidebar-dark hover:bg-slate-800 border border-brand-dark hover:border-brand-blue text-slate-300 hover:text-brand-blue rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 group/btn"
              title="Porównaj EAN, markę i specyfikację techniczną za pomocą AI"
            >
              <ShieldCheck className="w-3 h-3 text-slate-500 group-hover/btn:text-brand-blue transition-colors" />
              <span>Weryfikuj EAN</span>
            </button>
          )}
        </td>

        {/* Price */}
        <td className="py-3 px-4 price-cell font-mono text-slate-100">
          <div className="flex flex-col">
            <span className="font-semibold">
              {(p.pricePLN ?? 0).toLocaleString("pl-PL")} zł
              {p.priceEUR && <span className="text-[10px] text-slate-500 font-normal ml-1">({p.priceEUR} €)</span>}
            </span>
            <span className="text-[9px] text-slate-400 font-normal mt-0.5">
              cena za 1 szt.
            </span>
            {p.originalPricePLN && (
              <span className="old line-through text-[10px] text-slate-500 mt-0.5">
                {(p.originalPricePLN ?? 0).toLocaleString("pl-PL")} zł
              </span>
            )}
          </div>
        </td>

        {/* Sales */}
        <td className="py-3 px-4 font-mono text-xs">
          <span className="text-brand-blue font-bold">
            {(p.salesPerMonth ?? 0).toLocaleString("pl-PL")}
          </span>
        </td>

        {/* Rating */}
        <td className="py-3 px-4">
          {renderStars(p.rating, p.ratingCount)}
        </td>

        {/* Status */}
        <td className="py-3 px-4">
          {getStatusBadge(p.status)}
        </td>

        {/* ROI Progress Bar */}
        <td className="py-3 px-4">
          <div className="roi-bar flex items-center gap-2 w-28">
            <div className="roi-track w-full bg-bg-dark border border-brand-dark h-1.5 rounded-full overflow-hidden">
              <div 
                className={`roi-fill h-full rounded-full transition-all duration-500 ${roiBarColor}`}
                style={{ width: `${Math.min(p.roi, 100)}%` }}
              />
            </div>
            <span className="roi-val font-mono text-[10px] font-bold text-slate-300">
              {p.roi}%
            </span>
          </div>
        </td>

        {/* Individual Actions */}
        <td className="py-3 px-4">
          <div className="row-actions flex items-center gap-2 font-mono text-[10px] font-semibold text-slate-400">
            <button 
              onClick={() => onRowAction("RozumowanieAI", p)}
              className="row-action text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded transition-all"
              title="Uruchom rozumowanie arbitrażu Gemini AI"
            >
              <Brain className="w-3 h-3 text-purple-400 animate-pulse" />
              <span>Rozumowanie AI</span>
            </button>
            <span className="text-slate-700">·</span>
            <button 
              onClick={() => onRowAction("ROI", p)}
              className="row-action text-brand-blue hover:text-brand-blue/80 hover:underline cursor-pointer bg-transparent border-0"
            >
              ROI
            </button>
            <span className="text-slate-700">·</span>
            <button 
              onClick={() => onRowAction("Detale", p)}
              className="row-action text-brand-green hover:text-brand-green/80 hover:underline cursor-pointer bg-transparent border-0"
            >
              Detale
            </button>
            <span className="text-slate-700">·</span>
            <button 
              onClick={() => onRowAction("Oferta", p)}
              className="row-action text-brand-yellow hover:text-brand-yellow/80 hover:underline cursor-pointer bg-transparent border-0"
            >
              {p.status === "Braki" ? "Podobne" : "Oferta"}
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div 
      ref={tableRef}
      style={
        isFullscreen 
          ? undefined 
          : tableHeight 
          ? { height: `${tableHeight}px`, flex: "none" } 
          : undefined
      }
      className={`table-wrapper bg-card-dark border border-brand-dark rounded-xl overflow-hidden shadow-md flex flex-col min-h-0 transition-all ${
        isFullscreen 
          ? "fixed inset-2 sm:inset-6 z-50 shadow-2xl bg-sidebar-dark border-brand-blue" 
          : "flex-1"
      }`}
    >
      {/* Top Window Sizing Bar */}
      <div className="bg-sidebar-dark border-b border-brand-dark px-3 py-2 flex items-center justify-between text-xs font-mono shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <MoveVertical className="w-3 h-3 text-brand-blue" />
            Rozmiar okna:
          </span>
          <div className="flex items-center gap-1 bg-bg-dark border border-brand-dark rounded-md p-0.5 text-[10px]">
            <button
              onClick={() => { setTableHeight(380); setIsFullscreen(false); }}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                tableHeight === 380 && !isFullscreen ? "bg-brand-blue text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              380px
            </button>
            <button
              onClick={() => { setTableHeight(550); setIsFullscreen(false); }}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                tableHeight === 550 && !isFullscreen ? "bg-brand-blue text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              550px
            </button>
            <button
              onClick={() => { setTableHeight(800); setIsFullscreen(false); }}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                tableHeight === 800 && !isFullscreen ? "bg-brand-blue text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              800px
            </button>
            <button
              onClick={() => { setTableHeight(null); setIsFullscreen(false); }}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                tableHeight === null && !isFullscreen ? "bg-brand-blue text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Auto
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onVerifyAllEans && (
            <button
              onClick={handleBatchVerify}
              disabled={isVerifyingAll}
              className="px-2.5 py-1 bg-gradient-to-r from-brand-blue/20 via-emerald-500/20 to-brand-blue/20 hover:from-brand-blue/30 hover:to-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-md text-[11px] font-bold font-mono flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shadow-xs"
              title="Zweryfikuj zgodność EAN i parametry techniczne wszystkich produktów za pomocą Gemini AI"
            >
              {isVerifyingAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Weryfikowanie EAN...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>🔍 Weryfikuj wszystkie EAN (Gemini AI)</span>
                </>
              )}
            </button>
          )}

          <span className="text-[10px] text-slate-500 hidden sm:inline">
            {tableHeight ? `${tableHeight}px` : "Elastyczny"}
          </span>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Zamknij pełny ekran" : "Otwórz w pełnym oknie"}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer border border-brand-dark"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Card List View */}
      <div className="block md:hidden overflow-y-auto flex-1 p-3 space-y-3">
        {products.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs">
            Brak wyników wyszukiwania.
          </div>
        ) : (
          products.map(renderCard)
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-auto flex-1">
        <table className="w-full min-w-[900px] text-left border-collapse select-none">
          <thead>
            <tr className="bg-sidebar-dark border-b border-brand-dark font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
              <th className="py-3 px-4 w-10 text-center">
                <button
                  onClick={onToggleSelectAll}
                  className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer mx-auto transition-all ${
                    isAllSelected 
                      ? "bg-brand-blue border-brand-blue text-white font-bold" 
                      : "border-brand-dark bg-sidebar-dark text-transparent hover:border-slate-400"
                  }`}
                >
                  {isAllSelected ? "✓" : ""}
                </button>
              </th>
              
              <th onClick={() => onSort("Nazwa")} className="py-3 px-4 cursor-pointer hover:text-white group">
                Nazwa produktu {renderSortIndicator("Nazwa")}
              </th>
              
              <th className="py-3 px-4">
                Platforma & Wyszukaj
              </th>

              <th className="py-3 px-4 text-emerald-400 font-bold whitespace-nowrap">
                Weryfikacja EAN
              </th>
              
              <th onClick={() => onSort("Cena")} className="py-3 px-4 cursor-pointer hover:text-white group">
                Cena {renderSortIndicator("Cena")}
              </th>
              
              <th onClick={() => onSort("Sprzedaż")} className="py-3 px-4 cursor-pointer hover:text-white group">
                Sprzedaż/mies. {renderSortIndicator("Sprzedaż")}
              </th>
              
              <th onClick={() => onSort("Opinie")} className="py-3 px-4 cursor-pointer hover:text-white group">
                Opinie {renderSortIndicator("Opinie")}
              </th>
              
              <th className="py-3 px-4">
                Status
              </th>
              
              <th onClick={() => onSort("ROI")} className="py-3 px-4 cursor-pointer hover:text-white group">
                ROI {renderSortIndicator("ROI")}
              </th>
              
              <th className="py-3 px-4">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody>
            
            {/* GROUP 1: MAIN RESULTS */}
            <tr className="group-header bg-bg-dark/40 border-b border-brand-dark font-sans font-extrabold text-[10px] text-slate-400 uppercase tracking-wider sticky top-[33px] z-10">
              <td colSpan={10} className="py-2.5 px-4 font-semibold select-none">
                ▾ &nbsp;WYNIKI GŁÓWNE · {mainProducts.length} produktów
              </td>
            </tr>
            {mainProducts.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500 font-mono text-xs bg-bg-dark/10">
                  Brak produktów spełniających kryteria główne.
                </td>
              </tr>
            ) : (
              mainProducts.map(renderRow)
            )}

            {/* GROUP 2: ADDITIONAL RESULTS */}
            <tr 
              onClick={() => setIsAdditionalCollapsed(!isAdditionalCollapsed)}
              className="group-header bg-bg-dark/40 border-b border-brand-dark font-sans font-extrabold text-[10px] text-slate-400 uppercase tracking-wider sticky top-[33px] z-10 cursor-pointer hover:bg-slate-800/40 select-none"
            >
              <td colSpan={10} className="py-2.5 px-4 font-semibold flex items-center justify-between">
                <div>
                  {isAdditionalCollapsed ? "▸" : "▾"} &nbsp;WYNIKI DODATKOWE · {additionalProducts.length} produktów 
                  {isAdditionalCollapsed && <span className="text-[9px] font-normal text-slate-500 font-mono italic ml-2">(zwinięte — kliknij aby rozwinąć)</span>}
                </div>
              </td>
            </tr>
            {!isAdditionalCollapsed && (
              additionalProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 font-mono text-xs bg-bg-dark/10">
                    Brak produktów spełniających kryteria dodatkowe.
                  </td>
                </tr>
              ) : (
                additionalProducts.map(renderRow)
              )
            )}

          </tbody>
        </table>
      </div>

      {/* Bottom Interactive Resize Drag Handle */}
      {!isFullscreen && (
        <div 
          onMouseDown={handleMouseDown}
          title="Kliknij i przeciągnij, aby zmienić wysokość okna tablicy"
          className="h-3 bg-sidebar-dark border-t border-brand-dark flex items-center justify-center cursor-ns-resize hover:bg-brand-blue/20 transition-colors group shrink-0"
        >
          <GripHorizontal className="w-4 h-3 text-slate-600 group-hover:text-brand-blue transition-colors" />
        </div>
      )}

      {/* Verification Report Modal */}
      {selectedVerificationModalProduct && selectedVerificationModalProduct.eanVerification && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card-dark border border-brand-dark rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-brand-dark pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white font-sans">
                    Raport Weryfikacji Specyfikacji Technicznych
                  </h3>
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    Gemini AI
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Porównanie parametrów ofert na rynkach e-commerce
                </p>
              </div>
              <button
                onClick={() => setSelectedVerificationModalProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 font-mono ${
              selectedVerificationModalProduct.eanVerification.matchPercentage >= 90
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : selectedVerificationModalProduct.eanVerification.matchPercentage >= 70
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}>
              <div className="space-y-0.5">
                <div className="text-xs uppercase font-bold text-slate-400">Pewność Dopasowania (Match Score)</div>
                <div className="text-xl font-extrabold flex items-center gap-2">
                  <span>{selectedVerificationModalProduct.eanVerification.verdict}</span>
                  <span className="text-sm font-normal">({selectedVerificationModalProduct.eanVerification.matchPercentage}%)</span>
                </div>
              </div>
              <div className="text-3xl font-black">
                {selectedVerificationModalProduct.eanVerification.matchPercentage}%
              </div>
            </div>

            {/* AI Explanation / Summary */}
            <div className="bg-bg-dark border border-brand-dark p-4 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-200 font-mono flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-blue" />
                <span>Podsumowanie Analizy AI Gemini:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {selectedVerificationModalProduct.eanVerification.explanation}
              </p>
            </div>

            {/* Matched Attributes */}
            {selectedVerificationModalProduct.eanVerification.matchedAttributes && selectedVerificationModalProduct.eanVerification.matchedAttributes.length > 0 && (
              <div className="space-y-2 text-xs">
                <div className="font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Potwierdzone Zgodne Cechy Techniczne:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedVerificationModalProduct.eanVerification.matchedAttributes.map((attr, idx) => (
                    <span key={idx} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-2.5 py-1 rounded-lg text-[11px] font-mono">
                      ✓ {attr}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Discrepancies if any */}
            {selectedVerificationModalProduct.eanVerification.discrepancies && selectedVerificationModalProduct.eanVerification.discrepancies.length > 0 && (
              <div className="space-y-2 text-xs">
                <div className="font-bold text-rose-400 font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Wykryte Różnice / Uwagi:</span>
                </div>
                <div className="space-y-1 bg-rose-500/5 border border-rose-500/20 p-3 rounded-xl">
                  {selectedVerificationModalProduct.eanVerification.discrepancies.map((disc, idx) => (
                    <div key={idx} className="text-rose-300 text-[11px] font-mono flex items-center gap-1.5">
                      <span className="text-rose-400">•</span>
                      <span>{disc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-brand-dark pt-4 font-mono text-xs">
              <span className="text-[10px] text-slate-500">
                Zweryfikowano: {new Date(selectedVerificationModalProduct.eanVerification.verifiedAt).toLocaleTimeString("pl-PL")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleSingleVerify(selectedVerificationModalProduct);
                    setSelectedVerificationModalProduct(null);
                  }}
                  className="px-3 py-1.5 bg-brand-blue/15 text-brand-blue border border-brand-blue/30 hover:bg-brand-blue/25 rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ponów Weryfikację</span>
                </button>
                <button
                  onClick={() => setSelectedVerificationModalProduct(null)}
                  className="px-4 py-1.5 bg-sidebar-dark hover:bg-slate-800 border border-brand-dark text-slate-200 rounded-lg font-bold cursor-pointer transition-all"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

