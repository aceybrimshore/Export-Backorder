export interface RawBackorderItem {
  id: string;
  customerName: string;
  salesOrderNumber: string;
  orderDate?: string; // YYYY-MM-DD or DD/MM/YYYY (Sales Order Date)
  description: string;
  item: string; // SKU / Part #
  location: string;
  status: string;
  backOrderQty: number;
  backOrderValue: number;
  brand: string;
  type: string;
  netstockIndicator: string;
  stockRequiredBy: string; // YYYY-MM-DD
  expectedShipDate: string; // YYYY-MM-DD
}

export interface RawWorkOrder {
  partNumber: string;
  scheduledQty: number;
  earliestWOStart: string; // YYYY-MM-DD
  woNumbers: string;
  status?: string;
}

export interface SimulatedWorkOrder {
  id: string;
  partNumber: string;
  woNumber: string;
  qty: number;
  startDate: string;
}

export interface ProcessedPriorityItem {
  priority: number;
  item: string;
  description: string;
  customerName: string;
  salesOrders: string;
  netstockIndicator: string;
  totalBOQty: number;
  totalBOValue: number;
  earliestOrderDate?: string;
  earliestStockRequiredBy: string;
  earliestShipDate: string;
  
  // From Schedule Summary / Work Orders
  scheduledQty: number;
  earliestWOStart: string | null;
  woNumbers: string;
  
  // Custom Calculated Fields
  coverageBalance: number;
  coverageStatus: 'Covered' | 'Need More WOs';
  
  // Advanced Insights
  timingConflict: boolean; // true if WO start date is after required date
  urgencyLevel: 'Overdue' | 'Critical (<= 7d)' | 'Upcoming (<= 14d)' | 'Normal';
  
  // Raw items grouped under this SKU
  underlyingOrders: RawBackorderItem[];
  underlyingWorkOrders?: RawWorkOrder[];
  
  // Custom user override priority rank if modified manually
  userCustomPriority?: number;
}

export interface FilterSettings {
  locationPrefix: string;
  excludePendingApproval: boolean;
  minBackOrderQty: number;
  brand: string;
  type: string;
  coverageFilter: 'ALL' | 'NEED_MORE_WOS' | 'COVERED';
  urgencyFilter: 'ALL' | 'OVERDUE' | 'CRITICAL' | 'NORMAL';
  timingConflictFilter: 'ALL' | 'CONFLICT_ONLY' | 'NO_CONFLICT';
  minBOValue: number;
  netstockFilter: string; // 'ALL' or specific netstock code
  customerFilter: string; // 'ALL' or specific customer
  sortBy: 'DEFAULT' | 'BO_VALUE_DESC' | 'BO_QTY_DESC' | 'SHORTAGE_DESC' | 'REQ_DATE_ASC' | 'SKU_ASC';
  searchQuery: string;
}

export interface SavedScenario {
  id: string;
  name: string;
  createdAt: string;
  backorders: RawBackorderItem[];
  workOrders: RawWorkOrder[];
  simulatedWOs: SimulatedWorkOrder[];
  filters: FilterSettings;
  userCustomRanks: Record<string, number>;
}

