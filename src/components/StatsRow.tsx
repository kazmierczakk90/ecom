import React from "react";

interface StatsRowProps {
  totalResults: number;
  selectedCount: number;
  avgRoi: number;
  worklistsCount: number;
}

export default function StatsRow({ totalResults, selectedCount, avgRoi, worklistsCount }: StatsRowProps) {
  return (
    <div className="stats-row grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 shrink-0 font-sans">
      
      {/* KPI 1: Total Results */}
      <div className="stat-cell bg-card-dark border border-brand-dark p-3 sm:p-4 rounded-xl flex flex-col justify-center shadow-sm">
        <div className="stat-val text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-mono">
          {totalResults}
        </div>
        <div className="stat-lbl text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
          Wyników
        </div>
      </div>

      {/* KPI 2: Selected */}
      <div className="stat-cell bg-card-dark border border-brand-dark p-3 sm:p-4 rounded-xl flex flex-col justify-center shadow-sm">
        <div className="stat-val text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-emerald-400 font-mono">
          {selectedCount}
        </div>
        <div className="stat-lbl text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
          Zaznaczonych
        </div>
      </div>

      {/* KPI 3: Avg ROI */}
      <div className="stat-cell bg-card-dark border border-brand-dark p-3 sm:p-4 rounded-xl flex flex-col justify-center shadow-sm">
        <div className="stat-val text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-amber-500 font-mono">
          {avgRoi}%
        </div>
        <div className="stat-lbl text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
          Śr. ROI
        </div>
      </div>

      {/* KPI 4: Worklists Count */}
      <div className="stat-cell bg-card-dark border border-brand-dark p-3 sm:p-4 rounded-xl flex flex-col justify-center shadow-sm">
        <div className="stat-val text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-brand-blue font-mono">
          {worklistsCount}
        </div>
        <div className="stat-lbl text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
          Listy robocze
        </div>
      </div>

    </div>
  );
}
