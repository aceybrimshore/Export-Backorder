import { RawBackorderItem, RawWorkOrder } from '../types';

export const SAMPLE_BACKORDERS: RawBackorderItem[] = [
  {
    id: 'bo-1',
    customerName: 'Rhino-Rack USA Inc (Denver Hub)',
    salesOrderNumber: 'SO-EXPORT-8901',
    orderDate: '2026-07-10',
    description: 'Batwing Awning Left Hand 2.5m - Premium Black',
    item: 'RR-BW-AWN-L',
    location: 'Sydney Distribution Centre',
    status: 'Released to Warehouse',
    backOrderQty: 120,
    backOrderValue: 74400.00,
    brand: 'Rhino-Rack',
    type: 'Assembly/Bill of Materials',
    netstockIndicator: 'A - High Velocity Export',
    stockRequiredBy: '2026-08-01',
    expectedShipDate: '2026-08-04'
  },
  {
    id: 'bo-2',
    customerName: 'Adventure Gear NZ Ltd (Auckland)',
    salesOrderNumber: 'SO-EXPORT-8905',
    orderDate: '2026-07-12',
    description: 'Batwing Awning Left Hand 2.5m - Premium Black',
    item: 'RR-BW-AWN-L',
    location: 'Sydney DC - Export Dock',
    status: 'Approved',
    backOrderQty: 45,
    backOrderValue: 27900.00,
    brand: 'Rhino-Rack',
    type: 'Assembly/Bill of Materials',
    netstockIndicator: 'A - High Velocity Export',
    stockRequiredBy: '2026-07-31',
    expectedShipDate: '2026-08-02'
  },
  {
    id: 'bo-3',
    customerName: 'Pacific Offroad Distributors (Vancouver)',
    salesOrderNumber: 'SO-EXPORT-8912',
    orderDate: '2026-07-15',
    description: 'Pioneer Platform 52100 (1528mm x 1236mm) Unassembled',
    item: 'RR-PNR-52100',
    location: 'Sydney Distribution Centre',
    status: 'In Processing',
    backOrderQty: 200,
    backOrderValue: 186000.00,
    brand: 'Rhino-Rack',
    type: 'Assembly/Bill of Materials',
    netstockIndicator: 'A - Critical Component',
    stockRequiredBy: '2026-08-05',
    expectedShipDate: '2026-08-08'
  },
  {
    id: 'bo-4',
    customerName: 'Outback Outfitters EU (Rotterdam)',
    salesOrderNumber: 'SO-EXPORT-8918',
    orderDate: '2026-07-18',
    description: 'STOWiT Utility Holder Starter Kit Assembly',
    item: 'RR-STOWIT-401',
    location: 'Sydney Main DC',
    status: 'Approved',
    backOrderQty: 150,
    backOrderValue: 22500.00,
    brand: 'Rhino-Rack',
    type: 'Assembly/Bill of Materials',
    netstockIndicator: 'B - Standard Stock',
    stockRequiredBy: '2026-08-10',
    expectedShipDate: '2026-08-12'
  },
  {
    id: 'bo-5',
    customerName: 'Rhino-Rack USA Inc (Denver Hub)',
    salesOrderNumber: 'SO-EXPORT-8922',
    orderDate: '2026-07-19',
    description: 'STOWiT Utility Holder Starter Kit Assembly',
    item: 'RR-STOWIT-401',
    location: 'Sydney Distribution Centre',
    status: 'Approved',
    backOrderQty: 100,
    backOrderValue: 15000.00,
    brand: 'Rhino-Rack',
    type: 'Assembly/Bill of Materials',
    netstockIndicator: 'B - Standard Stock',
    stockRequiredBy: '2026-08-08',
    expectedShipDate: '2026-08-11'
  },
  {
    id: 'bo-6',
    customerName: 'Overland Express Japan (Tokyo)',
    salesOrderNumber: 'SO-EXPORT-8930',
    orderDate: '2026-07-14',
    description: 'Sunseeker 2.0m Awning Full Kit',
    item: 'RR-SUN-AWN-20',
    location: 'Sydney Distribution Centre',
    status: 'In Processing',
    backOrderQty: 80,
    backOrderValue: 36800.00,
    brand: 'Rhino-Rack',
    type: 'Assembly/Bill of Materials',
    netstockIndicator: 'B - Seasonal Export',
    stockRequiredBy: '2026-08-03',
    expectedShipDate: '2026-08-06'
  },
  {
    id: 'bo-7',
    customerName: 'Nordic Expedition Ltd (Oslo)',
    salesOrderNumber: 'SO-EXPORT-8934',
    orderDate: '2026-07-22',
    description: 'Kayak Carrier Nautic 570 Rear Loading',
    item: 'RR-KYK-570',
    location: 'Sydney Distribution Centre',
    status: 'Approved',
    backOrderQty: 60,
    backOrderValue: 19800.00,
    brand: 'Rhino-Rack',
    type: 'Assembly/Bill of Materials',
    netstockIndicator: 'C - Slow Moving',
    stockRequiredBy: '2026-08-18',
    expectedShipDate: '2026-08-20'
  },
  {
    id: 'bo-8',
    customerName: 'Rhino-Rack USA Inc (Denver Hub)',
    salesOrderNumber: 'SO-EXPORT-8940',
    orderDate: '2026-07-08',
    description: 'MAXTRAX Mounting Bracket Set for Pioneer',
    item: 'RR-MXTX-MB',
    location: 'Sydney Distribution Centre',
    status: 'Approved',
    backOrderQty: 300,
    backOrderValue: 45000.00,
    brand: 'Rhino-Rack',
    type: 'Assembly/Bill of Materials',
    netstockIndicator: 'A - High Velocity Export',
    stockRequiredBy: '2026-07-29', // Very soon / Overdue
    expectedShipDate: '2026-08-01'
  },
  {
    id: 'bo-9',
    customerName: 'South America Offroad (Santiago)',
    salesOrderNumber: 'SO-EXPORT-8945',
    orderDate: '2026-07-25',
    description: 'Folding Ladder Assembly for Pioneer Tradie',
    item: 'RR-LDR-A3',
    location: 'Sydney Distribution Centre',
    status: 'Approved',
    backOrderQty: 35,
    backOrderValue: 11200.00,
    brand: 'Rhino-Rack',
    type: 'Assembly/Bill of Materials',
    netstockIndicator: 'C - Custom Pack',
    stockRequiredBy: '2026-08-15',
    expectedShipDate: '2026-08-17'
  },
  // Row that will be filtered OUT by Power Query logic (for testing filter fidelity)
  {
    id: 'bo-10',
    customerName: 'Pending Client Pty',
    salesOrderNumber: 'SO-PENDING-99',
    orderDate: '2026-07-28',
    description: 'Test Pending Item',
    item: 'RR-TEST-999',
    location: 'Sydney Distribution Centre',
    status: 'Pending Approval', // Filtered out!
    backOrderQty: 50,
    backOrderValue: 5000.00,
    brand: 'Rhino-Rack',
    type: 'Assembly/Bill of Materials',
    netstockIndicator: 'C',
    stockRequiredBy: '2026-08-01',
    expectedShipDate: '2026-08-05'
  },
  {
    id: 'bo-11',
    customerName: 'Melbourne Local Fleet',
    salesOrderNumber: 'SO-MELB-102',
    orderDate: '2026-07-26',
    description: 'Local Melbourne Unit',
    item: 'RR-LOCAL-01',
    location: 'Melbourne Warehouse', // Filtered out because not Sydney!
    backOrderQty: 25,
    backOrderValue: 2500.00,
    status: 'Approved',
    brand: 'Rhino-Rack',
    type: 'Assembly/Bill of Materials',
    netstockIndicator: 'B',
    stockRequiredBy: '2026-08-01',
    expectedShipDate: '2026-08-05'
  }
];

export const SAMPLE_WORK_ORDERS: RawWorkOrder[] = [
  {
    partNumber: 'RR-BW-AWN-L',
    scheduledQty: 100, // Shortage! BO is 120 + 45 = 165
    earliestWOStart: '2026-08-02', // Timing conflict! Stock required by 2026-07-31
    woNumbers: 'WO-2026-9041'
  },
  {
    partNumber: 'RR-PNR-52100',
    scheduledQty: 250, // Fully covered! BO is 200
    earliestWOStart: '2026-08-01',
    woNumbers: 'WO-2026-9088, WO-2026-9089'
  },
  {
    partNumber: 'RR-STOWIT-401',
    scheduledQty: 250, // Covered! Total BO is 150 + 100 = 250
    earliestWOStart: '2026-08-04',
    woNumbers: 'WO-2026-9112'
  },
  {
    partNumber: 'RR-MXTX-MB',
    scheduledQty: 150, // Shortage! BO is 300, scheduled is 150 (Short 150)
    earliestWOStart: '2026-07-30',
    woNumbers: 'WO-2026-8995'
  },
  {
    partNumber: 'RR-SUN-AWN-20',
    scheduledQty: 80, // Covered! BO is 80
    earliestWOStart: '2026-08-02',
    woNumbers: 'WO-2026-9055'
  }
  // RR-KYK-570 and RR-LDR-A3 have NO work orders in schedule summary -> missing/null -> coverage balance = -total BO Qty
];
