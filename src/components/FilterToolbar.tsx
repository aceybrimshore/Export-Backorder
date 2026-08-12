import React, { useState } from 'react';
import { FilterSettings } from '../types';
import { ThemeId, Themes } from '../theme';
import {
  Search,
  Sliders,
  Code2,
  X,
  ChevronDown,
  Info,
  Filter
} from 'lucide-react';

interface FilterToolbarProps {
  filters: FilterSettings;
  onFilterChange: (updated: Partial<FilterSettings>) => void;
  shortageCount: number;
  coveredCount: number;
  totalCount: number;
  currentThemeId: ThemeId;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onFilterChange,
  shortageCount,
  coveredCount,
  totalCount,
  currentThemeId
}) => {
  const currentTheme = Themes[currentThemeId] || Themes['corporate-navy'];
  const isLight = currentTheme.mode === 'light';
  const [showPowerQueryCode, setShowPowerQueryCode] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <div className={`${currentTheme.cardBg} rounded-xl border ${currentTheme.cardBorder} p-4 shadow-sm mb-6 space-y-3 transition-colors`}>
      {/* Top Row: Search + Coverage Status Tabs + Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'opacity-50'}`} />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={e => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search SKU, Description, Customer, SO#, WO#..."
            className={`w-full pl-9 pr-8 py-2 text-xs font-medium rounded-lg border focus:outline-none focus:ring-2 transition-all ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500/30 focus:border-blue-600'
                : 'bg-slate-800/80 border-slate-700/80 text-white placeholder:text-slate-500 focus:ring-amber-500/50'
            }`}
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Coverage Status Segmented Control */}
        <div className={`flex items-center p-1 rounded-lg text-xs font-semibold self-start md:self-auto border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
        }`}>
          <button
            onClick={() => onFilterChange({ coverageFilter: 'ALL' })}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filters.coverageFilter === 'ALL'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                  : `${currentTheme.priorityBadgeBg} ${currentTheme.priorityBadgeText} font-bold shadow-sm border border-slate-700/50`
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'opacity-70 hover:opacity-100'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => onFilterChange({ coverageFilter: 'NEED_MORE_WOS' })}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              filters.coverageFilter === 'NEED_MORE_WOS'
                ? isLight
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : `${currentTheme.accentButtonBg} ${currentTheme.accentButtonText} font-bold shadow-sm`
                : isLight ? 'text-amber-800 hover:text-amber-900' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            Need More WOs
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                filters.coverageFilter === 'NEED_MORE_WOS'
                  ? 'bg-slate-950 text-amber-300'
                  : isLight ? 'bg-amber-200 text-amber-900' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {shortageCount}
            </span>
          </button>
          <button
            onClick={() => onFilterChange({ coverageFilter: 'COVERED' })}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              filters.coverageFilter === 'COVERED'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'opacity-70 hover:opacity-100'
            }`}
          >
            Covered
            <span className="text-[10px] opacity-80">({coveredCount})</span>
          </button>
        </div>

        {/* Filter Controls Toggle & M-Code Inspector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
              showAdvancedFilters
                ? isLight ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-800 text-white border-slate-700'
                : isLight ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50' : 'bg-slate-800/40 text-inherit border-slate-700/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-amber-500" />
            <span>Power Query Pipeline</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showAdvancedFilters ? 'rotate-180' : ''
              }`}
            />
          </button>

          <button
            onClick={() => setShowPowerQueryCode(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
              isLight
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel M-Code Rules</span>
          </button>
        </div>
      </div>

      {/* Second Row: Granular Filters & Sorting Bar */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t text-xs ${
        isLight ? 'border-slate-200' : 'border-slate-700/40'
      }`}>
        {/* Sort By */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Sort Order
          </label>
          <select
            value={filters.sortBy}
            onChange={e => onFilterChange({ sortBy: e.target.value as any })}
            className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border focus:outline-none focus:ring-2 transition-all ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 focus:ring-blue-500/30'
                : 'bg-slate-900 border-slate-700 text-slate-200 focus:ring-amber-500/50'
            }`}
          >
            <option value="DEFAULT">Default (Req Date + Qty)</option>
            <option value="BO_VALUE_DESC">Highest BO Value ($)</option>
            <option value="BO_QTY_DESC">Highest BO Qty (Units)</option>
            <option value="SHORTAGE_DESC">Largest WO Shortage</option>
            <option value="REQ_DATE_ASC">Earliest Req Date</option>
            <option value="SKU_ASC">SKU Name (A-Z)</option>
          </select>
        </div>

        {/* Urgency Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Date Urgency
          </label>
          <select
            value={filters.urgencyFilter}
            onChange={e => onFilterChange({ urgencyFilter: e.target.value as any })}
            className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border focus:outline-none focus:ring-2 transition-all ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 focus:ring-blue-500/30'
                : 'bg-slate-900 border-slate-700 text-slate-200 focus:ring-amber-500/50'
            }`}
          >
            <option value="ALL">All Dates</option>
            <option value="OVERDUE">Overdue Only</option>
            <option value="CRITICAL">Critical (&le; 7 Days)</option>
            <option value="NORMAL">Normal (&gt; 7 Days)</option>
          </select>
        </div>

        {/* Timing Conflict */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            WO Timing
          </label>
          <select
            value={filters.timingConflictFilter}
            onChange={e => onFilterChange({ timingConflictFilter: e.target.value as any })}
            className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border focus:outline-none focus:ring-2 transition-all ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 focus:ring-blue-500/30'
                : 'bg-slate-900 border-slate-700 text-slate-200 focus:ring-amber-500/50'
            }`}
          >
            <option value="ALL">All Timing</option>
            <option value="CONFLICT_ONLY">Late WOs Only</option>
            <option value="NO_CONFLICT">On-Time / No Conflict</option>
          </select>
        </div>

        {/* Min BO Value */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Min BO Value ($)
          </label>
          <select
            value={filters.minBOValue}
            onChange={e => onFilterChange({ minBOValue: Number(e.target.value) })}
            className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border focus:outline-none focus:ring-2 transition-all ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 focus:ring-blue-500/30'
                : 'bg-slate-900 border-slate-700 text-slate-200 focus:ring-amber-500/50'
            }`}
          >
            <option value={0}>All Values ($0+)</option>
            <option value={1000}>$1,000+</option>
            <option value={5000}>$5,000+</option>
            <option value={10000}>$10,000+</option>
            <option value={25000}>$25,000+</option>
          </select>
        </div>

        {/* Netstock Indicator */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Netstock Code
          </label>
          <input
            type="text"
            value={filters.netstockFilter === 'ALL' ? '' : filters.netstockFilter}
            onChange={e => onFilterChange({ netstockFilter: e.target.value || 'ALL' })}
            placeholder="e.g. HI, LO, AMBER"
            className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border focus:outline-none focus:ring-2 transition-all ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:ring-blue-500/30'
                : 'bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-amber-500/50'
            }`}
          />
        </div>

        {/* Reset Filters Action */}
        <div className="flex flex-col justify-end">
          <button
            onClick={() => onFilterChange({
              coverageFilter: 'ALL',
              urgencyFilter: 'ALL',
              timingConflictFilter: 'ALL',
              minBOValue: 0,
              netstockFilter: 'ALL',
              customerFilter: 'ALL',
              sortBy: 'DEFAULT',
              searchQuery: ''
            })}
            className={`w-full py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Reset all search, sorting, and granular filters"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Active Rules Badges Summary */}
      <div className={`flex flex-wrap items-center gap-2 pt-2 border-t text-[11px] font-medium ${
        isLight ? 'border-slate-200 text-slate-600' : 'border-slate-700/40 opacity-80'
      }`}>
        <span className="font-bold flex items-center gap-1 text-slate-800 dark:text-slate-200">
          <Filter className="w-3 h-3 text-amber-500" /> Power Query Active Rules:
        </span>
        <span className={`px-2 py-0.5 rounded border font-mono ${
          isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
        }`}>
          Location: "{filters.locationPrefix}"
        </span>
        <span className={`px-2 py-0.5 rounded border font-mono ${
          isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
        }`}>
          Brand: "{filters.brand}"
        </span>
        <span className={`px-2 py-0.5 rounded border font-mono ${
          isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
        }`}>
          Type: "{filters.type}"
        </span>
        <span className={`px-2 py-0.5 rounded border font-mono ${
          isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
        }`}>
          Status != Pending
        </span>
        <span className={`px-2 py-0.5 rounded border font-mono ${
          isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
        }`}>
          BO Qty &gt; 0
        </span>
      </div>

      {/* Expandable Power Query Rule Settings */}
      {showAdvancedFilters && (
        <div className={`p-3 rounded-lg border text-xs space-y-3 mt-2 animate-in fade-in duration-150 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800/40 border-slate-700/60'
        }`}>
          <div className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-white">
            <Info className="w-4 h-4 text-amber-500" />
            <span>Power Query Pipeline Parameters (Modify Rule Logic On-The-Fly)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:opacity-70 mb-1">
                Location Prefix
              </label>
              <input
                type="text"
                value={filters.locationPrefix}
                onChange={e => onFilterChange({ locationPrefix: e.target.value })}
                className={`w-full px-2.5 py-1.5 text-xs font-medium rounded border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-inherit'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:opacity-70 mb-1">
                Target Brand
              </label>
              <input
                type="text"
                value={filters.brand}
                onChange={e => onFilterChange({ brand: e.target.value })}
                className={`w-full px-2.5 py-1.5 text-xs font-medium rounded border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-inherit'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:opacity-70 mb-1">
                Assembly Type
              </label>
              <input
                type="text"
                value={filters.type}
                onChange={e => onFilterChange({ type: e.target.value })}
                className={`w-full px-2.5 py-1.5 text-xs font-medium rounded border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-inherit'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="excludePending"
                checked={filters.excludePendingApproval}
                onChange={e => onFilterChange({ excludePendingApproval: e.target.checked })}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <label
                htmlFor="excludePending"
                className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Exclude "Pending Approval"
              </label>
            </div>
          </div>
        </div>
      )}

      {/* M-Code Inspection Modal */}
      {showPowerQueryCode && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Power Query M-Code Logic Implemented
                </h3>
              </div>
              <button
                onClick={() => setShowPowerQueryCode(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              This app faithfully executes Allan's original Excel Power Query pipeline:
            </p>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-80 leading-relaxed">
{`let
    #"Filtered Rows" = Table.SelectRows(Source, each 
        [Status] <> "Pending Approval" and 
        Text.StartsWith([Location], "Sydney") and 
        [Back Order Qty] > 0 and 
        [Brand] = "Rhino-Rack" and 
        [#"Type"] = "Assembly/Bill of Materials"),

    #"Grouped Items" = Table.Group(#"Filtered Rows", {"Item"}, {
        {"Customer Name", each Text.Combine(List.Distinct([Customer Name]), ", ")},
        {"Sales Orders", each Text.Combine(List.Distinct([Sales Order Number]), ", ")},
        {"Description", each List.First([Description])},
        {"Netstock Indicator", each List.First([Netstock Stocking Indicator Sydney])},
        {"Total BO Qty", each List.Sum([Back Order Qty])},
        {"Total BO Value", each List.Sum([Back Order Value])},
        {"Earliest Stock Required By", each List.Min([Stock Required by])},
        {"Earliest Ship Date", each List.Min([Expected Ship Date])}
    }),

    #"Sorted Rows" = Table.Sort(#"Grouped Items", {
        {"Earliest Stock Required By", Order.Ascending},
        {"Total BO Qty", Order.Descending}
    }),

    #"Added Priority" = Table.AddIndexColumn(#"Sorted Rows", "Priority", 1, 1),
    
    #"Merged Schedule Summary" = Table.NestedJoin(..., {"Item"}, #"Schedule Summary", {"Part #"}, ...),
    
    #"Coverage Balance" = if [Scheduled Qty] = null then -[Total BO Qty] else [Scheduled Qty] - [Total BO Qty],
    #"Coverage Status" = if [Coverage Balance] < 0 then "Need More WOs" else "Covered"
in
    #"Added Custom1"`}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPowerQueryCode(false)}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

