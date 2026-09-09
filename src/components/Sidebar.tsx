import React, { useState } from "react";
import { Search, Plus, Trash2, Sliders, PlayCircle, BarChart3, HelpCircle, Clock } from "lucide-react";
import { FilterCondition, SearchTemplate, RecentSearchItem } from "../types";

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

interface SidebarProps {
  onSearch: (keyword: string, platforms: string[], priceMin: number, priceMax: number, category?: string) => void;
  onAddCondition: (cond: FilterCondition) => void;
  onRemoveCondition: (id: string) => void;
  onClearConditions: () => void;
  onToggleLogic: () => void;
  conditions: FilterCondition[];
  isAndLogic: boolean;
  onGroupAction: (actionType: string) => void;
  selectedCount: number;
  searchTemplates: SearchTemplate[];
  onSaveTemplate: (template: Omit<SearchTemplate, "id">) => void;
  onDeleteTemplate: (id: string) => void;
  recentSearches?: RecentSearchItem[];
  onClearRecentSearches?: () => void;
  onDeleteRecentSearch?: (id: string) => void;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  onSearch,
  onAddCondition,
  onRemoveCondition,
  onClearConditions,
  onToggleLogic,
  conditions,
  isAndLogic,
  onGroupAction,
  selectedCount,
  searchTemplates,
  onSaveTemplate,
  onDeleteTemplate,
  recentSearches = [],
  onClearRecentSearches,
  onDeleteRecentSearch,
  onCloseMobile,
}: SidebarProps) {

  // Search parameters
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("Wszystkie kategorie");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Allegro", "Amazon.de"]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Search template saving states
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");

  const handleLoadTemplate = (tpl: SearchTemplate) => {
    setKeyword(tpl.keyword);
    if (tpl.category) {
      setCategory(tpl.category);
    }
    const platforms: string[] = [];
    if (tpl.sourcePlatform) platforms.push(tpl.sourcePlatform);
    if (tpl.targetPlatform) platforms.push(tpl.targetPlatform);
    setSelectedPlatforms(platforms);
    setPriceMin(String(tpl.priceMin));
    setPriceMax(String(tpl.priceMax));

    onSearch(
      tpl.keyword,
      platforms,
      tpl.priceMin,
      tpl.priceMax,
      tpl.category
    );
  };

  const handleLoadRecentSearch = (item: RecentSearchItem) => {
    setKeyword(item.keyword);
    if (item.category) {
      setCategory(item.category);
    } else {
      setCategory("Wszystkie kategorie");
    }
    const platforms = item.platforms && item.platforms.length > 0 
      ? item.platforms 
      : [item.sourcePlatform || "Amazon.de", item.targetPlatform || "Allegro"].filter(Boolean);
    
    setSelectedPlatforms(platforms);
    setPriceMin(item.priceMin ? String(item.priceMin) : "");
    setPriceMax(item.priceMax && item.priceMax < 99999 ? String(item.priceMax) : "");

    onSearch(
      item.keyword,
      platforms,
      item.priceMin || 0,
      item.priceMax || 99999,
      item.category
    );
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!templateNameInput.trim()) {
      alert("Proszę wpisać nazwę szablonu!");
      return;
    }
    const src = selectedPlatforms.includes("Amazon.de") ? "Amazon.de" : (selectedPlatforms.includes("Ceneo") ? "Ceneo" : "Allegro");
    const tgt = selectedPlatforms.includes("Allegro") ? "Allegro" : "Amazon.de";

    onSaveTemplate({
      name: templateNameInput.trim(),
      keyword: keyword,
      sourcePlatform: src,
      targetPlatform: tgt,
      priceMin: Number(priceMin) || 0,
      priceMax: Number(priceMax) || 99999,
      resultsLimit: 5,
      category: category,
      searchSource: "local-db",
    });
    setTemplateNameInput("");
    setIsSavingTemplate(false);
  };

  // Filter creation state
  const [filterField, setFilterField] = useState<FilterCondition["field"]>("Nazwa");
  const [filterOperator, setFilterOperator] = useState<FilterCondition["operator"]>("~");
  const [filterValue, setFilterValue] = useState("");

  const handleSearchClick = () => {
    onSearch(
      keyword,
      selectedPlatforms,
      Number(priceMin) || 0,
      Number(priceMax) || 99999,
      category
    );
  };

  const handleAddCondClick = () => {
    if (!filterValue.trim()) return;
    onAddCondition({
      id: `cond-${Date.now()}`,
      field: filterField,
      operator: filterOperator,
      value: filterValue.trim(),
    });
    setFilterValue("");
  };

  const togglePlatformInSidebar = (plat: string) => {
    if (selectedPlatforms.includes(plat)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== plat));
    } else {
      setSelectedPlatforms([...selectedPlatforms, plat]);
    }
  };

  return (
    <aside className="sidebar w-80 bg-sidebar-dark border-r border-brand-dark p-5 space-y-6 flex flex-col overflow-y-auto shrink-0 font-sans">
      
      {/* Mobile-only close header */}
      <div className="flex items-center justify-between md:hidden pb-3 border-b border-brand-dark shrink-0">
        <div className="text-xs font-bold text-white font-mono uppercase tracking-wider">
          Filtry & Szablony
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-bold font-mono transition-all cursor-pointer border border-brand-dark"
          >
            × ZAMKNIJ
          </button>
        )}
      </div>

      {/* SECTION 1: Current Search */}
      <div className="sidebar-section space-y-3">
        <div className="sidebar-label text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
          Aktualne Wyszukiwanie
        </div>
        
        <div className="search-block bg-bg-dark p-3 rounded-lg border border-brand-dark space-y-3">
          {/* Keyword */}
          <div className="search-row space-y-1">
            <div className="field-label text-[10px] text-slate-500 font-bold uppercase font-mono">
              Słowo kluczowe / Link
            </div>
            <div className="relative">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="wpisz frazę, ASIN lub wklej link..."
                className="input-field w-full bg-sidebar-dark border border-brand-dark rounded px-3 py-1.5 text-xs text-white focus:border-brand-blue focus:outline-hidden"
              />
              {(keyword.startsWith("http://") || keyword.startsWith("https://")) && (
                <div className="text-[10px] text-brand-blue font-semibold mt-1.5 flex items-center gap-1 font-mono animate-pulse">
                  <span>🔗</span>
                  <span>Wykryto link docelowy</span>
                </div>
              )}
            </div>
            <div className="text-[9px] text-slate-500 font-medium">
              Możesz wkleić bezpośredni link produktu (Amazon / Allegro / Ceneo) lub ASIN/EAN.
            </div>
          </div>

          {/* Category */}
          <div className="search-row space-y-1">
            <div className="field-label text-[10px] text-slate-500 font-bold uppercase font-mono flex items-center justify-between">
              <span>Kategoria</span>
              {category && category !== "Wszystkie kategorie" && (
                <span className="text-brand-blue text-[9px] font-bold">● Aktywna</span>
              )}
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field w-full bg-sidebar-dark border border-brand-dark rounded px-2.5 py-1.5 text-xs text-white focus:border-brand-blue focus:outline-hidden cursor-pointer font-sans"
            >
              {CATEGORIES_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Platforms */}
          <div className="search-row space-y-1">
            <div className="field-label text-[10px] text-slate-500 font-bold uppercase font-mono">
              Platformy (WHERE)
            </div>
            <div className="multiselect flex flex-wrap gap-1">
              {[
                { id: "Allegro", label: "Allegro", active: selectedPlatforms.includes("Allegro"), color: "bg-orange-600/10 border-orange-500/30 text-orange-400" },
                { id: "Amazon.de", label: "Amazon DE", active: selectedPlatforms.includes("Amazon.de"), color: "bg-brand-blue/10 border-brand-blue/30 text-brand-blue" },
                { id: "Ceneo", label: "Ceneo", active: selectedPlatforms.includes("Ceneo"), color: "bg-teal-600/10 border-teal-500/30 text-teal-400" }
              ].map((plat) => (
                <button
                  key={plat.id}
                  onClick={() => togglePlatformInSidebar(plat.id)}
                  className={`ms-tag text-[9px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                    plat.active 
                      ? `${plat.color} font-semibold` 
                      : "bg-sidebar-dark border-brand-dark text-slate-400"
                  }`}
                >
                  {plat.label} {plat.active ? "×" : "+"}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="search-row space-y-1">
            <div className="field-label text-[10px] text-slate-500 font-bold uppercase font-mono">
              Cena (PLN)
            </div>
            <div className="price-range flex items-center gap-1.5">
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="od"
                className="input-field w-full bg-sidebar-dark border border-brand-dark rounded px-2 py-1 text-xs text-white font-mono focus:border-brand-blue focus:outline-hidden"
              />
              <span className="price-sep text-slate-600 text-xs">—</span>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="do"
                className="input-field w-full bg-sidebar-dark border border-brand-dark rounded px-2 py-1 text-xs text-white font-mono focus:border-brand-blue focus:outline-hidden"
              />
            </div>
          </div>

          <button
            id="sidebar-search-btn"
            onClick={handleSearchClick}
            className="btn-search w-full cursor-pointer bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-xs py-2 rounded transition-all tracking-wider shadow-md hover:shadow-brand-blue/20 uppercase border-0"
          >
            🔍 &nbsp;SZUKAJ
          </button>
        </div>
      </div>

      {/* SECTION: Ostatnie wyszukiwania */}
      <div className="sidebar-section space-y-3 animate-fade-in">
        <div className="sidebar-label text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-blue" />
            <span>Ostatnie wyszukiwania</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-normal font-mono">
              {recentSearches.length}/5
            </span>
            {recentSearches.length > 0 && onClearRecentSearches && (
              <button
                type="button"
                onClick={onClearRecentSearches}
                className="text-[9px] text-slate-500 hover:text-red-400 transition-colors font-mono cursor-pointer border-0 bg-transparent"
                title="Wyczyść historię wyszukiwania"
              >
                Wyczyść
              </button>
            )}
          </div>
        </div>

        <div className="bg-bg-dark p-2.5 rounded-lg border border-brand-dark space-y-1.5">
          {recentSearches.length === 0 ? (
            <div className="text-[10px] text-slate-500 italic py-2 text-center font-mono">
              Brak historii wyszukiwań
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {recentSearches.slice(0, 5).map((item) => {
                const displayKeyword = item.keyword.trim() || "(wszystkie produkty)";
                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between gap-1.5 p-2 rounded bg-sidebar-dark/60 hover:bg-slate-800/90 border border-brand-dark/60 hover:border-brand-blue/50 transition-all text-left"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadRecentSearch(item)}
                      className="flex-1 text-left bg-transparent border-0 p-0 cursor-pointer overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5">
                        <Search className="w-3 h-3 text-brand-blue shrink-0 opacity-70 group-hover:opacity-100" />
                        <span className="font-semibold text-[11px] truncate text-slate-200 group-hover:text-white" title={displayKeyword}>
                          {displayKeyword}
                        </span>
                      </div>
                      
                      <div className="text-[9px] text-slate-500 font-mono truncate mt-0.5 flex items-center gap-1">
                        {item.category && item.category !== "Wszystkie kategorie" && (
                          <span className="text-slate-400">{item.category} •</span>
                        )}
                        <span>
                          {item.priceMin > 0 || (item.priceMax && item.priceMax < 99999)
                            ? `${item.priceMin || 0}-${item.priceMax || 99999} zł`
                            : "bez limitu cenowego"}
                        </span>
                      </div>
                    </button>

                    {onDeleteRecentSearch && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRecentSearch(item.id);
                        }}
                        className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-slate-900 transition-all cursor-pointer border-0 shrink-0 opacity-0 group-hover:opacity-100"
                        title="Usuń z historii"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECTION: Szablony wyszukiwań */}
      <div className="sidebar-section space-y-3 animate-fade-in">
        <div className="sidebar-label text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
          <span>Szablony ustawień</span>
          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-normal font-mono">
            {searchTemplates.length}
          </span>
        </div>

        <div className="bg-bg-dark p-3 rounded-lg border border-brand-dark space-y-3">
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {searchTemplates.map((tpl) => (
              <div 
                key={tpl.id}
                className="group flex items-center justify-between gap-1.5 p-2 rounded bg-sidebar-dark/40 hover:bg-slate-800/80 border border-brand-dark/40 hover:border-slate-700 transition-all text-left"
              >
                <button
                  type="button"
                  onClick={() => handleLoadTemplate(tpl)}
                  className="flex-1 text-left bg-transparent border-0 p-0 text-slate-300 group-hover:text-white cursor-pointer"
                >
                  <div className="font-semibold text-[11px] truncate text-slate-300 group-hover:text-white" title={tpl.name}>
                    {tpl.name}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono truncate">
                    {tpl.keyword} ({tpl.sourcePlatform} → {tpl.targetPlatform})
                  </div>
                </button>
                
                {!tpl.id.startsWith("preset-") && (
                  <button
                    type="button"
                    onClick={() => onDeleteTemplate(tpl.id)}
                    className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-slate-900 transition-all cursor-pointer border-0"
                    title="Usuń szablon"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Quick Add Form */}
          {isSavingTemplate ? (
            <div className="space-y-2 pt-2 border-t border-brand-dark/60">
              <input
                type="text"
                value={templateNameInput}
                onChange={(e) => setTemplateNameInput(e.target.value)}
                placeholder="Nazwa szablonu..."
                className="input-field w-full bg-sidebar-dark border border-brand-dark rounded px-2 py-1.5 text-xs text-white focus:border-brand-blue focus:outline-hidden"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveCurrentAsTemplate();
                }}
                autoFocus
              />
              <div className="flex gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={handleSaveCurrentAsTemplate}
                  className="flex-1 bg-brand-blue hover:bg-brand-blue/95 text-white font-bold py-1 rounded transition-all cursor-pointer border-0 font-mono"
                >
                  ZAPISZ
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingTemplate(false)}
                  className="px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-all cursor-pointer border-0 font-mono"
                >
                  ANULUJ
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTemplateNameInput(`Szablon: ${keyword}`);
                setIsSavingTemplate(true);
              }}
              className="w-full text-center bg-sidebar-dark hover:bg-slate-800 text-slate-400 hover:text-brand-blue border border-dashed border-brand-dark rounded py-1.5 text-[10px] font-semibold transition-all cursor-pointer font-mono"
            >
              + ZAPISZ OBECNE JAKO SZABLON
            </button>
          )}
        </div>
      </div>

      {/* SECTION 2: Display Filters */}
      <div className="sidebar-section space-y-3">
        <div className="sidebar-label text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
          Filtry wyświetlania
        </div>

        <div className="conditions-block bg-bg-dark p-3 rounded-lg border border-brand-dark space-y-2.5">
          
          <div className="condition-row flex gap-1.5 items-center">
            {/* Field */}
            <select
              value={filterField}
              onChange={(e) => setFilterField(e.target.value as FilterCondition["field"])}
              className="cond-select bg-sidebar-dark border border-brand-dark rounded px-2 py-1 text-xs text-slate-300 w-full focus:outline-hidden"
            >
              <option value="Nazwa">Nazwa</option>
              <option value="Cena">Cena</option>
              <option value="Sprzedaż">Sprzedaż</option>
              <option value="Opinie">Opinie</option>
              <option value="Status">Status</option>
              <option value="ROI">ROI</option>
            </select>

            {/* Operators */}
            <div className="flex bg-sidebar-dark border border-brand-dark rounded p-0.5 font-mono text-xs text-slate-400">
              {["=", "<", ">", "~"].map((op) => (
                <button
                  key={op}
                  onClick={() => setFilterOperator(op as FilterCondition["operator"])}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    filterOperator === op 
                      ? "bg-brand-blue text-white font-semibold" 
                      : "hover:text-white"
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Value input */}
          <div className="condition-row">
            <input
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder="wartość…"
              className="cond-val w-full bg-sidebar-dark border border-brand-dark rounded px-3 py-1.5 text-xs text-white focus:border-brand-blue focus:outline-hidden"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCondClick();
              }}
            />
          </div>

          {/* Logic Toggle */}
          <div className="flex justify-between items-center bg-sidebar-dark border border-brand-dark p-1.5 rounded text-[10px]">
            <span className="text-slate-500 font-mono">Bramka logiczna:</span>
            <div className="logic-pill flex bg-bg-dark p-0.5 rounded border border-brand-dark font-mono">
              <button
                onClick={onToggleLogic}
                className={`logic-opt px-2 py-0.5 rounded cursor-pointer ${isAndLogic ? "bg-brand-blue text-white font-bold" : "text-slate-500 hover:text-slate-300"}`}
              >
                ORAZ
              </button>
              <button
                onClick={onToggleLogic}
                className={`logic-opt px-2 py-0.5 rounded cursor-pointer ${!isAndLogic ? "bg-brand-blue text-white font-bold" : "text-slate-500 hover:text-slate-300"}`}
              >
                LUB
              </button>
            </div>
          </div>

          <button
            id="sidebar-add-cond-btn"
            onClick={handleAddCondClick}
            className="btn btn-secondary w-full text-center flex justify-center gap-1.5 bg-sidebar-dark hover:bg-slate-800 text-slate-300 font-semibold text-[10px] py-1.5 rounded border border-brand-dark transition-all cursor-pointer uppercase font-mono"
          >
            + Dodaj warunek
          </button>

          {/* Active conditions checklist */}
          {conditions.length > 0 && (
            <div className="active-conds-list pt-2 border-t border-brand-dark space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Warunki ({conditions.length}):</span>
                <button onClick={onClearConditions} className="text-red-400 hover:text-red-300 cursor-pointer bg-transparent border-0">
                  Wyczyść
                </button>
              </div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {conditions.map((c) => (
                  <span
                    key={c.id}
                    className="text-[9px] font-mono bg-sidebar-dark border border-brand-dark text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0"
                  >
                    <span>{c.field} {c.operator} "{c.value}"</span>
                    <button
                      onClick={() => onRemoveCondition(c.id)}
                      className="text-red-400 hover:text-red-300 font-bold ml-0.5 cursor-pointer text-[10px] bg-transparent border-0"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* SECTION 3: Group Actions */}
      <div className="sidebar-section space-y-3">
        <div className="sidebar-label text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
          Akcje grupowe {selectedCount > 0 && <span className="text-brand-blue font-bold">({selectedCount})</span>}
        </div>
        
        <div className="action-group flex flex-col gap-1.5">
          <button
            onClick={() => onGroupAction("EKSPORTUJ_SHEETS")}
            disabled={selectedCount === 0}
            className={`btn font-bold text-[10px] py-2 rounded transition-all tracking-wider uppercase font-mono border ${
              selectedCount > 0
                ? "bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-500/30 hover:border-emerald-500 cursor-pointer"
                : "bg-slate-800/50 border-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            📊 EKSPORTUJ DO SHEETS
          </button>

          <button
            onClick={() => onGroupAction("DODAJ DO LISTY")}
            className="btn btn-primary bg-card-dark hover:bg-slate-800 text-slate-300 font-semibold text-[10px] py-2 rounded transition-all tracking-wider border border-brand-dark cursor-pointer uppercase font-mono"
          >
            DODAJ DO LISTY
          </button>
          
          <button
            onClick={() => onGroupAction("ANALIZUJ ROI")}
            className="btn btn-blue bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-[10px] py-2 rounded transition-all tracking-wider shadow-sm cursor-pointer uppercase font-mono border-0"
          >
            ANALIZUJ ROI
          </button>

          <button
            onClick={() => onGroupAction("UTWÓRZ OFERTĘ")}
            className="btn btn-yellow bg-brand-yellow hover:bg-brand-yellow/90 text-slate-950 font-bold text-[10px] py-2 rounded transition-all tracking-wider shadow-sm cursor-pointer uppercase font-mono border-0"
          >
            UTWÓRZ OFERTĘ
          </button>

          <button
            onClick={() => onGroupAction("POBIERZ DETALE")}
            className="btn btn-secondary bg-[#1C1C21] hover:bg-slate-800 text-slate-200 border border-brand-dark font-semibold text-[10px] py-2 rounded transition-all tracking-wider cursor-pointer uppercase font-mono"
          >
            POBIERZ DETALE
          </button>

          <button
            onClick={() => onGroupAction("SZUKAJ PODOBNE")}
            className="btn btn-secondary bg-[#1C1C21] hover:bg-slate-800 text-slate-200 border border-brand-dark font-semibold text-[10px] py-2 rounded transition-all tracking-wider cursor-pointer uppercase font-mono"
          >
            SZUKAJ PODOBNE
          </button>

          <button
            onClick={() => onGroupAction("ANALIZUJ BRAND")}
            className="btn btn-secondary bg-[#1C1C21] hover:bg-slate-800 text-slate-200 border border-brand-dark font-semibold text-[10px] py-2 rounded transition-all tracking-wider cursor-pointer uppercase font-mono"
          >
            ANALIZUJ BRAND
          </button>

          <button
            onClick={() => onGroupAction("NAJLEPSZA OFERTA")}
            className="btn btn-secondary bg-[#1C1C21] hover:bg-slate-800 text-slate-200 border border-brand-dark font-semibold text-[10px] py-2 rounded transition-all tracking-wider cursor-pointer uppercase font-mono"
          >
            NAJLEPSZA OFERTA
          </button>
        </div>
      </div>

    </aside>
  );
}
