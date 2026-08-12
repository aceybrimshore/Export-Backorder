import React, { useState } from 'react';
import { ProcessedPriorityItem } from '../types';
import {
  X,
  ClipboardList,
  Copy,
  Download,
  Check,
  AlertTriangle,
  Factory
} from 'lucide-react';

interface WorkOrderRequisitionModalProps {
  items: ProcessedPriorityItem[];
  onClose: () => void;
}

export const WorkOrderRequisitionModal: React.FC<WorkOrderRequisitionModalProps> = ({
  items,
  onClose
}) => {
  const shortages = items.filter(i => i.coverageStatus === 'Need More WOs');
  const [copied, setCopied] = useState(false);

  const totalRequiredQuantity = shortages.reduce(
    (acc, i) => acc + Math.abs(i.coverageBalance),
    0
  );

  const generateRequisitionText = () => {
    let txt = `====================================================\n`;
    txt += `  WORK ORDER REQUISITION PLAN - SYDNEY EXPORT ORDERS\n`;
    txt += `  Generated on: ${new Date().toLocaleDateString()}\n`;
    txt += `====================================================\n\n`;

    if (shortages.length === 0) {
      txt += `All export items are fully covered by scheduled Work Orders!\n`;
      return txt;
    }

    shortages.forEach(s => {
      txt += `[Priority #${s.priority}] Part #: ${s.item}\n`;
      txt += `Description: ${s.description}\n`;
      txt += `Required New WO Qty: ${Math.abs(s.coverageBalance)} units\n`;
      txt += `Stock Required By Date: ${s.earliestStockRequiredBy}\n`;
      txt += `Associated Sales Orders: ${s.salesOrders}\n`;
      txt += `Customers: ${s.customerName}\n`;
      txt += `----------------------------------------------------\n`;
    });

    return txt;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateRequisitionText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    let csv = `Priority,Part Number,Description,Required New WO Qty,Backorder Qty,Scheduled WO Qty,Earliest Stock Required By,Customer Names,Sales Orders\n`;

    shortages.forEach(s => {
      const descEsc = `"${s.description.replace(/"/g, '""')}"`;
      const custEsc = `"${s.customerName.replace(/"/g, '""')}"`;
      const soEsc = `"${s.salesOrders.replace(/"/g, '""')}"`;
      csv += `${s.priority},${s.item},${descEsc},${Math.abs(s.coverageBalance)},${s.totalBOQty},${s.scheduledQty},${s.earliestStockRequiredBy},${custEsc},${soEsc}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WO_Requisition_Plan_Sydney_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Work Order Requisition Plan
              </h3>
              <p className="text-xs text-slate-500">
                Required Work Orders to cover Sydney Export Backorders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
          {shortages.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
              <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Zero Shortages Detected!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                All Sydney Export assembly backorders are covered by existing Work Orders.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Bar */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <Factory className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold">
                    {shortages.length} SKUs require new Work Orders
                  </span>
                </div>
                <div className="font-bold text-amber-900 dark:text-amber-200 font-mono">
                  Total New WO Quantity: {totalRequiredQuantity.toLocaleString()} units
                </div>
              </div>

              {/* Requisition Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900 text-slate-300 text-[11px] font-semibold uppercase">
                    <tr>
                      <th className="py-2 px-3">Priority</th>
                      <th className="py-2 px-3">Item SKU & Description</th>
                      <th className="py-2 px-3 text-right">BO Qty</th>
                      <th className="py-2 px-3 text-right">Exist WO</th>
                      <th className="py-2 px-3 text-right text-amber-400 font-bold">New WO Qty Needed</th>
                      <th className="py-2 px-3">Target Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {shortages.map(s => (
                      <tr key={s.item} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-amber-600">
                          #{s.priority}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {s.item}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {s.description}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {s.totalBOQty}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {s.scheduledQty}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 text-sm bg-amber-50/50 dark:bg-amber-950/30">
                          {Math.abs(s.coverageBalance)}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {s.earliestStockRequiredBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="text-xs text-slate-500">
            Export directly to Production Scheduling
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Requisitions CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
