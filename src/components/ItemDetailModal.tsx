import React from 'react';
import { ProcessedPriorityItem, SimulatedWorkOrder } from '../types';
import { formatDisplayDate } from '../utils/pipeline';
import {
  X,
  Package,
  Building2,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

interface ItemDetailModalProps {
  item: ProcessedPriorityItem | null;
  onClose: () => void;
  simulatedWOs: SimulatedWorkOrder[];
  onAddSimulatedWo: (wo: SimulatedWorkOrder) => void;
  onRemoveSimulatedWo: (id: string) => void;
  onOpenSimulateWo?: (item: ProcessedPriorityItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  simulatedWOs,
  onAddSimulatedWo,
  onRemoveSimulatedWo,
  onOpenSimulateWo
}) => {
  if (!item) return null;

  const itemSimulated = simulatedWOs.filter(
    swo => swo.partNumber.toLowerCase() === item.item.toLowerCase()
  );

  // Derive system work orders list with fallback clean WO numbers
  const systemWOs = item.underlyingWorkOrders && item.underlyingWorkOrders.length > 0
    ? item.underlyingWorkOrders.map((wo, i) => {
        const hasValidNum = wo.woNumbers && wo.woNumbers.trim() !== '' && wo.woNumbers !== 'Unnumbered WO' && wo.woNumbers !== 'None';
        const cleanPart = (wo.partNumber || item.item).replace(/[^a-zA-Z0-9-]/g, '');
        return {
          ...wo,
          woNumbers: hasValidNum ? wo.woNumbers.trim() : `WO-${cleanPart}-${String(i + 1).padStart(2, '0')}`
        };
      })
    : item.woNumbers && item.woNumbers !== 'None'
      ? item.woNumbers.split(', ').map((woNum, i) => {
          const hasValidNum = woNum.trim() !== '' && woNum.trim() !== 'Unnumbered WO' && woNum.trim() !== 'None';
          const cleanPart = item.item.replace(/[^a-zA-Z0-9-]/g, '');
          return {
            partNumber: item.item,
            scheduledQty: item.scheduledQty,
            earliestWOStart: item.earliestWOStart || 'N/A',
            woNumbers: hasValidNum ? woNum.trim() : `WO-${cleanPart}-${String(i + 1).padStart(2, '0')}`
          };
        })
      : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-amber-400 font-bold px-2.5 py-0.5 rounded text-xs">
                Priority #{item.priority}
              </span>
              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {item.netstockIndicator}
              </span>
              {item.timingConflict && (
                <span className="text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Timing Conflict</span>
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
              {item.item}
            </h2>
            <p className="text-xs text-slate-500 font-medium">{item.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Total BO Quantity</span>
            <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {item.totalBOQty.toLocaleString()} units
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Total BO Value</span>
            <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
              ${item.totalBOValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Scheduled WO Qty</span>
            <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {item.scheduledQty.toLocaleString()} units
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Coverage Balance</span>
            <span
              className={`text-base font-bold font-mono ${
                item.coverageBalance < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {item.coverageBalance > 0 ? `+${item.coverageBalance}` : item.coverageBalance}
            </span>
          </div>
        </div>

        {/* Section 1: Underlying Sales Orders & Export Customers */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            Underlying Export Backorders ({item.underlyingOrders.length} Lines)
          </h3>
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
                <tr>
                  <th className="py-2 px-3">Sales Order #</th>
                  <th className="py-2 px-3">Order Date</th>
                  <th className="py-2 px-3">Customer Name</th>
                  <th className="py-2 px-3">Location</th>
                  <th className="py-2 px-3 text-right">BO Qty</th>
                  <th className="py-2 px-3 text-right">BO Value</th>
                  <th className="py-2 px-3">Req Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {item.underlyingOrders.map(so => (
                  <tr key={so.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {so.salesOrderNumber}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {so.orderDate ? formatDisplayDate(so.orderDate) : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                      {so.customerName}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{so.location}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      {so.backOrderQty}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      ${so.backOrderValue.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap font-mono text-[11px]">
                      {formatDisplayDate(so.stockRequiredBy)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Work Orders & Simulated Work Orders */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Scheduled Work Orders Breakdown ({systemWOs.length + itemSimulated.length} WOs)
            </h3>
            {onOpenSimulateWo && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSimulateWo(item);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simulate WO</span>
              </button>
            )}
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden space-y-0">
            {systemWOs.length > 0 || itemSimulated.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-[11px] font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-3">WO Number</th>
                    <th className="py-2 px-3 text-right">Scheduled Qty</th>
                    <th className="py-2 px-3">Start Date</th>
                    <th className="py-2 px-3">Source / Status</th>
                    <th className="py-2 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* ERP System Work Orders */}
                  {systemWOs.map((wo, i) => (
                    <tr key={`sys-wo-${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                        <span>{wo.woNumbers}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                        {wo.scheduledQty.toLocaleString()} units
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{wo.earliestWOStart || item.earliestWOStart || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {wo.status || 'ERP System Schedule'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                        System
                      </td>
                    </tr>
                  ))}

                  {/* Simulated / User Work Orders */}
                  {itemSimulated.map(swo => (
                    <tr key={swo.id} className="bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-950/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5 text-amber-500" />
                        <span>{swo.woNumber}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                        +{swo.qty.toLocaleString()} units
                      </td>
                      <td className="py-2.5 px-3 font-mono text-amber-900 dark:text-amber-200">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          <span>{swo.startDate}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                          Simulated
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onRemoveSimulatedWo(swo.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                          title="Remove simulated work order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No System Work Orders Scheduled in NetSuite
                </p>
                <p className="mt-1 text-slate-500 text-[11px]">
                  There are currently zero work orders on schedule for this item. Coverage balance is short by {item.totalBOQty} units.
                </p>
                {onOpenSimulateWo && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSimulateWo(item);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Simulate New Work Order</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">
            Netstock Status: <strong className="text-slate-700 dark:text-slate-300 font-mono">{item.netstockIndicator}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
