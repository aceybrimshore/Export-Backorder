import React, { useState, useMemo, useEffect } from 'react';
import {
  RawBackorderItem,
  RawWorkOrder,
  SimulatedWorkOrder,
  FilterSettings,
  ProcessedPriorityItem,
  SavedScenario
} from './types';
import { ThemeId, Themes } from './theme';
import { SAMPLE_BACKORDERS, SAMPLE_WORK_ORDERS } from './data/sampleData';
import { filterBackorders, processPipeline, DEFAULT_FILTERS } from './utils/pipeline';

import { Navbar } from './components/Navbar';
import { KPICards } from './components/KPICards';
import { FilterToolbar } from './components/FilterToolbar';
import { PriorityTable } from './components/PriorityTable';
import { ItemDetailModal } from './components/ItemDetailModal';
import { AddWorkOrderModal } from './components/AddWorkOrderModal';
import { WorkOrderRequisitionModal } from './components/WorkOrderRequisitionModal';
import { CsvUploadModal } from './components/CsvUploadModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { ScenarioManagerModal } from './components/ScenarioManagerModal';

export default function App() {
  // Theme State
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('app_theme') as ThemeId;
    return saved && Themes[saved] ? saved : 'inventory-sync';
  });
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);

  const currentTheme = Themes[currentThemeId] || Themes['inventory-sync'];

  const handleSelectTheme = (themeId: ThemeId) => {
    setCurrentThemeId(themeId);
    localStorage.setItem('app_theme', themeId);
  };

  // State 1: Data Sources with lazy localStorage load
  const [backorders, setBackorders] = useState<RawBackorderItem[]>(() => {
    const saved = localStorage.getItem('planner_backorders');
    return saved ? JSON.parse(saved) : SAMPLE_BACKORDERS;
  });
  const [workOrders, setWorkOrders] = useState<RawWorkOrder[]>(() => {
    const saved = localStorage.getItem('planner_work_orders');
    return saved ? JSON.parse(saved) : SAMPLE_WORK_ORDERS;
  });
  const [simulatedWOs, setSimulatedWOs] = useState<SimulatedWorkOrder[]>(() => {
    const saved = localStorage.getItem('planner_simulated_wos');
    return saved ? JSON.parse(saved) : [];
  });

  // State 2: Filters & Custom Priority Order with lazy localStorage load
  const [filters, setFilters] = useState<FilterSettings>(() => {
    const saved = localStorage.getItem('planner_filters');
    return saved ? JSON.parse(saved) : DEFAULT_FILTERS;
  });
  const [userCustomRanks, setUserCustomRanks] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('planner_user_custom_ranks');
    return saved ? JSON.parse(saved) : {};
  });

  // State 3: Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRequisitionsOpen, setIsRequisitionsOpen] = useState(false);
  const [isAddWoOpen, setIsAddWoOpen] = useState(false);
  const [isScenariosOpen, setIsScenariosOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<ProcessedPriorityItem | null>(null);
  const [selectedItemForWo, setSelectedItemForWo] = useState<ProcessedPriorityItem | null>(null);

  // Auto-Save Effects
  useEffect(() => {
    localStorage.setItem('planner_backorders', JSON.stringify(backorders));
  }, [backorders]);

  useEffect(() => {
    localStorage.setItem('planner_work_orders', JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem('planner_simulated_wos', JSON.stringify(simulatedWOs));
  }, [simulatedWOs]);

  useEffect(() => {
    localStorage.setItem('planner_filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem('planner_user_custom_ranks', JSON.stringify(userCustomRanks));
  }, [userCustomRanks]);


  // Power Query Processing Pipeline
  const filteredBackorders = useMemo(() => {
    return filterBackorders(backorders, filters);
  }, [backorders, filters]);

  const processedItems = useMemo(() => {
    return processPipeline(
      filteredBackorders,
      workOrders,
      simulatedWOs,
      filters,
      userCustomRanks
    );
  }, [filteredBackorders, workOrders, simulatedWOs, filters, userCustomRanks]);

  // Counts
  const totalShortages = processedItems.filter(i => i.coverageStatus === 'Need More WOs').length;
  const totalCovered = processedItems.filter(i => i.coverageStatus === 'Covered').length;

  // Handlers
  const handleResetToSample = () => {
    if (confirm('Are you sure you want to reset all current changes back to the default sample dataset?')) {
      setBackorders(SAMPLE_BACKORDERS);
      setWorkOrders(SAMPLE_WORK_ORDERS);
      setSimulatedWOs([]);
      setUserCustomRanks({});
      setFilters(DEFAULT_FILTERS);
      localStorage.removeItem('planner_backorders');
      localStorage.removeItem('planner_work_orders');
      localStorage.removeItem('planner_simulated_wos');
      localStorage.removeItem('planner_filters');
      localStorage.removeItem('planner_user_custom_ranks');
    }
  };

  const handleLoadScenario = (scenario: SavedScenario) => {
    setBackorders(scenario.backorders);
    setWorkOrders(scenario.workOrders);
    setSimulatedWOs(scenario.simulatedWOs);
    setFilters(scenario.filters);
    setUserCustomRanks(scenario.userCustomRanks);
  };

  const handleFilterChange = (updated: Partial<FilterSettings>) => {
    setFilters(prev => ({ ...prev, ...updated }));
  };

  const handleMovePriority = (itemCode: string, direction: 'UP' | 'DOWN') => {
    const idx = processedItems.findIndex(i => i.item === itemCode);
    if (idx === -1) return;

    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= processedItems.length) return;

    const currentItem = processedItems[idx];
    const targetItem = processedItems[targetIdx];

    const currentRank = currentItem.priority;
    const targetRank = targetItem.priority;

    setUserCustomRanks(prev => ({
      ...prev,
      [currentItem.item]: targetRank,
      [targetItem.item]: currentRank
    }));
  };

  const handleOpenSimulateWo = (item?: ProcessedPriorityItem) => {
    setSelectedItemForWo(item || null);
    setIsAddWoOpen(true);
  };

  const handleAddSimulatedWo = (newWo: SimulatedWorkOrder) => {
    setSimulatedWOs(prev => [...prev, newWo]);
  };

  const handleRemoveSimulatedWo = (id: string) => {
    setSimulatedWOs(prev => prev.filter(w => w.id !== id));
  };

  const handleApplyUploadedData = (
    newBackorders: RawBackorderItem[],
    newWorkOrders: RawWorkOrder[]
  ) => {
    if (newBackorders.length > 0) {
      setBackorders(newBackorders);
    }
    if (newWorkOrders.length > 0) {
      setWorkOrders(newWorkOrders);
    }
    setSimulatedWOs([]);
    setUserCustomRanks({});
  };

  const handleExportCsv = () => {
    let csv = `Priority,Item,Description,Customer Name,Sales Orders,Netstock Indicator,Total BO Qty,Total BO Value,Earliest Stock Required By,Earliest Ship Date,Scheduled Qty,Earliest WO Start,WO Numbers,Coverage Balance,Coverage Status\n`;

    processedItems.forEach(row => {
      const descEsc = `"${row.description.replace(/"/g, '""')}"`;
      const custEsc = `"${row.customerName.replace(/"/g, '""')}"`;
      const soEsc = `"${row.salesOrders.replace(/"/g, '""')}"`;
      const woEsc = `"${row.woNumbers.replace(/"/g, '""')}"`;

      csv += `${row.priority},${row.item},${descEsc},${custEsc},${soEsc},"${row.netstockIndicator}",${row.totalBOQty},${row.totalBOValue},${row.earliestStockRequiredBy},${row.earliestShipDate},${row.scheduledQty},${row.earliestWOStart || ''},${woEsc},${row.coverageBalance},"${row.coverageStatus}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sydney_Export_Priority_Schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen ${currentTheme.appBg} flex flex-col font-sans antialiased transition-colors duration-200`}>
      {/* Top Navigation */}
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenRequisitions={() => setIsRequisitionsOpen(true)}
        onExportCsv={handleExportCsv}
        onResetToSample={handleResetToSample}
        onOpenAddWo={() => {
          setSelectedItemForWo(null);
          setIsAddWoOpen(true);
        }}
        onOpenThemeSelector={() => setIsThemeSelectorOpen(true)}
        onOpenScenarios={() => setIsScenariosOpen(true)}
        currentThemeId={currentThemeId}
        totalShortages={totalShortages}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Metric Cards */}
        <KPICards items={processedItems} currentThemeId={currentThemeId} />

        {/* Filter Toolbar */}
        <FilterToolbar
          filters={filters}
          onFilterChange={handleFilterChange}
          shortageCount={totalShortages}
          coveredCount={totalCovered}
          totalCount={processedItems.length}
          currentThemeId={currentThemeId}
        />

        {/* Priority Schedule Table */}
        <PriorityTable
          items={processedItems}
          onSelectItem={item => setSelectedItemForDetail(item)}
          onOpenSimulateWo={item => {
            setSelectedItemForWo(item);
            setIsAddWoOpen(true);
          }}
          onMovePriority={handleMovePriority}
          currentThemeId={currentThemeId}
        />
      </main>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
        currentThemeId={currentThemeId}
        onSelectTheme={handleSelectTheme}
      />

      {/* Modals & Drawers */}
      {isUploadOpen && (
        <CsvUploadModal
          onClose={() => setIsUploadOpen(false)}
          onApplyUploadedData={handleApplyUploadedData}
        />
      )}

      {isRequisitionsOpen && (
        <WorkOrderRequisitionModal
          items={processedItems}
          onClose={() => setIsRequisitionsOpen(false)}
        />
      )}

      {isAddWoOpen && (
        <AddWorkOrderModal
          selectedItem={selectedItemForWo}
          allItems={processedItems}
          onClose={() => {
            setIsAddWoOpen(false);
            setSelectedItemForWo(null);
          }}
          onAddWorkOrder={handleAddSimulatedWo}
        />
      )}

      {selectedItemForDetail && (
        <ItemDetailModal
          item={selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          simulatedWOs={simulatedWOs}
          onAddSimulatedWo={handleAddSimulatedWo}
          onRemoveSimulatedWo={handleRemoveSimulatedWo}
          onOpenSimulateWo={handleOpenSimulateWo}
        />
      )}

      {isScenariosOpen && (
        <ScenarioManagerModal
          isOpen={isScenariosOpen}
          onClose={() => setIsScenariosOpen(false)}
          currentThemeId={currentThemeId}
          backorders={backorders}
          workOrders={workOrders}
          simulatedWOs={simulatedWOs}
          filters={filters}
          userCustomRanks={userCustomRanks}
          onLoadScenario={handleLoadScenario}
        />
      )}
    </div>
  );
}

