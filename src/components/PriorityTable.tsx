import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProcessedPriorityItem } from '../types';
import { ThemeId, Themes } from '../theme';
import { parseFlexibleDate } from '../utils/pipeline';
import {
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  Clock,
  Building2,
  Maximize2,
  Minimize2,
  Sparkles,
  Columns,
  RotateCcw
} from 'lucide-react';

interface PriorityTableProps {
  items: ProcessedPriorityItem[];
  onSelectItem: (item: ProcessedPriorityItem) => void;
  onOpenSimulateWo: (item: ProcessedPriorityItem) => void;
  onMovePriority: (itemCode: string, direction: 'UP' | 'DOWN') => void;
  currentThemeId: ThemeId;
  isWideCanvas?: boolean;
  onToggleWideCanvas?: () => void;
}

export type TableColumnKey =
  | 'priority'
  | 'item'
  | 'netstock'
  | 'boQty'
  | 'boValue'
  | 'reqDate'
  | 'shipDate'
  | 'woSchedule'
  | 'woQty'
  | 'balance'
  | 'status'
  | 'actions';

type SortColumn =
  | 'priority'
  | 'item'
  | 'netstock'
  | 'boQty'
  | 'boValue'
  | 'reqDate'
  | 'shipDate'
  | 'woSchedule'
  | 'woQty'
  | 'balance'
  | 'status';

const DEFAULT_WIDTHS_COMPACT: Record<TableColumnKey, number> = {
  priority: 56,
  item: 280,
  netstock: 90,
  boQty: 100,
  boValue: 110,
  reqDate: 125,
  shipDate: 110,
  woSchedule: 210,
  woQty: 90,
  balance: 80,
  status: 120,
  actions: 80
};

const DEFAULT_WIDTHS_COMFORTABLE: Record<TableColumnKey, number> = {
  priority: 70,
  item: 350,
  netstock: 130,
  boQty: 110,
  boValue: 135,
  reqDate: 140,
  shipDate: 130,
  woSchedule: 240,
  woQty: 100,
  balance: 95,
  status: 140,
  actions: 95
};

const MIN_WIDTHS: Record<TableColumnKey, number> = {
  priority: 45,
  item: 140,
  netstock: 60,
  boQty: 70,
  boValue: 70,
  reqDate: 85,
  shipDate: 85,
  woSchedule: 120,
  woQty: 65,
  balance: 65,
  status: 85,
  actions: 65
};

export const PriorityTable: React.FC<PriorityTableProps> = ({
  items,
  onSelectItem,
  onOpenSimulateWo,
  onMovePriority,
  currentThemeId,
  isWideCanvas = false,
  onToggleWideCanvas
}) => {
  const currentTheme = Themes[currentThemeId] || Themes['corporate-navy'];
  const isLight = currentTheme.mode === 'light';

  // Density mode state: 'compact' (fits screen, minimal scroll) or 'comfortable'
  const [density, setDensity] = useState<'compact' | 'comfortable'>(() => {
    return (localStorage.getItem('rhino_table_density') as 'compact' | 'comfortable') || 'compact';
  });

  const isCompact = density === 'compact';

  // Column widths state with localStorage persistence
  const [customWidths, setCustomWidths] = useState<Partial<Record<TableColumnKey, number>>>(() => {
    try {
      const saved = localStorage.getItem('rhino_table_column_widths_v3');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Current effective widths combining defaults with user customizations
  const columnWidths = useMemo(() => {
    const defaults = isCompact ? DEFAULT_WIDTHS_COMPACT : DEFAULT_WIDTHS_COMFORTABLE;
    return { ...defaults, ...customWidths };
  }, [isCompact, customWidths]);

  const [activeResizingColumn, setActiveResizingColumn] = useState<TableColumnKey | null>(null);
  const resizingRef = useRef<{
    column: TableColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Column visibility settings
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    netstock: true,
    boValue: true,
    shipDate: true,
    woQty: true,
    customer: true
  });

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleDensity = () => {
    setDensity(prev => {
      const next = prev === 'compact' ? 'comfortable' : 'compact';
      localStorage.setItem('rhino_table_density', next);
      return next;
    });
  };

  // Reset all column sizes to default
  const handleResetColumnWidths = () => {
    setCustomWidths({});
    localStorage.removeItem('rhino_table_column_widths_v3');
  };

  // Reset a single column size to default
  const handleResetSingleColumn = (columnKey: TableColumnKey) => {
    setCustomWidths(prev => {
      const next = { ...prev };
      delete next[columnKey];
      localStorage.setItem('rhino_table_column_widths_v3', JSON.stringify(next));
      return next;
    });
  };

  // Drag resizer handler
  const handleStartResize = (e: React.MouseEvent, columnKey: TableColumnKey) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const currentWidth = columnWidths[columnKey] || (isCompact ? DEFAULT_WIDTHS_COMPACT[columnKey] : DEFAULT_WIDTHS_COMFORTABLE[columnKey]);

    resizingRef.current = {
      column: columnKey,
      startX,
      startWidth: currentWidth
    };
    setActiveResizingColumn(columnKey);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = moveEvent.clientX - resizingRef.current.startX;
      const minW = MIN_WIDTHS[resizingRef.current.column] || 50;
      const newWidth = Math.max(minW, Math.round(resizingRef.current.startWidth + delta));

      setCustomWidths(prev => {
        const next = { ...prev, [resizingRef.current!.column]: newWidth };
        return next;
      });
    };

    const handleMouseUp = () => {
      if (resizingRef.current) {
        setCustomWidths(latest => {
          localStorage.setItem('rhino_table_column_widths_v3', JSON.stringify(latest));
          return latest;
        });
      }
      resizingRef.current = null;
      setActiveResizingColumn(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Sorting State
  const [sortColumn, setSortColumn] = useState<SortColumn>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleHeaderClick = (column: SortColumn) => {
    // Prevent sort trigger if user was resizing
    if (activeResizingColumn) return;

    if (sortColumn === column) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      if (['boQty', 'boValue', 'woQty', 'balance'].includes(column)) {
        setSortDir('desc');
      } else {
        setSortDir('asc');
      }
    }
  };

  const sortedItems = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => {
      let res = 0;
      switch (sortColumn) {
        case 'priority':
          res = a.priority - b.priority;
          break;
        case 'item':
          res = a.item.localeCompare(b.item);
          break;
        case 'netstock':
          res = a.netstockIndicator.localeCompare(b.netstockIndicator);
          break;
        case 'boQty':
          res = a.totalBOQty - b.totalBOQty;
          break;
        case 'boValue':
          res = a.totalBOValue - b.totalBOValue;
          break;
        case 'reqDate': {
          const dA = parseFlexibleDate(a.earliestStockRequiredBy)?.getTime() || 0;
          const dB = parseFlexibleDate(b.earliestStockRequiredBy)?.getTime() || 0;
          res = dA - dB;
          break;
        }
        case 'shipDate': {
          const dA = parseFlexibleDate(a.earliestShipDate)?.getTime() || 0;
          const dB = parseFlexibleDate(b.earliestShipDate)?.getTime() || 0;
          res = dA - dB;
          break;
        }
        case 'woSchedule': {
          const dA = parseFlexibleDate(a.earliestWOStart)?.getTime() || 9999999999999;
          const dB = parseFlexibleDate(b.earliestWOStart)?.getTime() || 9999999999999;
          res = dA - dB;
          break;
        }
        case 'woQty':
          res = a.scheduledQty - b.scheduledQty;
          break;
        case 'balance':
          res = a.coverageBalance - b.coverageBalance;
          break;
        case 'status':
          res = a.coverageStatus.localeCompare(b.coverageStatus);
          break;
      }
      return sortDir === 'asc' ? res : -res;
    });
    return list;
  }, [items, sortColumn, sortDir]);

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-500 dark:text-amber-400 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-500 dark:text-amber-400 font-bold" />
    );
  };

  const renderResizeHandle = (columnKey: TableColumnKey) => {
    const isThisResizing = activeResizingColumn === columnKey;
    return (
      <div
        onMouseDown={(e) => handleStartResize(e, columnKey)}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleResetSingleColumn(columnKey);
        }}
        className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center z-20 group/resizer transition-colors select-none ${
          isThisResizing
            ? 'bg-blue-500/30 dark:bg-blue-400/30'
            : 'hover:bg-blue-500/20 dark:hover:bg-blue-400/20'
        }`}
        title="Drag right edge to resize column. Double-click to reset width."
      >
        <div
          className={`w-[2px] transition-all rounded-full ${
            isThisResizing
              ? 'h-full bg-blue-600 dark:bg-blue-400 shadow-xs'
              : 'h-4 bg-slate-400/50 dark:bg-slate-500/50 group-hover/resizer:h-full group-hover/resizer:bg-blue-500'
          }`}
        />
      </div>
    );
  };

  const hasCustomWidths = Object.keys(customWidths).length > 0;

  if (items.length === 0) {
    return (
      <div className={`${currentTheme.cardBg} rounded-xl border ${currentTheme.cardBorder} p-12 text-center my-6 transition-colors shadow-sm`}>
        <div className={`w-12 h-12 rounded-full ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'} flex items-center justify-center mx-auto mb-3`}>
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className={`text-base font-bold ${currentTheme.cardTextValue}`}>
          No Priority Items Found
        </h3>
        <p className="text-xs opacity-70 mt-1 max-w-md mx-auto">
          No backorder records match the current filter criteria (Sydney, Rhino-Rack, Assembly/BOM). Try adjusting search terms or pipeline parameters.
        </p>
      </div>
    );
  }

  return (
    <div className={`${currentTheme.cardBg} rounded-xl border ${currentTheme.cardBorder} shadow-sm overflow-hidden my-6 transition-colors`}>
      {/* Table Control Bar */}
      <div className={`px-4 py-2.5 border-b ${currentTheme.cardBorder} flex flex-wrap items-center justify-between gap-2.5 bg-black/[0.02] dark:bg-white/[0.02]`}>
        <div className="flex items-center gap-2">
          <h2 className={`text-xs sm:text-sm font-bold tracking-tight ${currentTheme.cardTextValue} flex items-center gap-1.5`}>
            <span>Priority Schedule</span>
            <span className={`text-[11px] font-semibold px-2 py-0.2 rounded-full ${
              isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
            }`}>
              {items.length} items
            </span>
          </h2>

          {hasCustomWidths && (
            <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-900/30 text-blue-300 border-blue-800'
            }`}>
              Custom column sizes saved
            </span>
          )}
        </div>

        {/* View / Screen Fit & Column Options */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Reset column widths button if modified */}
          {hasCustomWidths && (
            <button
              onClick={handleResetColumnWidths}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border font-medium text-[11px] transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Reset all column widths back to default"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span className="hidden lg:inline">Reset Widths</span>
            </button>
          )}

          {/* Fit Screen / Density Toggle */}
          <button
            onClick={handleToggleDensity}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-semibold transition-all ${
              isCompact
                ? isLight
                  ? 'bg-blue-50 text-blue-800 border-blue-200 shadow-2xs'
                  : 'bg-blue-900/30 text-blue-300 border-blue-700/50'
                : isLight
                ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={isCompact ? 'Currently in Compact Fit-Screen mode. Click for spacious view' : 'Click to enable Compact Fit-Screen mode'}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>{isCompact ? 'Fit Screen: ON' : 'Fit Screen: OFF'}</span>
          </button>

          {/* Full Width Toggle */}
          {onToggleWideCanvas && (
            <button
              onClick={onToggleWideCanvas}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-semibold transition-all ${
                isWideCanvas
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50'
                  : isLight
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={isWideCanvas ? 'Wide canvas mode active (maximum screen real estate)' : 'Enable wide screen canvas mode'}
            >
              {isWideCanvas ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isWideCanvas ? 'Wide View' : 'Boxed View'}</span>
            </button>
          )}

          {/* Column Visibility Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowColumnsMenu(prev => !prev)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-semibold transition-all ${
                showColumnsMenu
                  ? isLight
                    ? 'bg-slate-200 text-slate-900 border-slate-400'
                    : 'bg-slate-700 text-white border-slate-600'
                  : isLight
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Show or hide table columns"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Columns</span>
            </button>

            {showColumnsMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowColumnsMenu(false)}
                />
                <div className={`absolute right-0 mt-1 w-52 rounded-lg shadow-xl border z-50 p-2 space-y-1 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}>
                  <div className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 opacity-60">
                    Toggle Columns
                  </div>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={visibleColumns.netstock}
                      onChange={() => toggleColumn('netstock')}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>Netstock Indicator</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={visibleColumns.boValue}
                      onChange={() => toggleColumn('boValue')}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>BO Dollar Value</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={visibleColumns.shipDate}
                      onChange={() => toggleColumn('shipDate')}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>Expected Ship Date</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={visibleColumns.woQty}
                      onChange={() => toggleColumn('woQty')}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>WO Scheduled Qty</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={visibleColumns.customer}
                      onChange={() => toggleColumn('customer')}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>Customer Details</span>
                  </label>

                  {hasCustomWidths && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => {
                          handleResetColumnWidths();
                          setShowColumnsMenu(false);
                        }}
                        className="w-full text-left flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset All Column Sizes</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className={`${currentTheme.tableHeaderBg} ${currentTheme.tableHeaderText} text-[11px] font-bold uppercase tracking-wider border-b ${currentTheme.tableBorder} select-none`}>
              {/* Priority */}
              <th
                style={{ width: `${columnWidths.priority}px`, minWidth: `${MIN_WIDTHS.priority}px` }}
                onClick={() => handleHeaderClick('priority')}
                className={`${isCompact ? 'py-2.5 px-2' : 'py-3.5 px-3'} relative text-center whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group`}
                title="Click to sort by Priority Rank. Drag right border to resize."
              >
                <div className="flex items-center justify-center gap-0.5 pr-1">
                  <span>#</span>
                  {renderSortIcon('priority')}
                </div>
                {renderResizeHandle('priority')}
              </th>

              {/* Item SKU & Description */}
              <th
                style={{ width: `${columnWidths.item}px`, minWidth: `${MIN_WIDTHS.item}px` }}
                onClick={() => handleHeaderClick('item')}
                className={`${isCompact ? 'py-2.5 px-3' : 'py-3.5 px-4'} relative whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group`}
                title="Click to sort alphabetically by SKU. Drag right border to resize."
              >
                <div className="flex items-center gap-1.5 pr-2">
                  <span className="truncate">Item SKU & Description</span>
                  {renderSortIcon('item')}
                </div>
                {renderResizeHandle('item')}
              </th>

              {/* Netstock */}
              {visibleColumns.netstock && (
                <th
                  style={{ width: `${columnWidths.netstock}px`, minWidth: `${MIN_WIDTHS.netstock}px` }}
                  onClick={() => handleHeaderClick('netstock')}
                  className={`${isCompact ? 'py-2.5 px-2' : 'py-3.5 px-3'} relative whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group`}
                  title="Click to sort by Netstock Indicator. Drag right border to resize."
                >
                  <div className="flex items-center gap-1 pr-2">
                    <span className="truncate">Netstock</span>
                    {renderSortIcon('netstock')}
                  </div>
                  {renderResizeHandle('netstock')}
                </th>
              )}

              {/* BO Qty (& Value combined in compact) */}
              <th
                style={{ width: `${columnWidths.boQty}px`, minWidth: `${MIN_WIDTHS.boQty}px` }}
                onClick={() => handleHeaderClick('boQty')}
                className={`${isCompact ? 'py-2.5 px-2.5' : 'py-3.5 px-3'} relative text-right whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group`}
                title="Click to sort by Backorder Quantity. Drag right border to resize."
              >
                <div className="flex items-center justify-end gap-1 pr-2">
                  <span className="truncate">{isCompact && visibleColumns.boValue ? 'BO Qty/Val' : 'BO Qty'}</span>
                  {renderSortIcon('boQty')}
                </div>
                {renderResizeHandle('boQty')}
              </th>

              {/* BO Value (Separate in comfortable mode) */}
              {(!isCompact || !visibleColumns.boValue) && visibleColumns.boValue && (
                <th
                  style={{ width: `${columnWidths.boValue}px`, minWidth: `${MIN_WIDTHS.boValue}px` }}
                  onClick={() => handleHeaderClick('boValue')}
                  className="py-3.5 px-3 relative text-right whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                  title="Click to sort by Backorder Dollar Value. Drag right border to resize."
                >
                  <div className="flex items-center justify-end gap-1 pr-2">
                    <span className="truncate">BO Value</span>
                    {renderSortIcon('boValue')}
                  </div>
                  {renderResizeHandle('boValue')}
                </th>
              )}

              {/* Required Date (& Ship date combined in compact) */}
              <th
                style={{ width: `${columnWidths.reqDate}px`, minWidth: `${MIN_WIDTHS.reqDate}px` }}
                onClick={() => handleHeaderClick('reqDate')}
                className={`${isCompact ? 'py-2.5 px-2.5' : 'py-3.5 px-3'} relative whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group`}
                title="Click to sort by Earliest Required Date. Drag right border to resize."
              >
                <div className="flex items-center gap-1 pr-2">
                  <span className="truncate">{isCompact && visibleColumns.shipDate ? 'Req / Ship' : 'Req Date'}</span>
                  {renderSortIcon('reqDate')}
                </div>
                {renderResizeHandle('reqDate')}
              </th>

              {/* Ship Date (Separate in comfortable mode) */}
              {!isCompact && visibleColumns.shipDate && (
                <th
                  style={{ width: `${columnWidths.shipDate}px`, minWidth: `${MIN_WIDTHS.shipDate}px` }}
                  onClick={() => handleHeaderClick('shipDate')}
                  className="py-3.5 px-3 relative whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                  title="Click to sort by Earliest Ship Date. Drag right border to resize."
                >
                  <div className="flex items-center gap-1 pr-2">
                    <span className="truncate">Ship Date</span>
                    {renderSortIcon('shipDate')}
                  </div>
                  {renderResizeHandle('shipDate')}
                </th>
              )}

              {/* WO Schedule (& Qty combined in compact) */}
              <th
                style={{ width: `${columnWidths.woSchedule}px`, minWidth: `${MIN_WIDTHS.woSchedule}px` }}
                onClick={() => handleHeaderClick('woSchedule')}
                className={`${isCompact ? 'py-2.5 px-2.5' : 'py-3.5 px-4'} relative whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group`}
                title="Click to sort by Work Order Start Date. Drag right border to resize."
              >
                <div className="flex items-center gap-1 pr-2">
                  <span className="truncate">{isCompact && visibleColumns.woQty ? 'WO Schedule & Qty' : 'WO Schedule'}</span>
                  {renderSortIcon('woSchedule')}
                </div>
                {renderResizeHandle('woSchedule')}
              </th>

              {/* WO Qty (Separate in comfortable mode) */}
              {!isCompact && visibleColumns.woQty && (
                <th
                  style={{ width: `${columnWidths.woQty}px`, minWidth: `${MIN_WIDTHS.woQty}px` }}
                  onClick={() => handleHeaderClick('woQty')}
                  className="py-3.5 px-3 relative text-right whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                  title="Click to sort by Scheduled Work Order Qty. Drag right border to resize."
                >
                  <div className="flex items-center justify-end gap-1 pr-2">
                    <span className="truncate">WO Qty</span>
                    {renderSortIcon('woQty')}
                  </div>
                  {renderResizeHandle('woQty')}
                </th>
              )}

              {/* Balance */}
              <th
                style={{ width: `${columnWidths.balance}px`, minWidth: `${MIN_WIDTHS.balance}px` }}
                onClick={() => handleHeaderClick('balance')}
                className={`${isCompact ? 'py-2.5 px-2' : 'py-3.5 px-3'} relative text-right whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group`}
                title="Click to sort by Coverage Balance. Drag right border to resize."
              >
                <div className="flex items-center justify-end gap-1 pr-2">
                  <span className="truncate">Balance</span>
                  {renderSortIcon('balance')}
                </div>
                {renderResizeHandle('balance')}
              </th>

              {/* Status */}
              <th
                style={{ width: `${columnWidths.status}px`, minWidth: `${MIN_WIDTHS.status}px` }}
                onClick={() => handleHeaderClick('status')}
                className={`${isCompact ? 'py-2.5 px-2' : 'py-3.5 px-3'} relative text-center whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group`}
                title="Click to sort by Coverage Status. Drag right border to resize."
              >
                <div className="flex items-center justify-center gap-1 pr-2">
                  <span className="truncate">Status</span>
                  {renderSortIcon('status')}
                </div>
                {renderResizeHandle('status')}
              </th>

              {/* Actions */}
              <th
                style={{ width: `${columnWidths.actions}px`, minWidth: `${MIN_WIDTHS.actions}px` }}
                className={`${isCompact ? 'py-2.5 px-2' : 'py-3.5 px-3'} text-center whitespace-nowrap`}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${currentTheme.tableBorder} ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
            {sortedItems.map((row, idx) => {
              const isShortage = row.coverageStatus === 'Need More WOs';
              const isOverdue = row.urgencyLevel === 'Overdue';
              const isCritical = row.urgencyLevel === 'Critical (<= 7d)';

              return (
                <tr
                  key={row.item}
                  className={`${currentTheme.tableRowHover} transition-colors ${
                    isShortage
                      ? isLight
                        ? 'bg-amber-50/60'
                        : 'bg-amber-500/10'
                      : 'bg-transparent'
                  }`}
                >
                  {/* Priority & Reorder Controls */}
                  <td className={`${isCompact ? 'py-2 px-1.5' : 'py-3.5 px-3'} text-center align-middle whitespace-nowrap overflow-hidden`}>
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className={`inline-flex items-center justify-center ${isCompact ? 'min-w-[24px] h-6 text-[11px]' : 'min-w-[28px] h-7 text-xs'} px-1.5 rounded-md ${currentTheme.priorityBadgeBg} ${currentTheme.priorityBadgeText} font-bold shadow-2xs border ${isLight ? 'border-slate-300' : 'border-slate-700'}`}>
                        #{row.priority}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100">
                        <button
                          disabled={idx === 0}
                          onClick={() => onMovePriority(row.item, 'UP')}
                          className="p-0.5 hover:text-blue-600 disabled:opacity-20 transition-colors"
                          title="Move priority up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={idx === sortedItems.length - 1}
                          onClick={() => onMovePriority(row.item, 'DOWN')}
                          className="p-0.5 hover:text-blue-600 disabled:opacity-20 transition-colors"
                          title="Move priority down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Item SKU & Description + Customers */}
                  <td className={`${isCompact ? 'py-2 px-3' : 'py-3.5 px-4'} align-top overflow-hidden`}>
                    <div className={`font-bold ${currentTheme.cardTextValue} ${isCompact ? 'text-xs' : 'text-sm'} font-mono flex items-center gap-1.5`}>
                      <span className={`truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{row.item}</span>
                      <button
                        onClick={() => onSelectItem(row)}
                        className={`shrink-0 ${isLight ? 'text-slate-400 hover:text-blue-600' : 'text-slate-400 hover:text-blue-400'} transition-colors`}
                        title="View full customer & sales order breakdown"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className={`font-medium line-clamp-1 mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} title={row.description}>
                      {row.description}
                    </div>
                    {visibleColumns.customer && row.customerName && (
                      <div className={`text-[10px] flex items-center gap-1 mt-0.5 truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`} title={row.customerName}>
                        <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{row.customerName}</span>
                      </div>
                    )}
                  </td>

                  {/* Netstock Indicator */}
                  {visibleColumns.netstock && (
                    <td className={`${isCompact ? 'py-2 px-2' : 'py-3.5 px-3'} align-top whitespace-nowrap overflow-hidden`}>
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border whitespace-nowrap truncate max-w-full ${
                        isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {isCompact ? row.netstockIndicator.split(' - ')[0] || row.netstockIndicator : row.netstockIndicator}
                      </span>
                    </td>
                  )}

                  {/* Total BO Qty (& Value if in compact mode) */}
                  <td className={`${isCompact ? 'py-2 px-2.5' : 'py-3.5 px-3'} text-right align-top whitespace-nowrap overflow-hidden`}>
                    <div className={`font-bold font-mono ${isCompact ? 'text-xs' : 'text-sm'} ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {row.totalBOQty.toLocaleString()}
                    </div>
                    {isCompact && visibleColumns.boValue && (
                      <div className={`text-[10px] font-mono font-medium mt-0.5 opacity-80 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        ${(row.totalBOValue / 1000).toFixed(1)}k
                      </div>
                    )}
                  </td>

                  {/* Total BO Value (in comfortable mode) */}
                  {(!isCompact || !visibleColumns.boValue) && visibleColumns.boValue && (
                    <td className={`py-3.5 px-3 text-right align-top font-mono text-xs font-bold whitespace-nowrap overflow-hidden ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                      ${row.totalBOValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  )}

                  {/* Earliest Stock Required By (& Ship date if compact) */}
                  <td className={`${isCompact ? 'py-2 px-2.5' : 'py-3.5 px-3'} align-top whitespace-nowrap overflow-hidden`}>
                    <div className="flex items-center gap-1 font-semibold font-mono text-xs truncate">
                      <Calendar className="w-3 h-3 opacity-60 flex-shrink-0" />
                      <span className={`truncate ${
                        isOverdue
                          ? 'text-rose-600 font-bold'
                          : isCritical
                          ? 'text-amber-600 font-bold'
                          : isLight ? 'text-slate-800' : 'text-slate-200'
                      }`}>
                        {row.earliestStockRequiredBy}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {isOverdue && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                          isLight
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          OVERDUE
                        </span>
                      )}
                      {isCritical && !isOverdue && (
                        <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${
                          isLight
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          &le;7d
                        </span>
                      )}
                      {isCompact && visibleColumns.shipDate && row.earliestShipDate && (
                        <span className={`text-[10px] font-mono opacity-70 truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`} title="Earliest Ship Date">
                          Ship: {row.earliestShipDate}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Earliest Ship Date (in comfortable mode) */}
                  {!isCompact && visibleColumns.shipDate && (
                    <td className={`py-3.5 px-3 align-top whitespace-nowrap font-semibold font-mono text-xs overflow-hidden ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {row.earliestShipDate}
                    </td>
                  )}

                  {/* Scheduled Work Orders */}
                  <td className={`${isCompact ? 'py-2 px-2.5' : 'py-3.5 px-4'} align-top overflow-hidden`}>
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-mono text-xs font-bold truncate max-w-full ${isLight ? 'text-slate-900' : 'text-white'}`} title={row.woNumbers}>
                        {row.woNumbers}
                      </span>
                      {isCompact && visibleColumns.woQty && row.scheduledQty > 0 && (
                        <span className={`shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-800 text-slate-200'
                        }`}>
                          Qty: {row.scheduledQty}
                        </span>
                      )}
                    </div>

                    {row.earliestWOStart ? (
                      <div className={`flex items-center gap-1 text-[10px] font-medium mt-0.5 truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="font-mono truncate">{row.earliestWOStart}</span>
                        {row.timingConflict && (
                          <span className={`shrink-0 flex items-center gap-0.5 font-bold ml-1 px-1 py-0.2 rounded text-[9px] ${
                            isLight ? 'bg-rose-100 text-rose-800' : 'text-rose-400 bg-rose-950/60'
                          }`} title="WO Start date is after required date!">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Late
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={`text-[10px] italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        No WO Scheduled
                      </span>
                    )}
                  </td>

                  {/* Scheduled WO Qty (in comfortable mode) */}
                  {!isCompact && visibleColumns.woQty && (
                    <td className={`py-3.5 px-3 text-right align-top font-mono text-xs font-bold whitespace-nowrap overflow-hidden ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {row.scheduledQty.toLocaleString()}
                    </td>
                  )}

                  {/* Coverage Balance */}
                  <td className={`${isCompact ? 'py-2 px-2' : 'py-3.5 px-3'} text-right align-top font-mono ${isCompact ? 'text-xs' : 'text-xs'} font-bold whitespace-nowrap overflow-hidden`}>
                    <span
                      className={
                        row.coverageBalance < 0
                          ? isLight ? 'text-rose-600 font-extrabold' : 'text-rose-400'
                          : row.coverageBalance === 0
                          ? isLight ? 'text-slate-600' : 'text-slate-400'
                          : isLight ? 'text-emerald-700 font-extrabold' : 'text-emerald-400'
                      }
                    >
                      {row.coverageBalance > 0 ? `+${row.coverageBalance}` : row.coverageBalance}
                    </span>
                  </td>

                  {/* Coverage Status Badge */}
                  <td className={`${isCompact ? 'py-2 px-2' : 'py-3.5 px-3'} text-center align-middle whitespace-nowrap overflow-hidden`}>
                    {row.coverageStatus === 'Need More WOs' ? (
                      <span className={`inline-flex items-center justify-center gap-1 ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} font-bold rounded-full shadow-2xs border whitespace-nowrap ${
                        isLight
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        <AlertCircle className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} flex-shrink-0`} />
                        <span>{isCompact ? 'Need WOs' : 'Need More WOs'}</span>
                      </span>
                    ) : (
                      <span className={`inline-flex items-center justify-center gap-1 ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} font-bold rounded-full shadow-2xs border whitespace-nowrap ${
                        isLight
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        <CheckCircle className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} flex-shrink-0`} />
                        <span>Covered</span>
                      </span>
                    )}
                  </td>

                  {/* Quick Action Buttons */}
                  <td className={`${isCompact ? 'py-2 px-1.5' : 'py-3.5 px-3'} text-center align-middle whitespace-nowrap overflow-hidden`}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onOpenSimulateWo(row)}
                        className={`p-1 sm:px-1.5 sm:py-1 rounded-md border font-semibold text-[10px] sm:text-xs flex items-center gap-0.5 transition-all ${
                          isLight
                            ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-blue-500 hover:text-blue-600 shadow-2xs'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-amber-500 hover:text-amber-400'
                        }`}
                        title="Simulate adding new Work Order"
                      >
                        <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="hidden sm:inline">WO</span>
                      </button>

                      <button
                        onClick={() => onSelectItem(row)}
                        className={`p-1 rounded-md border transition-all ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title="View detailed customer orders breakdown"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
