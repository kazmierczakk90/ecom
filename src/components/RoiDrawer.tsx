import React, { useState, useEffect } from "react";
import { X, Calculator, HelpCircle, ArrowRightLeft, DollarSign, Percent, ShieldCheck } from "lucide-react";
import { ProductListing, ArbitrageSettings } from "../types";

interface RoiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductListing | null;
  settings: ArbitrageSettings;
}

export default function RoiDrawer({ isOpen, onClose, product, settings }: RoiDrawerProps) {
  const [buyPriceEUR, setBuyPriceEUR] = useState(0);
  const [sellPricePLN, setSellPricePLN] = useState(0);
  const [shippingCostEUR, setShippingCostEUR] = useState(0);
  const [commissionPercent, setCommissionPercent] = useState(0);
  const [vatSource, setVatSource] = useState(0); // Buying VAT e.g. 19%
  const [vatTarget, setVatTarget] = useState(0); // Selling VAT e.g. 23%
  const [exchangeRate, setExchangeRate] = useState(0);

  // Initialize values when product changes
  useEffect(() => {
    if (product) {
      const rate = settings.exchangeRate || 4.31;
      const safePricePLN = product.pricePLN || 0;
      const defaultBuyEUR = product.priceEUR || +(safePricePLN / rate).toFixed(2);
      setBuyPriceEUR(defaultBuyEUR);
      setSellPricePLN(safePricePLN + (product.platform === "Amazon.de" ? 224 : 0)); // estimate target sell or if it's already target, keep it
      
      // If it's a Buy listing (Amazon.de)
      if (product.platform === "Amazon.de") {
        setSellPricePLN(Math.round(safePricePLN * 1.25)); // Estimate sell price at 25% profit margin + fees
      } else {
        setSellPricePLN(safePricePLN);
        setBuyPriceEUR(+(safePricePLN / 1.25 / rate).toFixed(2)); // back calculate buy price
      }

      setShippingCostEUR(settings.defaultShippingCostEUR || 0);
      setCommissionPercent(settings.defaultCommissionPercent || 0);
      setVatSource(settings.defaultVatSource || 0);
      setVatTarget(settings.defaultVatTarget || 0);
      setExchangeRate(rate);
    }
  }, [product, settings]);

  if (!isOpen || !product) return null;

  // Real-time computations
  const buyCostPLNNoVat = buyPriceEUR * exchangeRate;
  const shippingPLN = shippingCostEUR * exchangeRate;
  
  // Total cost to acquire (buying price already has VAT in e-commerce, or B2B net buy + Polish tax adjustment)
  // Let's implement standard consumer-to-retail or B2B Net calculation
  const totalBuyCostPLN = buyCostPLNNoVat + shippingPLN;

  // Allegro fees
  const commissionCostPLN = sellPricePLN * (commissionPercent / 100);
  const fixedFeePLN = 1.00; // standard transactional fee
  const totalFeesPLN = commissionCostPLN + fixedFeePLN;

  // Tax calculations
  // VAT on margin or standard gross VAT
  // In arbitrage (VAT-marża), tax is paid on the net margin (Selling - Buying)
  // In standard VAT (23%), we subtract input VAT from output VAT:
  const outputVatPLN = (sellPricePLN * (vatTarget / 100)) / (1 + vatTarget / 100);
  const inputVatPLN = (buyCostPLNNoVat * (vatSource / 100)) / (1 + vatSource / 100);
  const taxLiabilityPLN = Math.max(0, outputVatPLN - inputVatPLN);

  // Profit & ROI
  const netProfitPLN = sellPricePLN - totalBuyCostPLN - totalFeesPLN - taxLiabilityPLN;
  const netROI = totalBuyCostPLN > 0 ? (netProfitPLN / totalBuyCostPLN) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-end z-50 transition-all font-sans">
      <div className="bg-sidebar-dark border-l border-brand-dark w-full max-w-xl h-full flex flex-col shadow-2xl overflow-hidden animate-slide-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark bg-sidebar-dark">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-brand-blue" />
            <h3 className="font-semibold text-sm uppercase tracking-wide text-white">
              Kalkulator Rentowności (ROI)
            </h3>
          </div>
          <button 
            id="close-roi-drawer"
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-800/50 p-1.5 rounded-lg transition-colors cursor-pointer bg-transparent border-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          
          {/* Product Summary */}
          <div className="bg-bg-dark p-4 rounded-lg border border-brand-dark space-y-1.5">
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
              Wybrany Produkt
            </span>
            <h4 className="font-semibold text-slate-200 text-xs">
              {product.name}
            </h4>
            <div className="flex gap-4 text-[10px] font-mono text-slate-400">
              <span>SKU: {product.sku}</span>
              <span>Kategoria: {product.category}</span>
            </div>
          </div>

          {/* Interactive Inputs */}
          <div className="space-y-4">
            <h5 className="font-semibold text-xs uppercase tracking-wider text-slate-400 font-mono border-b border-brand-dark pb-1">
              Parametry Kalkulacji
            </h5>

            {/* Slider Buy Price */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Cena zakupu na Amazon.de (€):</span>
                <span className="text-white font-bold">{(buyPriceEUR || 0).toFixed(2)} €</span>
              </div>
              <input 
                type="range"
                min={Math.max(1, Math.round((buyPriceEUR || 0) * 0.5))}
                max={Math.max(10, Math.round((buyPriceEUR || 0) * 1.5))}
                step="1"
                value={buyPriceEUR || 0}
                onChange={(e) => setBuyPriceEUR(Number(e.target.value))}
                className="w-full accent-brand-blue cursor-pointer bg-bg-dark"
              />
            </div>

            {/* Slider Sell Price */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Cena sprzedaży na Allegro (zł):</span>
                <span className="text-brand-green font-bold">{sellPricePLN || 0} zł</span>
              </div>
              <input 
                type="range"
                min={Math.max(10, Math.round((sellPricePLN || 0) * 0.5))}
                max={Math.max(20, Math.round((sellPricePLN || 0) * 1.5))}
                step="5"
                value={sellPricePLN || 0}
                onChange={(e) => setSellPricePLN(Number(e.target.value))}
                className="w-full accent-brand-green cursor-pointer bg-bg-dark"
              />
            </div>

            {/* Numerical Grid */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Shipping input */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">Koszt dostawy (EUR):</label>
                <input 
                  type="number"
                  value={shippingCostEUR}
                  onChange={(e) => setShippingCostEUR(Number(e.target.value))}
                  className="w-full bg-bg-dark border border-brand-dark rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-hidden"
                />
              </div>

              {/* Commission input */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">Prowizja Allegro (%):</label>
                <input 
                  type="number"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(Number(e.target.value))}
                  className="w-full bg-bg-dark border border-brand-dark rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-hidden"
                />
              </div>
            </div>

            {/* Exchange Rate / VAT info */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-slate-500">
              <div>Kurs: {(exchangeRate || 0).toFixed(2)} PLN</div>
              <div>Vat Niemcy: {vatSource}%</div>
              <div>Vat Polska: {vatTarget}%</div>
            </div>
          </div>

          {/* Arbitrage Profit Breakdown Sheet */}
          <div className="bg-bg-dark p-5 rounded-lg border border-brand-dark space-y-4">
            <h5 className="font-semibold text-xs uppercase tracking-wider text-slate-400 font-mono border-b border-brand-dark/40 pb-1.5 flex items-center justify-between">
              <span>Arkusz Rozliczenia</span>
              <ShieldCheck className="w-4 h-4 text-brand-green" />
            </h5>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-brand-dark/30 pb-1.5">
                <span className="text-slate-400">Przychód brutto (Allegro):</span>
                <span className="font-mono text-white font-semibold">+{(sellPricePLN || 0).toFixed(2)} zł</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Koszt zakupu (Niemcy):</span>
                <span className="font-mono text-brand-red font-semibold">-{(buyCostPLNNoVat || 0).toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between border-b border-brand-dark/30 pb-1.5">
                <span className="text-slate-400 ml-3">Dostawa międzynarodowa:</span>
                <span className="font-mono text-brand-red">-{(shippingPLN || 0).toFixed(2)} zł</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Prowizja od sprzedaży (Allegro):</span>
                <span className="font-mono text-brand-red">-{(commissionCostPLN || 0).toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between border-b border-brand-dark/30 pb-1.5">
                <span className="text-slate-400 ml-3">Opłata transakcyjna (fixed):</span>
                <span className="font-mono text-brand-red">-{(fixedFeePLN || 0).toFixed(2)} zł</span>
              </div>

              <div className="flex justify-between border-b border-brand-dark/30 pb-1.5">
                <span className="text-slate-400">Skojarzone zobowiązanie VAT:</span>
                <span className="font-mono text-brand-red">-{(taxLiabilityPLN || 0).toFixed(2)} zł</span>
              </div>

              {/* KPI net profitability */}
              <div className="flex justify-between pt-2">
                <span className="text-sm font-semibold text-slate-300">Szacowany zysk netto:</span>
                <span className={`text-base font-bold font-mono ${netProfitPLN >= 0 ? "text-brand-green" : "text-brand-red"}`}>
                  {(netProfitPLN || 0).toFixed(2)} zł
                </span>
              </div>
              <div className="flex justify-between border-t border-brand-dark pt-2">
                <span className="text-sm font-semibold text-slate-300">Szacowany ROI:</span>
                <span className={`text-xl font-extrabold font-mono ${netROI >= 45 ? "text-brand-green animate-pulse" : netROI >= 20 ? "text-brand-yellow" : "text-brand-red"}`}>
                  {(netROI || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-dark bg-sidebar-dark flex justify-end">
          <button 
            id="close-roi-drawer-footer-btn"
            onClick={onClose} 
            className="px-5 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold transition-all cursor-pointer shadow-md hover:shadow-brand-blue/15 border-0"
          >
            Zamknij kalkulację
          </button>
        </div>

      </div>
    </div>
  );
}
