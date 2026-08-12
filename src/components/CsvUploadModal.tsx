import React, { useState } from 'react';
import Papa from 'papaparse';
import { RawBackorderItem, RawWorkOrder } from '../types';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Database,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface CsvUploadModalProps {
  onClose: () => void;
  onApplyUploadedData: (
    backorders: RawBackorderItem[],
    workOrders: RawWorkOrder[]
  ) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  onClose,
  onApplyUploadedData
}) => {
  const [activeTab, setActiveTab] = useState<'FILE' | 'PASTE' | 'SUITEQL'>('FILE');

  const [boFile, setBoFile] = useState<File | null>(null);
  const [woFile, setWoFile] = useState<File | null>(null);

  const [boText, setBoText] = useState('');
  const [woText, setWoText] = useState('');

  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const suiteqlBackorderQuery = `-- NetSuite SuiteQL: Open Backorders & Customer Demand Export
-- Fixes applied: Uses tl.mainline = 'F', tl.quantitybackordered, and safe date formatting
SELECT 
  t.tranid AS "Sales Order Number",
  c.companyname AS "Customer Name",
  i.itemid AS "Item",
  i.displayname AS "Description",
  tl.quantitybackordered AS "Back Order Qty",
  ROUND(tl.quantitybackordered * NVL(tl.rate, 0), 2) AS "Back Order Value",
  TO_CHAR(NVL(tl.expectedshipdate, t.trandate), 'DD/MM/YYYY') AS "Stock Required by",
  TO_CHAR(NVL(tl.expectedshipdate, t.trandate), 'DD/MM/YYYY') AS "Expected Ship Date",
  loc.name AS "Location",
  NVL(i.custitem_netstock_indicator, 'Stocked') AS "Netstock Stocking Indicator Sydney"
FROM 
  transaction t
  INNER JOIN transactionLine tl ON t.id = tl.transaction
  INNER JOIN item i ON tl.item = i.id
  LEFT JOIN entity c ON t.entity = c.id
  LEFT JOIN location loc ON tl.location = loc.id
WHERE 
  t.type = 'SalesOrd' 
  AND tl.mainline = 'F'
  AND tl.isclosed = 'F'
  AND tl.quantitybackordered > 0
ORDER BY 
  NVL(tl.expectedshipdate, t.trandate) ASC;`;

  const suiteqlWorkOrderQuery = `-- NetSuite SuiteQL: Active Work Orders Schedule Export
SELECT 
  i.itemid AS "Part #",
  t.tranid AS "WO #",
  tl.quantity AS "Scheduled Qty",
  TO_CHAR(t.startdate, 'DD/MM/YYYY') AS "Earliest WO Start"
FROM 
  transaction t
  INNER JOIN transactionLine tl ON t.id = tl.transaction
  INNER JOIN item i ON tl.item = i.id
WHERE 
  t.type = 'WorkOrd'
  AND tl.mainline = 'T'
  AND t.status IN ('Pending Build', 'In Process', 'A', 'B')
ORDER BY 
  t.startdate ASC;`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(label);
    setTimeout(() => setCopiedQuery(null), 2500);
  };

  // Helper to parse Backorder CSV rows
  const parseBackorderCsv = (csvContent: string): RawBackorderItem[] => {
    const parsed = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true
    });

    return parsed.data.map((row, idx) => {
      const getVal = (possibleKeys: string[]) => {
        for (const k of possibleKeys) {
          const matchKey = Object.keys(row).find(rk => {
            const cleanRk = rk.trim().toLowerCase().replace(/\s+/g, ' ');
            const cleanK = k.trim().toLowerCase().replace(/\s+/g, ' ');
            return cleanRk === cleanK;
          });
          if (matchKey && row[matchKey] !== undefined && row[matchKey].trim() !== '') {
            return row[matchKey].trim();
          }
        }
        return '';
      };

      const backOrderQty = parseFloat(getVal(['Back Order Qty', 'BO Qty', 'Qty', 'Backorder Quantity'])) || 0;
      const backOrderValue = parseFloat(getVal(['Back Order Value', 'BO Value', 'Value'])) || 0;

      return {
        id: `upload-bo-${idx}-${Date.now()}`,
        customerName: getVal(['Customer Name', 'Customer', 'Client']),
        salesOrderNumber: getVal(['Sales Order Number', 'Sales Order', 'SO Number', 'SO#']),
        description: getVal(['Description', 'Item Description']),
        item: getVal(['Item', 'Part #', 'Part Number', 'SKU']),
        location: getVal(['Location', 'Warehouse', 'Site']),
        status: getVal(['Status', 'Order Status']),
        backOrderQty,
        backOrderValue,
        brand: getVal(['Brand', 'Manufacturer']),
        type: getVal(['Type', 'Item Type']),
        netstockIndicator: getVal([
          'Netstock Stocking Indicator Sydney',
          'Netstock Indicator',
          'Netstock'
        ]),
        stockRequiredBy: getVal(['Stock Required by', 'Required Date', 'Stock Required Date']),
        expectedShipDate: getVal(['Expected Ship Date', 'Ship Date', 'Expected Ship'])
      };
    });
  };

  // Helper to parse Work Order CSV rows
  const parseWorkOrderCsv = (csvContent: string): RawWorkOrder[] => {
    const parsed = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true
    });

    return parsed.data.map((row, idx) => {
      const getVal = (possibleKeys: string[]) => {
        for (const k of possibleKeys) {
          const matchKey = Object.keys(row).find(rk => {
            const cleanRk = rk.trim().toLowerCase().replace(/\s+/g, ' ');
            const cleanK = k.trim().toLowerCase().replace(/\s+/g, ' ');
            return cleanRk === cleanK;
          });
          if (matchKey && row[matchKey] !== undefined && row[matchKey].trim() !== '') {
            return row[matchKey].trim();
          }
        }
        return '';
      };

      const partNumber = getVal(['Part #', 'Part Number', 'Part', 'Item', 'SKU', 'Item SKU', 'Item ID']);
      let woNumbers = getVal([
        'WO #',
        'WO#',
        'WO Number',
        'WO Numbers',
        'WO',
        'Work Order #',
        'Work Order Number',
        'Work Order',
        'Work Orders',
        'Transaction ID',
        'TranID',
        'Tran ID',
        'Document Number',
        'Doc #',
        'Ref #'
      ]);

      if (!woNumbers || woNumbers === 'Unnumbered WO') {
        const cleanPart = partNumber ? partNumber.replace(/[^a-zA-Z0-9-]/g, '') : 'SYS';
        woNumbers = `WO-${cleanPart}-${String(idx + 1).padStart(2, '0')}`;
      }

      return {
        partNumber,
        scheduledQty: parseFloat(getVal(['Scheduled Qty', 'WO Qty', 'Qty', 'Scheduled Quantity', 'Quantity'])) || 0,
        earliestWOStart: getVal(['Earliest WO Start', 'WO Start Date', 'Start Date', 'Date', 'Earliest WO Start Date']),
        woNumbers
      };
    });
  };

  const handleProcessUpload = async () => {
    try {
      let boData: RawBackorderItem[] = [];
      let woData: RawWorkOrder[] = [];

      if (activeTab === 'FILE') {
        if (!boFile && !woFile) {
          setStatusMsg({
            type: 'error',
            text: 'Please select at least an Export Backorders CSV file.'
          });
          return;
        }

        if (boFile) {
          const text = await boFile.text();
          boData = parseBackorderCsv(text);
        }

        if (woFile) {
          const text = await woFile.text();
          woData = parseWorkOrderCsv(text);
        }
      } else {
        if (!boText.trim() && !woText.trim()) {
          setStatusMsg({
            type: 'error',
            text: 'Please paste Export Backorders CSV text.'
          });
          return;
        }

        if (boText.trim()) {
          boData = parseBackorderCsv(boText);
        }

        if (woText.trim()) {
          woData = parseWorkOrderCsv(woText);
        }
      }

      onApplyUploadedData(boData, woData);
      onClose();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Error parsing CSV: ${err.message || err}`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Upload Export & Work Order CSVs
              </h3>
              <p className="text-xs text-slate-500">
                Replace dataset with your live system exports
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveTab('FILE')}
            className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'FILE'
                ? 'border-blue-600 text-blue-600 dark:border-amber-400 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File (.csv)</span>
          </button>
          <button
            onClick={() => setActiveTab('PASTE')}
            className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'PASTE'
                ? 'border-blue-600 text-blue-600 dark:border-amber-400 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste CSV Text</span>
          </button>
          <button
            onClick={() => setActiveTab('SUITEQL')}
            className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'SUITEQL'
                ? 'border-blue-600 text-blue-600 dark:border-amber-400 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span>NetSuite SuiteQL Queries</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-full font-bold">SQL</span>
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              statusMsg.type === 'error'
                ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* File Upload Mode */}
        {activeTab === 'FILE' ? (
          <div className="space-y-4 text-xs">
            {/* Backorder CSV */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                1. Export / Back Order CSV File
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => setBoFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="boFileInput"
                />
                <label htmlFor="boFileInput" className="cursor-pointer space-y-1 block">
                  <FileSpreadsheet className="w-6 h-6 text-amber-500 mx-auto" />
                  <span className="block font-medium text-slate-700 dark:text-slate-200">
                    {boFile ? boFile.name : 'Click or drop Export Backorders CSV'}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Required headers: Item, Description, Back Order Qty, Stock Required by, Location, Brand, Type
                  </span>
                </label>
              </div>
            </div>

            {/* Work Order CSV */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                2. Schedule Summary / Work Order CSV File
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => setWoFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="woFileInput"
                />
                <label htmlFor="woFileInput" className="cursor-pointer space-y-1 block">
                  <FileText className="w-6 h-6 text-emerald-500 mx-auto" />
                  <span className="block font-medium text-slate-700 dark:text-slate-200">
                    {woFile ? woFile.name : 'Click or drop Schedule Summary CSV'}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Required headers: Part #, Scheduled Qty, Earliest WO Start, WO Numbers
                  </span>
                </label>
              </div>
            </div>
          </div>
        ) : activeTab === 'PASTE' ? (
          /* Paste Mode */
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Paste Export CSV Text
              </label>
              <textarea
                rows={4}
                value={boText}
                onChange={e => setBoText(e.target.value)}
                placeholder="Item,Description,Back Order Qty,Back Order Value,Stock Required by,Expected Ship Date,Location,Brand,Type,Status,Customer Name,Sales Order Number..."
                className="w-full p-2.5 font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Paste Work Order Schedule Summary CSV Text
              </label>
              <textarea
                rows={4}
                value={woText}
                onChange={e => setWoText(e.target.value)}
                placeholder="Part #,Scheduled Qty,Earliest WO Start,WO Numbers..."
                className="w-full p-2.5 font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>
        ) : (
          /* NetSuite SuiteQL Mode */
          <div className="space-y-4 text-xs max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 text-indigo-950 dark:text-indigo-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-indigo-900 dark:text-indigo-100">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>How to query NetSuite directly using SuiteQL:</span>
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                Copy these optimized SQL queries into your NetSuite <strong>SuiteQL Query Tool</strong>, <strong>SuiteAnalytics Connect (ODBC)</strong>, or <strong>REST Query API</strong>. Once executed, export the results as CSV and upload or paste them into this pipeline!
              </p>
            </div>

            {/* Query 1: Backorders */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-500" />
                    <span>1. Export Backorders / Demand Query (SuiteQL)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Extracts open Sales Order backorders with required dates, locations & Netstock indicators.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(suiteqlBackorderQuery, 'bo')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {copiedQuery === 'bo' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL Query</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto custom-scrollbar max-h-48 border border-slate-800">
                {suiteqlBackorderQuery}
              </pre>
            </div>

            {/* Query 2: Work Orders */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-500" />
                    <span>2. Schedule Summary / Work Order Query (SuiteQL)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Aggregates scheduled Work Order quantities, earliest start dates, and WO numbers per assembly SKU.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(suiteqlWorkOrderQuery, 'wo')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {copiedQuery === 'wo' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL Query</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto custom-scrollbar max-h-48 border border-slate-800">
                {suiteqlWorkOrderQuery}
              </pre>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleProcessUpload}
            className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg transition-colors shadow-sm"
          >
            Process & Run Power Query Pipeline
          </button>
        </div>
      </div>
    </div>
  );
};
