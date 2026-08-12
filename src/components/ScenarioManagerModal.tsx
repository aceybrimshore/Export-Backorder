import React, { useState, useRef } from 'react';
import {
  X,
  Save,
  FolderOpen,
  Trash2,
  Download,
  Upload,
  Calendar,
  Plus,
  Database,
  Check,
  AlertCircle,
  FileText
} from 'lucide-react';
import { ThemeId, Themes } from '../theme';
import { SavedScenario, RawBackorderItem, RawWorkOrder, SimulatedWorkOrder, FilterSettings } from '../types';

interface ScenarioManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: ThemeId;
  
  // Current active states to save
  backorders: RawBackorderItem[];
  workOrders: RawWorkOrder[];
  simulatedWOs: SimulatedWorkOrder[];
  filters: FilterSettings;
  userCustomRanks: Record<string, number>;
  
  // Action callbacks
  onLoadScenario: (scenario: SavedScenario) => void;
}

export const ScenarioManagerModal: React.FC<ScenarioManagerModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  backorders,
  workOrders,
  simulatedWOs,
  filters,
  userCustomRanks,
  onLoadScenario
}) => {
  const currentTheme = Themes[currentThemeId] || Themes['inventory-sync'];
  const isLight = currentTheme.mode === 'light';
  
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => {
    const saved = localStorage.getItem('planner_scenarios');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newScenarioName, setNewScenarioName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const saveScenariosToStorage = (updated: SavedScenario[]) => {
    setScenarios(updated);
    localStorage.setItem('planner_scenarios', JSON.stringify(updated));
  };

  const handleCreateScenario = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newScenarioName.trim()) {
      setErrorMsg('Please enter a scenario name.');
      return;
    }

    const newScenario: SavedScenario = {
      id: `scenario-${Date.now()}`,
      name: newScenarioName.trim(),
      createdAt: new Date().toISOString(),
      backorders,
      workOrders,
      simulatedWOs,
      filters,
      userCustomRanks
    };

    const updated = [newScenario, ...scenarios];
    saveScenariosToStorage(updated);
    setNewScenarioName('');
    setSuccessMsg(`Scenario "${newScenario.name}" saved successfully!`);
    
    // Clear message after 3 seconds
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLoadScenario = (scenario: SavedScenario) => {
    onLoadScenario(scenario);
    setSuccessMsg(`Loaded scenario: "${scenario.name}"`);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 800);
  };

  const handleDeleteScenario = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete scenario "${name}"?`)) {
      const updated = scenarios.filter(s => s.id !== id);
      saveScenariosToStorage(updated);
    }
  };

  const handleExportScenario = (scenario: SavedScenario) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenario, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Planner_Scenario_${scenario.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportScenario = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as SavedScenario;
        
        // Basic schema verification
        if (!imported.name || !Array.isArray(imported.backorders) || !Array.isArray(imported.workOrders)) {
          setErrorMsg('Invalid file format. Please upload a valid Planner Scenario JSON file.');
          return;
        }

        // Assign a new ID & timestamp to avoid duplicate collision or record creation times
        const newImport: SavedScenario = {
          ...imported,
          id: `scenario-imported-${Date.now()}`,
          createdAt: new Date().toISOString()
        };

        const updated = [newImport, ...scenarios];
        saveScenariosToStorage(updated);
        setSuccessMsg(`Imported scenario "${imported.name}" successfully!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err) {
        setErrorMsg('Failed to parse scenario file. Make sure it is valid JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl space-y-6 my-8 transition-colors duration-200 ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-900' 
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isLight ? 'bg-blue-100 text-blue-700' : 'bg-amber-500/10 text-amber-400'
            }`}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Saved Scenarios Manager</h2>
              <p className="text-xs opacity-75">Save, load, and share multiple production schedules</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl p-3 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl p-3 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Save Current State Form */}
        <form onSubmit={handleCreateScenario} className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider opacity-85">
            Save Current State as New Scenario
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              placeholder="e.g. Sydney Schedule Aug 2026, Urgent Priority, etc."
              className={`flex-1 px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500/30'
                  : 'bg-slate-950 border-slate-800 text-white focus:ring-amber-500/50'
              }`}
            />
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 hover:scale-102 active:scale-98 cursor-pointer ${
                isLight 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Config</span>
            </button>
          </div>
        </form>

        {/* Import Scenario Section */}
        <div className="p-4 rounded-xl border border-dashed flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-500/5 border-slate-300 dark:border-slate-800">
          <div>
            <p className="font-semibold">Import External Scenario File</p>
            <p className="opacity-70 mt-0.5">Upload a previously exported Planner JSON scenario configuration</p>
          </div>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleImportScenario}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs border rounded-lg transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${
                isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-800/80 text-slate-200 border-slate-700/60'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>

        {/* Saved Scenarios List */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-85 flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
            Saved Profiles / Scenarios ({scenarios.length})
          </h3>

          <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-1 divide-y divide-slate-100 dark:divide-slate-800">
            {scenarios.length > 0 ? (
              scenarios.map((scenario) => {
                const totalBOVal = scenario.backorders.reduce((sum, item) => sum + (item.backOrderValue || 0), 0);
                const activeFiltersCount = Object.values(scenario.filters).filter(v => v !== 'ALL' && v !== '' && v !== false && v !== 0).length;

                return (
                  <div 
                    key={scenario.id} 
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-500/5 rounded-lg transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                          {scenario.name}
                        </span>
                        <span className={`text-[9px] font-mono font-semibold px-2 py-0.2 rounded border ${
                          isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800/80 text-slate-300 border-slate-700'
                        }`}>
                          {scenario.backorders.length} SKUs
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] opacity-75 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 opacity-60" />
                          {new Date(scenario.createdAt).toLocaleString()}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          ${totalBOVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Demand Value
                        </span>
                        <span>
                          {scenario.simulatedWOs.length} Sim WOs
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => handleLoadScenario(scenario)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                        title="Load this saved scenario"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Load</span>
                      </button>
                      
                      <button
                        onClick={() => handleExportScenario(scenario)}
                        className={`p-1.5 text-xs border rounded-lg transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${
                          isLight ? 'bg-white border-slate-300 text-slate-600' : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
                        }`}
                        title="Download scenario JSON backup"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteScenario(scenario.id, scenario.name)}
                        className="p-1.5 text-xs border border-rose-200 dark:border-rose-950 text-rose-600 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-700/80 rounded-lg transition-all"
                        title="Delete scenario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                <FileText className="w-8 h-8 opacity-50 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No custom scenarios saved yet.</p>
                <p className="mt-0.5 opacity-85">Type a name above and click "Save Config" to capture your current work.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="opacity-75 font-medium flex items-center gap-1">
            <Check className="w-4 h-4 text-emerald-500 animate-bounce" />
            <span>Active draft is always safely auto-saved locally.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
