import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Loader2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export interface UploadSummary {
  backordersCount: number;
  workOrdersCount: number;
  uniqueSkusCount: number;
  totalBoQty: number;
  totalBoValue: number;
  timestamp: string;
}

interface CsvUploadModalProps {
  onClose: () => void;
  onApplyUploadedData: (
    backorders: RawBackorderItem[],
    workOrders: RawWorkOrder[],
    summary?: UploadSummary
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

  // Live parsed pre-upload summaries
  const [boPreviewCount, setBoPreviewCount] = useState<number | null>(null);
  const [woPreviewCount, setWoPreviewCount] = useState<number | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<UploadSummary | null>(null);

  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Inspect backorders CSV whenever file or text changes
  useEffect(() => {
    if (activeTab === 'FILE' && boFile) {
      boFile.text().then(text => {
        try {
          const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
          setBoPreviewCount(parsed.data.length);
        } catch {
          setBoPreviewCount(null);
        }
      });
    } else if (activeTab === 'PASTE' && boText.trim()) {
      try {
        const parsed = Papa.parse(boText, { header: true, skipEmptyLines: true });
        setBoPreviewCount(parsed.data.length);
      } catch {
        setBoPreviewCount(null);
      }
    } else {
      setBoPreviewCount(null);
    }
  }, [boFile, boText, activeTab]);

  // Inspect work orders CSV whenever file or text changes
  useEffect(() => {
    if (activeTab === 'FILE' && woFile) {
      woFile.text().then(text => {
        try {
          const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
          setWoPreviewCount(parsed.data.length);
        } catch {
          setWoPreviewCount(null);
        }
      });
    } else if (activeTab === 'PASTE' && woText.trim()) {
      try {
        const parsed = Papa.parse(woText, { header: true, skipEmptyLines: true });
        setWoPreviewCount(parsed.data.length);
      } catch {
        setWoPreviewCount(null);
      }
    } else {
      setWoPreviewCount(null);
    }
  }, [woFile, woText, activeTab]);

  const suiteqlBackorderQuery = `-- NetSuite SuiteQL: Open Backorders & Customer Demand Export
-- Fixes applied: Uses tl.mainline = 'F', tl.quantitybackordered, and safe date formatting
SELECT 
  t.tranid AS "Sales Order Number",
  TO_CHAR(t.trandate, 'DD/MM/YYYY') AS "Order Date",
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
        orderDate: getVal(['Order Date', 'Sales Order Date', 'SO Date', 'Date', 'Tran Date', 'Transaction Date', 'Date Created', 'Order Placed', 'Date Entered']),
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

      const partNumber = getVal(['Part #', 'Part Number', 'Item', 'SKU', 'Assembly']);
      let woNumbers = getVal([
        'WO Numbers',
        'WO #',
        'Work Order #',
        'WO Number',
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
      setIsProcessing(true);
      setStatusMsg(null);

      let boData: RawBackorderItem[] = [];
      let woData: RawWorkOrder[] = [];

      if (activeTab === 'FILE') {
        if (!boFile && !woFile) {
          setIsProcessing(false);
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
          setIsProcessing(false);
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

      // Calculate summary metrics
      const uniqueSkus = new Set(boData.map(b => b.item.trim()).filter(Boolean));
      const totalBoQty = boData.reduce((sum, b) => sum + (Number(b.backOrderQty) || 0), 0);
      const totalBoValue = boData.reduce((sum, b) => sum + (Number(b.backOrderValue) || 0), 0);

      const summary: UploadSummary = {
        backordersCount: boData.length,
        workOrdersCount: woData.length,
        uniqueSkusCount: uniqueSkus.size,
        totalBoQty,
        totalBoValue,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      // Brief animation for user feedback
      await new Promise(resolve => setTimeout(resolve, 450));

      // Apply dataset to App state
      onApplyUploadedData(boData, woData, summary);
      
      setIsProcessing(false);
      setCompletedSummary(summary);
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMsg({
        type: 'error',
        text: `Error parsing CSV: ${err.message || err}`
      });
    }
  };

  const handleResetForNewUpload = () => {
    setCompletedSummary(null);
    setBoFile(null);
    setWoFile(null);
    setBoText('');
    setWoText('');
    setBoPreviewCount(null);
    setWoPreviewCount(null);
    setStatusMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 transition-all">
        
        {/* State 1: Upload Completed View */}
        {completedSummary ? (
          <div className="space-y-6 py-2">
            {/* Header / Success Indicator */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                CSV Import Completed Successfully!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Your dataset has been parsed and loaded into the priority calculation pipeline at <span className="font-semibold text-slate-900 dark:text-slate-200">{completedSummary.timestamp}</span>.
              </p>
            </div>

            {/* Metrics Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Backorders
                </span>
                <span className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400">
                  {completedSummary.backordersCount}
                </span>
                <span className="text-[10px] text-slate-400 block">Lines loaded</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Work Orders
                </span>
                <span className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {completedSummary.workOrdersCount}
                </span>
                <span className="text-[10px] text-slate-400 block">Lines linked</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Unique SKUs
                </span>
                <span className="text-lg font-extrabold font-mono text-purple-600 dark:text-purple-400">
                  {completedSummary.uniqueSkusCount}
                </span>
                <span className="text-[10px] text-slate-400 block">Assemblies</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Value
                </span>
                <span className="text-lg font-extrabold font-mono text-amber-600 dark:text-amber-400">
                  ${Math.round(completedSummary.totalBoValue).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">Export demand</span>
              </div>
            </div>

            {/* Pipeline Notice */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Priority schedule & KPI dashboard are live</span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  Power Query grouping, Sydney location filters, Netstock sorting, and Work Order coverage balances have all been recomputed.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleResetForNewUpload}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload Another File</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>View Updated Priority Schedule</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* State 2: Normal Upload / Config Form */
          <>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      1. Export / Back Order CSV File
                    </label>
                    {boPreviewCount !== null && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{boPreviewCount} rows detected</span>
                      </span>
                    )}
                  </div>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    boFile
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-amber-500'
                  }`}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={e => setBoFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="boFileInput"
                    />
                    <label htmlFor="boFileInput" className="cursor-pointer space-y-1 block">
                      <FileSpreadsheet className={`w-6 h-6 mx-auto ${boFile ? 'text-emerald-500' : 'text-amber-500'}`} />
                      <span className="block font-medium text-slate-700 dark:text-slate-200">
                        {boFile ? boFile.name : 'Click or drop Export Backorders CSV'}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        Recognizes: Sales Order Number, Order Date, Item, Back Order Qty, Stock Required by, Location...
                      </span>
                    </label>
                  </div>
                </div>

                {/* Work Order CSV */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      2. Schedule Summary / Work Order CSV File
                    </label>
                    {woPreviewCount !== null && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{woPreviewCount} work orders detected</span>
                      </span>
                    )}
                  </div>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    woFile
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-amber-500'
                  }`}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={e => setWoFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="woFileInput"
                    />
                    <label htmlFor="woFileInput" className="cursor-pointer space-y-1 block">
                      <FileText className={`w-6 h-6 mx-auto ${woFile ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span className="block font-medium text-slate-700 dark:text-slate-200">
                        {woFile ? woFile.name : 'Click or drop Schedule Summary CSV (Optional)'}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        Recognizes: Part #, Scheduled Qty, Earliest WO Start, WO Numbers
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ) : activeTab === 'PASTE' ? (
              /* Paste Mode */
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Paste Export CSV Text
                    </label>
                    {boPreviewCount !== null && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{boPreviewCount} rows detected</span>
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={boText}
                    onChange={e => setBoText(e.target.value)}
                    placeholder="Item,Description,Back Order Qty,Back Order Value,Stock Required by,Order Date,Expected Ship Date,Location,Brand,Type,Status,Customer Name,Sales Order Number..."
                    className="w-full p-2.5 font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Paste Work Order Schedule Summary CSV Text
                    </label>
                    {woPreviewCount !== null && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{woPreviewCount} work orders detected</span>
                      </span>
                    )}
                  </div>
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
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessUpload}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Pipeline...</span>
                  </>
                ) : (
                  <span>Process & Run Power Query Pipeline</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
