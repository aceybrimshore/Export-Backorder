import React from 'react';
import {
  PackageSearch,
  Upload,
  Download,
  ClipboardList,
  RotateCcw,
  Palette,
  Plus,
  Database
} from 'lucide-react';
import { ThemeId, Themes } from '../theme';

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenRequisitions: () => void;
  onExportCsv: () => void;
  onResetToSample: () => void;
  onOpenAddWo: () => void;
  onOpenThemeSelector: () => void;
  onOpenScenarios: () => void;
  currentThemeId: ThemeId;
  totalShortages: number;
  isWideCanvas?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenUpload,
  onOpenRequisitions,
  onExportCsv,
  onResetToSample,
  onOpenAddWo,
  onOpenThemeSelector,
  onOpenScenarios,
  currentThemeId,
  totalShortages,
  isWideCanvas = false
}) => {
  const currentTheme = Themes[currentThemeId] || Themes['corporate-navy'];
  const isLight = currentTheme.mode === 'light';

  return (
    <header className={`${currentTheme.headerBg} border-b ${currentTheme.headerBorder} ${currentTheme.headerText} sticky top-0 z-30 shadow-xs transition-colors duration-200`}>
      <div className={`${isWideCanvas ? 'max-w-[98%]' : 'max-w-7xl'} mx-auto px-3 sm:px-6 lg:px-8 transition-all duration-200`}>
        <div className="flex items-center justify-between min-h-[4.25rem] py-2 gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${currentTheme.logoBg} ${currentTheme.logoText} flex items-center justify-center font-bold shadow-md shrink-0`}>
              <PackageSearch className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight leading-snug whitespace-nowrap">
                  Export Priority &amp; WO Planner
                </h1>
                <span className={`hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder} px-2 py-0.5 rounded-full shrink-0`}>
                  Power Query
                </span>
              </div>
              <p className="text-xs opacity-80 hidden md:block whitespace-nowrap leading-tight mt-0.5">
                Sydney Export Backorders vs. Work Order Schedule Summary
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Themes Selector Button */}
            <button
              onClick={onOpenThemeSelector}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg border shadow-xs transition-all hover:scale-105 active:scale-95 ${
                isLight
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-300 border-amber-500/40 hover:from-amber-500/30'
              }`}
              title={`Select from ${Object.keys(Themes).length} visual app looks`}
            >
              <Palette className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
              <span className="hidden sm:inline">Look ({Object.keys(Themes).length})</span>
            </button>

            <button
              onClick={onResetToSample}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/60'
              }`}
              title="Reset to sample dataset"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">Sample Data</span>
            </button>

            <button
              onClick={onOpenScenarios}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                isLight
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-blue-500/10 hover:bg-blue-500/20 text-cyan-400 border-cyan-500/20'
              }`}
              title="Manage multiple planner scenarios & backups"
            >
              <Database className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400 shrink-0" />
              <span className="hidden lg:inline">Scenarios</span>
            </button>

            <button
              onClick={onOpenUpload}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/60'
              }`}
              title="Upload CSVs"
            >
              <Upload className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden md:inline">Upload</span>
            </button>

            <button
              onClick={onOpenAddWo}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/60'
              }`}
              title="Simulate Work Order"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Simulate WO</span>
            </button>

            <button
              onClick={onOpenRequisitions}
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0 ${currentTheme.accentButtonBg} ${currentTheme.accentButtonHover} ${currentTheme.accentButtonText}`}
              title="Work Order Requisitions"
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">WO Requisitions</span>
              <span className="md:hidden">Reqs</span>
              {totalShortages > 0 && (
                <span className="ml-0.5 bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                  {totalShortages}
                </span>
              )}
            </button>

            <button
              onClick={onExportCsv}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all shrink-0 ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/60'
              }`}
              title="Export priority list to CSV"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">Export</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

