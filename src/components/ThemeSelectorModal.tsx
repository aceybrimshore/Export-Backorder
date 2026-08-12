import React from 'react';
import { Palette, Check, X, Sparkles } from 'lucide-react';
import { ThemeId, Themes, ThemeConfig } from '../theme';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const currentTheme = Themes[currentThemeId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div
        className={`relative w-full max-w-4xl rounded-xl border ${currentTheme.modalBorder} ${currentTheme.modalBg} ${currentTheme.modalText} shadow-2xl p-6 transition-all my-8 max-h-[90vh] flex flex-col`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${currentTheme.logoBg} ${currentTheme.logoText}`}>
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Choose App Look & Feel</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {Object.keys(Themes).length} Distinct Themes
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Select any visual theme below to instantly re-style the entire application UI layout, colors, and typography.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-1 flex-1 py-1">
          {(Object.keys(Themes) as ThemeId[]).map((themeKey) => {
            const theme: ThemeConfig = Themes[themeKey];
            const isSelected = theme.id === currentThemeId;

            return (
              <button
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                }}
                className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between relative group ${
                  isSelected
                    ? `${theme.badgeBorder} ring-2 ring-amber-500/60 bg-amber-500/10 shadow-lg`
                    : 'border-slate-700/60 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-800/80'
                }`}
              >
                {/* Active Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-md">
                    <Check className="w-3.5 h-3.5" /> Active
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-3.5 h-3.5 rounded-full ${theme.previewColor} shadow-sm border border-white/20`} />
                    <h3 className="font-bold text-sm tracking-tight text-white group-hover:text-amber-400 transition-colors">
                      {theme.name}
                    </h3>
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border ${
                        theme.mode === 'dark'
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {theme.mode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {theme.subtitle}
                  </p>
                </div>

                {/* Mini Preview Bar */}
                <div className="w-full h-7 rounded-lg overflow-hidden border border-slate-700/60 flex items-center px-2 justify-between text-[11px] font-mono bg-slate-950/80">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-sm ${theme.previewColor}`} />
                    <span className="text-slate-300 truncate max-w-[120px]">{theme.name.split('.')[1]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px]">Header</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 text-[9px]">Table</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-700/50 mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Current style:</span>
            <span className="font-semibold text-amber-400">{currentTheme.name}</span>
          </div>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all shadow-md ${currentTheme.accentButtonBg} ${currentTheme.accentButtonHover} ${currentTheme.accentButtonText}`}
          >
            Apply Theme
          </button>
        </div>
      </div>
    </div>
  );
};
