import React from 'react';
import { ProcessedPriorityItem } from '../types';
import { ThemeId, Themes } from '../theme';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Clock,
  Layers
} from 'lucide-react';

interface KPICardsProps {
  items: ProcessedPriorityItem[];
  currentThemeId: ThemeId;
}

export const KPICards: React.FC<KPICardsProps> = ({ items, currentThemeId }) => {
  const currentTheme = Themes[currentThemeId] || Themes['corporate-navy'];
  const isLight = currentTheme.mode === 'light';

  const totalItems = items.length;
  const totalBOUnits = items.reduce((acc, item) => acc + item.totalBOQty, 0);
  const totalBOValue = items.reduce((acc, item) => acc + item.totalBOValue, 0);

  const shortages = items.filter(item => item.coverageStatus === 'Need More WOs');
  const covered = items.filter(item => item.coverageStatus === 'Covered');
  const timingConflicts = items.filter(item => item.timingConflict);
  const overdueCount = items.filter(item => item.urgencyLevel === 'Overdue');

  const totalShortageQty = shortages.reduce(
    (acc, item) => acc + Math.abs(item.coverageBalance),
    0
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 my-6">
      {/* 1. Total Priority SKUs */}
      <div className={`${currentTheme.cardBg} rounded-xl border ${currentTheme.cardBorder} p-4 shadow-sm flex flex-col justify-between transition-colors`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${currentTheme.cardTextHeader}`}>
            Export Assembly SKUs
          </span>
          <div className={`p-2 rounded-lg ${currentTheme.badgeBg} ${currentTheme.badgeText}`}>
            <Boxes className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-extrabold ${currentTheme.cardTextValue}`}>
            {totalItems} <span className="text-xs font-normal opacity-70">Items</span>
          </div>
          <div className={`text-xs mt-1 flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <Layers className="w-3 h-3" />
            <span>Grouped from Sydney backorders</span>
          </div>
        </div>
      </div>

      {/* 2. Total Backorder Value & Volume */}
      <div className={`${currentTheme.cardBg} rounded-xl border ${currentTheme.cardBorder} p-4 shadow-sm flex flex-col justify-between transition-colors`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${currentTheme.cardTextHeader}`}>
            Total Backorder Value
          </span>
          <div className={`p-2 rounded-lg ${isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-extrabold ${currentTheme.cardTextValue}`}>
            ${totalBOValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <span className="font-bold opacity-90">
              {totalBOUnits.toLocaleString()}
            </span>{' '}
            total units required
          </div>
        </div>
      </div>

      {/* 3. Shortages (Need More WOs) */}
      <div className={`rounded-xl border ${currentTheme.shortageBorder} ${currentTheme.shortageCardBg} p-4 shadow-sm flex flex-col justify-between transition-colors`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${currentTheme.shortageText}`}>
            WO Shortage SKUs
          </span>
          <div className={`p-2 rounded-lg ${isLight ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-500/20 text-amber-300'}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-extrabold ${currentTheme.shortageText}`}>
            {shortages.length}{' '}
            <span className="text-xs font-medium opacity-80">
              ({totalShortageQty.toLocaleString()} units short)
            </span>
          </div>
          <div className={`text-xs font-semibold mt-1 ${currentTheme.shortageText}`}>
            Action: Create new Work Orders
          </div>
        </div>
      </div>

      {/* 4. Covered Items */}
      <div className={`${currentTheme.cardBg} rounded-xl border ${currentTheme.coveredBorder} p-4 shadow-sm flex flex-col justify-between transition-colors`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
            WO Covered SKUs
          </span>
          <div className={`p-2 rounded-lg ${isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-extrabold ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
            {covered.length}{' '}
            <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'opacity-60'}`}>
              / {totalItems}
            </span>
          </div>
          <div className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'opacity-60'}`}>
            Scheduled WO quantity ≥ Backorder Qty
          </div>
        </div>
      </div>

      {/* 5. Schedule & Timing Alerts */}
      <div className={`${currentTheme.cardBg} rounded-xl border ${isLight ? 'border-rose-300 bg-rose-50/40' : 'border-rose-500/40'} p-4 shadow-sm flex flex-col justify-between transition-colors`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-rose-800' : 'text-rose-400'}`}>
            Timing Conflicts
          </span>
          <div className={`p-2 rounded-lg ${isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-400'}`}>
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-extrabold ${isLight ? 'text-rose-800' : 'text-rose-400'}`}>
            {timingConflicts.length}
            {overdueCount.length > 0 && (
              <span className={`text-xs font-medium ml-1.5 ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                ({overdueCount.length} overdue)
              </span>
            )}
          </div>
          <div className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'opacity-60'}`}>
            WO Start date is after Stock Required date
          </div>
        </div>
      </div>
    </div>
  );
};

