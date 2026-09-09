import React, { useState } from "react";
import { X, Settings, Coins, ShieldAlert, Truck, Percent } from "lucide-react";
import { ArbitrageSettings } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ArbitrageSettings;
  onSave: (settings: ArbitrageSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [exchangeRate, setExchangeRate] = useState(settings.exchangeRate);
  const [defaultVatSource, setDefaultVatSource] = useState(settings.defaultVatSource);
  const [defaultVatTarget, setDefaultVatTarget] = useState(settings.defaultVatTarget);
  const [defaultShippingCostEUR, setDefaultShippingCostEUR] = useState(settings.defaultShippingCostEUR);
  const [defaultCommissionPercent, setDefaultCommissionPercent] = useState(settings.defaultCommissionPercent);
  const [defaultSourcePlatform, setDefaultSourcePlatform] = useState(settings.defaultSourcePlatform || "Amazon.de");
  const [defaultTargetPlatform, setDefaultTargetPlatform] = useState(settings.defaultTargetPlatform || "Allegro");
  const [useMockSimulation, setUseMockSimulation] = useState(settings.useMockSimulation);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      exchangeRate: Number(exchangeRate),
      defaultVatSource: Number(defaultVatSource),
      defaultVatTarget: Number(defaultVatTarget),
      defaultShippingCostEUR: Number(defaultShippingCostEUR),
      defaultCommissionPercent: Number(defaultCommissionPercent),
      useMockSimulation,
      defaultSourcePlatform,
      defaultTargetPlatform,
    });
    onClose();
  };

  return (
    <div id="settings-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in overflow-y-auto">
      <div id="settings-card" className="bg-sidebar-dark border border-brand-dark rounded-xl w-full max-w-lg shadow-2xl overflow-hidden font-sans my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark bg-sidebar-dark">
          <div className="flex items-center gap-2.5 text-slate-100">
            <Settings className="w-5 h-5 text-brand-blue animate-spin-slow" />
            <h3 className="font-semibold text-base tracking-wide text-white font-sans uppercase">
              USTAWIENIA ANALIZY ARBITRAŻU
            </h3>
          </div>
          <button 
            id="close-settings-btn"
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-800/50 p-1.5 rounded-lg transition-colors cursor-pointer bg-transparent border-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          
          {/* Default Platforms Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium flex items-center gap-1.5">
                🛒 Domyślna Platforma Zakupu (BUY)
              </label>
              <select
                value={defaultSourcePlatform}
                onChange={(e) => setDefaultSourcePlatform(e.target.value)}
                className="w-full bg-bg-dark border border-brand-dark rounded-lg px-3 py-2.5 text-white font-sans focus:border-brand-blue focus:outline-hidden text-xs"
              >
                <option value="Amazon.de">🇩🇪 Amazon DE</option>
                <option value="Allegro">🛒 Allegro</option>
                <option value="Amazon.pl">📦 Amazon PL</option>
                <option value="Ceneo">💰 Ceneo</option>
                <option value="eBay">🌐 eBay</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium flex items-center gap-1.5">
                📈 Domyślna Platforma Sprzedaży (SELL)
              </label>
              <select
                value={defaultTargetPlatform}
                onChange={(e) => setDefaultTargetPlatform(e.target.value)}
                className="w-full bg-bg-dark border border-brand-dark rounded-lg px-3 py-2.5 text-white font-sans focus:border-brand-blue focus:outline-hidden text-xs"
              >
                <option value="Allegro">🛒 Allegro</option>
                <option value="Amazon.de">🇩🇪 Amazon DE</option>
                <option value="Amazon.pl">📦 Amazon PL</option>
                <option value="Ceneo">💰 Ceneo</option>
                <option value="eBay">🌐 eBay</option>
              </select>
            </div>
          </div>

          {/* Exchange Rate */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-brand-blue" />
              Kurs walutowy EUR / PLN
            </label>
            <div className="relative">
              <input 
                type="number" 
                step="0.01"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className="w-full bg-bg-dark border border-brand-dark rounded-lg px-4 py-2.5 text-white font-mono focus:border-brand-blue focus:outline-hidden"
              />
              <span className="absolute right-4 top-2.5 text-xs text-slate-500 font-mono">PLN za 1 EUR</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* VAT Germany */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-brand-blue" />
                Vat Niemcy (Amazon.de)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={defaultVatSource}
                  onChange={(e) => setDefaultVatSource(Number(e.target.value))}
                  className="w-full bg-bg-dark border border-brand-dark rounded-lg px-4 py-2.5 text-white font-mono focus:border-brand-blue focus:outline-hidden"
                />
                <span className="absolute right-4 top-2.5 text-xs text-slate-500 font-mono">%</span>
              </div>
            </div>

            {/* VAT Poland */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-brand-blue" />
                Vat Polska (Allegro)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={defaultVatTarget}
                  onChange={(e) => setDefaultVatTarget(Number(e.target.value))}
                  className="w-full bg-bg-dark border border-brand-dark rounded-lg px-4 py-2.5 text-white font-mono focus:border-brand-blue focus:outline-hidden"
                />
                <span className="absolute right-4 top-2.5 text-xs text-slate-500 font-mono">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shipping Cost */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-brand-blue" />
                Domyślny koszt wysyłki
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  value={defaultShippingCostEUR}
                  onChange={(e) => setDefaultShippingCostEUR(Number(e.target.value))}
                  className="w-full bg-bg-dark border border-brand-dark rounded-lg px-4 py-2.5 text-white font-mono focus:border-brand-blue focus:outline-hidden"
                />
                <span className="absolute right-4 top-2.5 text-xs text-slate-500 font-mono">EUR</span>
              </div>
            </div>

            {/* Default Allegro Commission */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-brand-blue" />
                Domyślna prowizja Allegro
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={defaultCommissionPercent}
                  onChange={(e) => setDefaultCommissionPercent(Number(e.target.value))}
                  className="w-full bg-bg-dark border border-brand-dark rounded-lg px-4 py-2.5 text-white font-mono focus:border-brand-blue focus:outline-hidden"
                />
                <span className="absolute right-4 top-2.5 text-xs text-slate-500 font-mono">%</span>
              </div>
            </div>
          </div>

          {/* Info Block on API key */}
          <div className="bg-bg-dark border border-brand-dark rounded-lg p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <ShieldAlert className="w-4 h-4 text-brand-yellow" />
              <span>Autoryzacja API Gemini</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Twój klucz API jest automatycznie pobierany z panelu **Settings &gt; Secrets** w AI Studio.
              W przypadku braku klucza, system bezpiecznie przełącza się w **Tryb Symulacji AI**, generując wysoce realistyczne analizy produktów w locie.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-dark bg-bg-dark">
          <button 
            id="cancel-settings-btn"
            onClick={onClose} 
            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer font-medium bg-transparent border-0"
          >
            Anuluj
          </button>
          <button 
            id="save-settings-btn"
            onClick={handleSave} 
            className="px-5 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold transition-all cursor-pointer shadow-lg hover:shadow-brand-blue/20 border-0"
          >
            Zapisz zmiany
          </button>
        </div>

      </div>
    </div>
  );
}
