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
  totalShortages
}) => {
  const currentTheme = Themes[currentThemeId] || Themes['corporate-navy'];
  const isLight = currentTheme.mode === 'light';

  return (
    <header className={`${currentTheme.headerBg} border-b ${currentTheme.headerBorder} ${currentTheme.headerText} sticky top-0 z-30 shadow-sm transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${currentTheme.logoBg} ${currentTheme.logoText} flex items-center justify-center font-bold shadow-md`}>
              <PackageSearch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight">
                  Export Priority & WO Planner
                </h1>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder} px-2 py-0.5 rounded-full`}>
                  Power Query
                </span>
              </div>
              <p className="text-xs opacity-80 hidden sm:block">
                Sydney Export Backorders vs. Work Order Schedule Summary
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Themes Selector Button */}
            <button
              onClick={onOpenThemeSelector}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border shadow-xs transition-all hover:scale-105 active:scale-95 ${
                isLight
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-300 border-amber-500/40 hover:from-amber-500/30'
              }`}
              title={`Select from ${Object.keys(Themes).length} visual app looks`}
            >
              <Palette className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>App Look ({Object.keys(Themes).length} Themes)</span>
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
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Sample Data</span>
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
              <Database className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
              <span>Saved Scenarios</span>
            </button>

            <button
              onClick={onOpenUpload}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/60'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Upload CSVs</span>
            </button>

            <button
              onClick={onOpenAddWo}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/60'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Simulate WO</span>
            </button>

            <button
              onClick={onOpenRequisitions}
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-colors ${currentTheme.accentButtonBg} ${currentTheme.accentButtonHover} ${currentTheme.accentButtonText}`}
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden md:inline">WO Requisitions</span>
              <span className="md:hidden">Reqs</span>
              {totalShortages > 0 && (
                <span className="ml-1 bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                  {totalShortages}
                </span>
              )}
            </button>

            <button
              onClick={onExportCsv}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/60'
              }`}
              title="Export priority list to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Export</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

