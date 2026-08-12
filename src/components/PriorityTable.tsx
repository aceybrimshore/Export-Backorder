import React, { useState, useMemo } from 'react';
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
  FileText
} from 'lucide-react';

interface PriorityTableProps {
  items: ProcessedPriorityItem[];
  onSelectItem: (item: ProcessedPriorityItem) => void;
  onOpenSimulateWo: (item: ProcessedPriorityItem) => void;
  onMovePriority: (itemCode: string, direction: 'UP' | 'DOWN') => void;
  currentThemeId: ThemeId;
}

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

export const PriorityTable: React.FC<PriorityTableProps> = ({
  items,
  onSelectItem,
  onOpenSimulateWo,
  onMovePriority,
  currentThemeId
}) => {
  const currentTheme = Themes[currentThemeId] || Themes['corporate-navy'];
  const isLight = currentTheme.mode === 'light';

  // Sorting State
  const [sortColumn, setSortColumn] = useState<SortColumn>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleHeaderClick = (column: SortColumn) => {
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
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[1280px] text-left border-collapse">
          <thead>
            <tr className={`${currentTheme.tableHeaderBg} ${currentTheme.tableHeaderText} text-[11px] font-bold uppercase tracking-wider border-b ${currentTheme.tableBorder} select-none`}>
              {/* Priority */}
              <th
                onClick={() => handleHeaderClick('priority')}
                className="py-3.5 px-3 w-20 text-center whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                title="Click to sort by Priority Rank"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Priority</span>
                  {renderSortIcon('priority')}
                </div>
              </th>

              {/* Item SKU & Description */}
              <th
                onClick={() => handleHeaderClick('item')}
                className="py-3.5 px-4 min-w-[240px] whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                title="Click to sort alphabetically by SKU"
              >
                <div className="flex items-center gap-1.5">
                  <span>Item SKU & Description</span>
                  {renderSortIcon('item')}
                </div>
              </th>

              {/* Netstock */}
              <th
                onClick={() => handleHeaderClick('netstock')}
                className="py-3.5 px-3 w-32 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                title="Click to sort by Netstock Indicator"
              >
                <div className="flex items-center gap-1.5">
                  <span>Netstock</span>
                  {renderSortIcon('netstock')}
                </div>
              </th>

              {/* BO Qty */}
              <th
                onClick={() => handleHeaderClick('boQty')}
                className="py-3.5 px-3 text-right w-28 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                title="Click to sort by Backorder Quantity"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>BO Qty</span>
                  {renderSortIcon('boQty')}
                </div>
              </th>

              {/* BO Value */}
              <th
                onClick={() => handleHeaderClick('boValue')}
                className="py-3.5 px-3 text-right w-36 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                title="Click to sort by Backorder Dollar Value"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>BO Value</span>
                  {renderSortIcon('boValue')}
                </div>
              </th>

              {/* Req Date */}
              <th
                onClick={() => handleHeaderClick('reqDate')}
                className="py-3.5 px-3 w-36 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                title="Click to sort by Earliest Required Date"
              >
                <div className="flex items-center gap-1.5">
                  <span>Req Date</span>
                  {renderSortIcon('reqDate')}
                </div>
              </th>

              {/* Ship Date */}
              <th
                onClick={() => handleHeaderClick('shipDate')}
                className="py-3.5 px-3 w-36 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                title="Click to sort by Earliest Ship Date"
              >
                <div className="flex items-center gap-1.5">
                  <span>Ship Date</span>
                  {renderSortIcon('shipDate')}
                </div>
              </th>

              {/* WO Schedule */}
              <th
                onClick={() => handleHeaderClick('woSchedule')}
                className="py-3.5 px-4 min-w-[180px] whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                title="Click to sort by Work Order Start Date"
              >
                <div className="flex items-center gap-1.5">
                  <span>WO Schedule</span>
                  {renderSortIcon('woSchedule')}
                </div>
              </th>

              {/* WO Qty */}
              <th
                onClick={() => handleHeaderClick('woQty')}
                className="py-3.5 px-3 text-right w-28 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                title="Click to sort by Scheduled Work Order Qty"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>WO Qty</span>
                  {renderSortIcon('woQty')}
                </div>
              </th>

              {/* Balance */}
              <th
                onClick={() => handleHeaderClick('balance')}
                className="py-3.5 px-3 text-right w-28 whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                title="Click to sort by Coverage Balance"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Balance</span>
                  {renderSortIcon('balance')}
                </div>
              </th>

              {/* Status */}
              <th
                onClick={() => handleHeaderClick('status')}
                className="py-3.5 px-3 text-center min-w-[150px] whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                title="Click to sort by Coverage Status"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              {/* Actions */}
              <th className="py-3.5 px-3 text-center min-w-[110px] whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${currentTheme.tableBorder} text-xs`}>
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
                  <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-md ${currentTheme.priorityBadgeBg} ${currentTheme.priorityBadgeText} font-bold text-xs shadow-xs border ${isLight ? 'border-slate-300' : 'border-slate-700'}`}>
                        #{row.priority}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-70 hover:opacity-100">
                        <button
                          disabled={idx === 0}
                          onClick={() => onMovePriority(row.item, 'UP')}
                          className="p-0.5 hover:text-blue-600 disabled:opacity-20 transition-colors"
                          title="Move priority up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === sortedItems.length - 1}
                          onClick={() => onMovePriority(row.item, 'DOWN')}
                          className="p-0.5 hover:text-blue-600 disabled:opacity-20 transition-colors"
                          title="Move priority down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Item SKU & Description + Customers */}
                  <td className="py-3.5 px-4 align-top min-w-[240px]">
                    <div className={`font-bold ${currentTheme.cardTextValue} text-sm font-mono flex items-center gap-2`}>
                      <span className={isLight ? 'text-slate-900' : 'text-white'}>{row.item}</span>
                      <button
                        onClick={() => onSelectItem(row)}
                        className={`${isLight ? 'text-slate-400 hover:text-blue-600' : 'text-slate-400 hover:text-blue-400'} transition-colors`}
                        title="View full customer & sales order breakdown"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className={`font-medium line-clamp-1 mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {row.description}
                    </div>
                    <div className={`text-[11px] flex items-center gap-1 mt-1 truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{row.customerName}</span>
                    </div>
                  </td>

                  {/* Netstock Indicator */}
                  <td className="py-3.5 px-3 align-top whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded border whitespace-nowrap ${
                      isLight
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {row.netstockIndicator}
                    </span>
                  </td>

                  {/* Total BO Qty */}
                  <td className={`py-3.5 px-3 text-right align-top font-bold font-mono text-sm whitespace-nowrap ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {row.totalBOQty.toLocaleString()}
                  </td>

                  {/* Total BO Value */}
                  <td className={`py-3.5 px-3 text-right align-top font-mono text-xs font-bold whitespace-nowrap ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                    ${row.totalBOValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Earliest Stock Required By */}
                  <td className="py-3.5 px-3 align-top whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-semibold font-mono text-xs">
                      <Calendar className="w-3.5 h-3.5 opacity-60" />
                      <span className={
                        isOverdue
                          ? 'text-rose-600 font-bold'
                          : isCritical
                          ? 'text-amber-600 font-bold'
                          : isLight ? 'text-slate-800' : 'text-slate-200'
                      }>
                        {row.earliestStockRequiredBy}
                      </span>
                    </div>
                    {isOverdue && (
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isLight
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        OVERDUE
                      </span>
                    )}
                    {isCritical && !isOverdue && (
                      <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isLight
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        Due &le; 7 days
                      </span>
                    )}
                  </td>

                  {/* Earliest Ship Date */}
                  <td className={`py-3.5 px-3 align-top whitespace-nowrap font-semibold font-mono text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {row.earliestShipDate}
                  </td>

                  {/* Scheduled Work Orders */}
                  <td className="py-3.5 px-4 align-top min-w-[180px]">
                    <div className={`font-mono text-xs font-bold truncate max-w-[180px] ${isLight ? 'text-slate-900' : 'text-white'}`} title={row.woNumbers}>
                      {row.woNumbers}
                    </div>
                    {row.earliestWOStart ? (
                      <div className={`flex items-center gap-1 text-[11px] font-medium mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span className="font-mono">{row.earliestWOStart}</span>
                        {row.timingConflict && (
                          <span className={`flex items-center gap-0.5 font-bold ml-1 px-1.5 py-0.2 rounded text-[10px] ${
                            isLight ? 'bg-rose-100 text-rose-800' : 'text-rose-400 bg-rose-950/60'
                          }`} title="WO Start date is after required date!">
                            <AlertTriangle className="w-3 h-3" />
                            Late
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={`text-[11px] italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        No WO Scheduled
                      </span>
                    )}
                  </td>

                  {/* Scheduled WO Qty */}
                  <td className={`py-3.5 px-3 text-right align-top font-mono text-xs font-bold whitespace-nowrap ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {row.scheduledQty.toLocaleString()}
                  </td>

                  {/* Coverage Balance */}
                  <td className="py-3.5 px-3 text-right align-top font-mono text-xs font-bold whitespace-nowrap">
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
                  <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap min-w-[150px]">
                    {row.coverageStatus === 'Need More WOs' ? (
                      <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full shadow-xs border whitespace-nowrap ${
                        isLight
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Need More WOs</span>
                      </span>
                    ) : (
                      <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full shadow-xs border whitespace-nowrap ${
                        isLight
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Covered</span>
                      </span>
                    )}
                  </td>

                  {/* Quick Action Buttons */}
                  <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap min-w-[110px]">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onOpenSimulateWo(row)}
                        className={`p-1.5 rounded-lg border font-medium text-xs flex items-center gap-1 transition-all ${
                          isLight
                            ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-blue-500 hover:text-blue-600 shadow-2xs'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-amber-500 hover:text-amber-400'
                        }`}
                        title="Simulate adding new Work Order"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>WO</span>
                      </button>

                      <button
                        onClick={() => onSelectItem(row)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title="View detailed breakdown"
                      >
                        <Eye className="w-3.5 h-3.5" />
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

