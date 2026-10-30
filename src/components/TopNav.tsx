import React from 'react';
import { Download } from 'lucide-react';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExportReport: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onExportReport,
}) => {
  const navLinks = [
    { id: 'dashboard', label: 'Live Dashboard' },
    { id: 'hardware', label: 'Hardware & BOM' },
    { id: 'firmware', label: 'ESP32 Firmware' },
    { id: 'classifier', label: 'State Machine' },
    { id: 'tariffs', label: 'Tariff Economics' },
    { id: 'validation', label: 'Validation Lab' },
    { id: 'pitch', label: 'Competition Pitch' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors whitespace-nowrap shrink-0">
            GhostLoad
          </span>
        </button>

        {/* Zone 2: 4-7 Single-line clean text links with subtle hover underlines */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer text-xs font-semibold ${
                  isActive
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onExportReport}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-amber-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Dossier</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar scrollable */}
      <div className="md:hidden flex items-center gap-4 px-4 py-2 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => setActiveTab(link.id)}
            className={`text-xs whitespace-nowrap shrink-0 py-1 ${
              activeTab === link.id
                ? 'text-amber-400 font-bold border-b border-amber-400'
                : 'text-slate-400'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
};
