import {
  RawBackorderItem,
  RawWorkOrder,
  SimulatedWorkOrder,
  ProcessedPriorityItem,
  FilterSettings
} from '../types';

/**
 * Helper to parse various date strings safely (ISO YYYY-MM-DD or AU/UK D/M/YYYY).
 */
export function parseFlexibleDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') return null;
  const str = dateStr.trim();

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    return new Date(y, m, d);
  }

  // 2. Day/Month/Year format: D/M/YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10) - 1;
    const y = parseInt(dmyMatch[3], 10);
    return new Date(y, m, d);
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a Date object or date string as standard DD/MM/YYYY for Australian ERP display.
 */
export function formatDisplayDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
  const d = typeof dateInput === 'string' ? parseFlexibleDate(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput : 'N/A';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
export const DEFAULT_FILTERS: FilterSettings = {
  locationPrefix: 'Sydney',
  excludePendingApproval: true,
  minBackOrderQty: 1, // > 0
  brand: 'Rhino-Rack',
  type: 'Assembly/Bill of Materials',
  coverageFilter: 'ALL',
  urgencyFilter: 'ALL',
  timingConflictFilter: 'ALL',
  minBOValue: 0,
  netstockFilter: 'ALL',
  customerFilter: 'ALL',
  sortBy: 'DEFAULT',
  searchQuery: ''
};

/**
 * Filter raw backorder rows according to Power Query logic
 */
export function filterBackorders(
  rows: RawBackorderItem[],
  filters: FilterSettings
): RawBackorderItem[] {
  return rows.filter(row => {
    // [Status] <> "Pending Approval"
    if (filters.excludePendingApproval && row.status.toLowerCase() === 'pending approval') {
      return false;
    }

    // Text.StartsWith([Location], "Sydney")
    if (
      filters.locationPrefix &&
      !row.location.toLowerCase().includes(filters.locationPrefix.toLowerCase())
    ) {
      return false;
    }

    // [Back Order Qty] > 0
    if (row.backOrderQty < filters.minBackOrderQty) {
      return false;
    }

    // [Brand] = "Rhino-Rack"
    if (filters.brand && row.brand.toLowerCase() !== filters.brand.toLowerCase()) {
      return false;
    }

    // [Type] = "Assembly/Bill of Materials"
    if (filters.type && row.type.toLowerCase() !== filters.type.toLowerCase()) {
      return false;
    }

    return true;
  });
}

/**
 * Group filtered rows by Item SKU, calculate aggregations, join with Work Orders,
 * apply priority sorting and coverage status.
 */
export function processPipeline(
  filteredRows: RawBackorderItem[],
  workOrders: RawWorkOrder[],
  simulatedWOs: SimulatedWorkOrder[],
  filters: FilterSettings,
  userCustomRanks: Record<string, number> = {}
): ProcessedPriorityItem[] {
  // Step 1: Group by [Item]
  const groupedMap = new Map<string, RawBackorderItem[]>();

  for (const row of filteredRows) {
    const key = row.item.trim();
    if (!groupedMap.has(key)) {
      groupedMap.set(key, []);
    }
    groupedMap.get(key)!.push(row);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Step 2: Calculate Grouped Aggregations & Join Work Orders
  const processedItems: ProcessedPriorityItem[] = [];

  groupedMap.forEach((rows, itemKey) => {
    // Unique customer names
    const customerNames = Array.from(new Set(rows.map(r => r.customerName))).filter(Boolean);
    const customerNameStr = customerNames.join(', ');

    // Unique sales order numbers
    const salesOrders = Array.from(new Set(rows.map(r => r.salesOrderNumber))).filter(Boolean);
    const salesOrdersStr = salesOrders.join(', ');

    // First description & netstock indicator
    const description = rows[0]?.description || itemKey;
    const netstockIndicator = rows[0]?.netstockIndicator || '-';

    // Total BO Qty & Total BO Value
    const totalBOQty = rows.reduce((acc, r) => acc + (Number(r.backOrderQty) || 0), 0);
    const totalBOValue = rows.reduce((acc, r) => acc + (Number(r.backOrderValue) || 0), 0);

    // Earliest Stock Required By
    const requiredDateObjs = rows
      .map(r => parseFlexibleDate(r.stockRequiredBy))
      .filter((d): d is Date => d !== null);
    requiredDateObjs.sort((a, b) => a.getTime() - b.getTime());

    const earliestStockRequiredBy = requiredDateObjs.length > 0
      ? formatDisplayDate(requiredDateObjs[0])
      : 'N/A';

    // Earliest Order Date (Sales Order Date)
    const orderDateObjs = rows
      .map(r => parseFlexibleDate(r.orderDate))
      .filter((d): d is Date => d !== null);
    orderDateObjs.sort((a, b) => a.getTime() - b.getTime());

    const earliestOrderDate = orderDateObjs.length > 0
      ? formatDisplayDate(orderDateObjs[0])
      : undefined;

    // Earliest Ship Date
    const shipDateObjs = rows
      .map(r => parseFlexibleDate(r.expectedShipDate))
      .filter((d): d is Date => d !== null);
    shipDateObjs.sort((a, b) => a.getTime() - b.getTime());

    const earliestShipDate = shipDateObjs.length > 0
      ? formatDisplayDate(shipDateObjs[0])
      : earliestStockRequiredBy;

    // --- Work Order Joining (Schedule Summary + Simulated WOs) ---
    const matchingWOList = workOrders.filter(
      wo => wo.partNumber.trim().toLowerCase() === itemKey.toLowerCase()
    );
    const matchingSimulated = simulatedWOs.filter(
      swo => swo.partNumber.trim().toLowerCase() === itemKey.toLowerCase()
    );

    let scheduledQty = 0;
    const woStartObjs: Date[] = [];
    const woNumberSet = new Set<string>();

    matchingWOList.forEach((wo, idx) => {
      scheduledQty += Number(wo.scheduledQty) || 0;
      const parsedStart = parseFlexibleDate(wo.earliestWOStart);
      if (parsedStart) woStartObjs.push(parsedStart);

      const cleanNum = (wo.woNumbers && wo.woNumbers.trim() !== '' && wo.woNumbers !== 'Unnumbered WO')
        ? wo.woNumbers
        : `WO-${itemKey}-${String(idx + 1).padStart(2, '0')}`;
      
      wo.woNumbers = cleanNum;
      woNumberSet.add(cleanNum);
    });

    matchingSimulated.forEach(swo => {
      scheduledQty += Number(swo.qty) || 0;
      const parsedStart = parseFlexibleDate(swo.startDate);
      if (parsedStart) woStartObjs.push(parsedStart);
      if (swo.woNumber) woNumberSet.add(`${swo.woNumber} (Sim)`);
    });

    woStartObjs.sort((a, b) => a.getTime() - b.getTime());
    const earliestWOStart = woStartObjs.length > 0 ? formatDisplayDate(woStartObjs[0]) : null;
    const woNumbers = Array.from(woNumberSet).join(', ') || 'None';

    // Coverage Balance & Status calculation (from Power Query M code)
    const coverageBalance = scheduledQty - totalBOQty;
    const coverageStatus: 'Covered' | 'Need More WOs' =
      coverageBalance < 0 ? 'Need More WOs' : 'Covered';

    // Timing Conflict check: WO start date is after Stock Required By date
    let timingConflict = false;
    if (woStartObjs.length > 0 && requiredDateObjs.length > 0) {
      timingConflict = woStartObjs[0].getTime() > requiredDateObjs[0].getTime();
    }

    // Urgency calculation based on required date vs today
    let urgencyLevel: ProcessedPriorityItem['urgencyLevel'] = 'Normal';
    if (requiredDateObjs.length > 0) {
      const reqDate = new Date(requiredDateObjs[0].getTime());
      reqDate.setHours(0, 0, 0, 0);
      const diffTime = reqDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        urgencyLevel = 'Overdue';
      } else if (diffDays <= 7) {
        urgencyLevel = 'Critical (<= 7d)';
      } else if (diffDays <= 14) {
        urgencyLevel = 'Upcoming (<= 14d)';
      }
    }

    processedItems.push({
      priority: 0, // Placeholder, assigned after sort
      item: itemKey,
      description,
      customerName: customerNameStr,
      salesOrders: salesOrdersStr,
      netstockIndicator,
      totalBOQty,
      totalBOValue,
      earliestOrderDate,
      earliestStockRequiredBy,
      earliestShipDate,
      scheduledQty,
      earliestWOStart,
      woNumbers,
      coverageBalance,
      coverageStatus,
      timingConflict,
      urgencyLevel,
      underlyingOrders: rows,
      underlyingWorkOrders: matchingWOList
    });
  });

  // Step 3: Sort Rows according to selected sortBy option or default Power Query rule:
  processedItems.sort((a, b) => {
    // If user has defined custom priorities, respect user override
    const userRankA = userCustomRanks[a.item];
    const userRankB = userCustomRanks[b.item];
    if (userRankA !== undefined && userRankB !== undefined) {
      return userRankA - userRankB;
    }
    if (userRankA !== undefined) return -1;
    if (userRankB !== undefined) return 1;

    if (filters.sortBy === 'BO_VALUE_DESC') {
      return b.totalBOValue - a.totalBOValue;
    }
    if (filters.sortBy === 'BO_QTY_DESC') {
      return b.totalBOQty - a.totalBOQty;
    }
    if (filters.sortBy === 'SHORTAGE_DESC') {
      const shortageA = a.coverageBalance < 0 ? -a.coverageBalance : 0;
      const shortageB = b.coverageBalance < 0 ? -b.coverageBalance : 0;
      return shortageB - shortageA;
    }
    if (filters.sortBy === 'REQ_DATE_ASC') {
      return a.earliestStockRequiredBy.localeCompare(b.earliestStockRequiredBy);
    }
    if (filters.sortBy === 'SKU_ASC') {
      return a.item.localeCompare(b.item);
    }

    // Power Query Default Sorting: Earliest Stock Required By Asc, then Total BO Qty Desc
    if (a.earliestStockRequiredBy !== b.earliestStockRequiredBy) {
      return a.earliestStockRequiredBy.localeCompare(b.earliestStockRequiredBy);
    }
    return b.totalBOQty - a.totalBOQty;
  });

  // Step 4: Assign 1-based Priority index column
  processedItems.forEach((item, idx) => {
    item.priority = idx + 1;
  });

  // Step 5: Filter by Coverage, Urgency, Timing Conflicts, Values, Netstock, Customer & Search Query
  return processedItems.filter(item => {
    if (filters.coverageFilter === 'NEED_MORE_WOS' && item.coverageStatus !== 'Need More WOs') {
      return false;
    }
    if (filters.coverageFilter === 'COVERED' && item.coverageStatus !== 'Covered') {
      return false;
    }

    if (filters.urgencyFilter === 'OVERDUE' && item.urgencyLevel !== 'Overdue') {
      return false;
    }
    if (filters.urgencyFilter === 'CRITICAL' && item.urgencyLevel !== 'Overdue' && item.urgencyLevel !== 'Critical (<= 7d)') {
      return false;
    }
    if (filters.urgencyFilter === 'NORMAL' && (item.urgencyLevel === 'Overdue' || item.urgencyLevel === 'Critical (<= 7d)')) {
      return false;
    }

    if (filters.timingConflictFilter === 'CONFLICT_ONLY' && !item.timingConflict) {
      return false;
    }
    if (filters.timingConflictFilter === 'NO_CONFLICT' && item.timingConflict) {
      return false;
    }

    if (filters.minBOValue > 0 && item.totalBOValue < filters.minBOValue) {
      return false;
    }

    if (filters.netstockFilter && filters.netstockFilter !== 'ALL') {
      if (!item.netstockIndicator.toLowerCase().includes(filters.netstockFilter.toLowerCase())) {
        return false;
      }
    }

    if (filters.customerFilter && filters.customerFilter !== 'ALL') {
      if (!item.customerName.toLowerCase().includes(filters.customerFilter.toLowerCase())) {
        return false;
      }
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        item.item.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.salesOrders.toLowerCase().includes(q) ||
        item.woNumbers.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}
