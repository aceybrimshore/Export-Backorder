import React, { useState } from 'react';
import { ProcessedPriorityItem, SimulatedWorkOrder } from '../types';
import { X, Plus, Calendar, Hash, Layers } from 'lucide-react';

interface AddWorkOrderModalProps {
  selectedItem: ProcessedPriorityItem | null;
  allItems: ProcessedPriorityItem[];
  onClose: () => void;
  onAddWorkOrder: (wo: SimulatedWorkOrder) => void;
}

export const AddWorkOrderModal: React.FC<AddWorkOrderModalProps> = ({
  selectedItem,
  allItems,
  onClose,
  onAddWorkOrder
}) => {
  const defaultPart = selectedItem ? selectedItem.item : allItems[0]?.item || '';
  const defaultShortage = selectedItem && selectedItem.coverageBalance < 0
    ? Math.abs(selectedItem.coverageBalance)
    : 50;

  const [partNumber, setPartNumber] = useState(defaultPart);
  const [woNumber, setWoNumber] = useState(
    `WO-SIM-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [qty, setQty] = useState(defaultShortage);
  const [startDate, setStartDate] = useState(
    selectedItem?.earliestStockRequiredBy !== 'N/A'
      ? selectedItem?.earliestStockRequiredBy || '2026-08-01'
      : '2026-08-01'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partNumber || !woNumber || qty <= 0) return;

    onAddWorkOrder({
      id: `swo-${Date.now()}`,
      partNumber: partNumber.trim(),
      woNumber: woNumber.trim(),
      qty: Number(qty),
      startDate: startDate || new Date().toISOString().split('T')[0]
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Simulate Work Order
              </h3>
              <p className="text-xs text-slate-500">
                Add a scheduled Work Order to evaluate coverage
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Part Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Part # / Assembly Item SKU
            </label>
            <select
              value={partNumber}
              onChange={e => {
                setPartNumber(e.target.value);
                const found = allItems.find(i => i.item === e.target.value);
                if (found && found.coverageBalance < 0) {
                  setQty(Math.abs(found.coverageBalance));
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-amber-500"
            >
              {allItems.map(item => (
                <option key={item.item} value={item.item}>
                  {item.item} - {item.description.substring(0, 35)}... (Short: {item.coverageBalance < 0 ? Math.abs(item.coverageBalance) : 0})
                </option>
              ))}
            </select>
          </div>

          {/* WO Number */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Work Order Number
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={woNumber}
                onChange={e => setWoNumber(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Quantity & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Scheduled Quantity
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  required
                  min={1}
                  value={qty}
                  onChange={e => setQty(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WO Start Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
            >
              Apply Simulated WO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
