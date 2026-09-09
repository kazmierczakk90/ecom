import React from "react";
import { Search, Settings, Activity, Cloud, Sparkles, Menu } from "lucide-react";
import { User } from "firebase/auth";

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenGoogleDrive: () => void;
  onOpenSmartDiscovery: () => void;
  onToggleSidebar?: () => void;
  activeSearchQuery?: string;
  currentUser?: User | null;
}

export default function Header({
  onOpenSearch,
  onOpenSettings,
  onOpenGoogleDrive,
  onOpenSmartDiscovery,
  onToggleSidebar,
  activeSearchQuery,
  currentUser
}: HeaderProps) {
  return (
    <header className="app-header h-[60px] border-b border-brand-dark bg-sidebar-dark px-4 sm:px-6 flex items-center justify-between font-sans shrink-0">
      
      {/* Brand Logo & Mobile Toggle */}
      <div className="flex items-center gap-2 sm:gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer border-0 bg-transparent flex items-center justify-center shrink-0"
            title="Otwórz menu wyszukiwania"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="logo font-sans text-base sm:text-xl font-extrabold tracking-tight text-white select-none">
          Product<span className="text-brand-blue font-semibold">Scout</span>
        </div>
        
        <div className="hidden xs:flex items-center gap-1.5 font-mono text-[9px] text-slate-400 bg-card-dark border border-brand-dark px-2 py-0.5 rounded shrink-0">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="hidden sm:inline">v2.4 · LIVE ARBITRAGE</span>
          <span className="sm:hidden">v2.4</span>
        </div>

        {activeSearchQuery && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-brand-blue/10 border border-brand-blue/20 px-2.5 py-0.5 rounded-full">
            <Search className="w-3 h-3 text-brand-blue" />
            <span>Słowo: <strong className="text-brand-blue font-semibold">"{activeSearchQuery}"</strong></span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="header-actions flex items-center gap-1.5 sm:gap-3">
        <button
          id="header-smart-discovery-btn"
          onClick={onOpenSmartDiscovery}
          className="btn flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-sm shrink-0"
          title="Analiza trendów i nisz rynkowych AI"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="hidden md:inline">Smart Discovery</span>
        </button>
        
        <button 
          id="header-drive-btn"
          onClick={onOpenGoogleDrive}
          title="Przesyłaj i przeglądaj w Google Drive"
          className={`btn btn-ghost flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium border rounded-lg transition-all cursor-pointer bg-transparent shrink-0 ${
            currentUser
              ? "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
              : "border-brand-dark text-slate-300 hover:bg-slate-800/50 hover:text-white"
          }`}
        >
          {currentUser ? (
            <>
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white font-mono flex items-center justify-center font-bold text-[9px]">
                  {currentUser.displayName?.[0] || currentUser.email?.[0] || "C"}
                </span>
              )}
              <span className="hidden lg:inline">Chmura: <strong className="font-semibold text-white">{currentUser.displayName || "Połączono"}</strong></span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            </>
          ) : (
            <>
              <Cloud className="w-4 h-4 text-brand-blue" />
              <span className="hidden sm:inline">Chmura Google</span>
            </>
          )}
        </button>

        <button 
          id="header-new-search-btn"
          onClick={onOpenSearch}
          className="btn btn-secondary flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-semibold tracking-wide hover:bg-brand-blue/90 transition-all duration-200 shadow-md shadow-brand-blue/15 hover:shadow-brand-blue/30 cursor-pointer uppercase border-0 shrink-0"
          title="Rozpocznij nowe wyszukiwanie na żywo"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Nowe wyszukiwanie</span>
        </button>

        <button 
          id="header-settings-btn"
          onClick={onOpenSettings}
          className="btn btn-ghost flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs text-slate-300 font-medium border border-brand-dark hover:bg-slate-800/50 hover:text-white rounded-lg transition-all cursor-pointer bg-transparent shrink-0"
          title="Ustawienia prowizji i walut"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Ustawienia</span>
        </button>
      </div>

    </header>
  );
}

