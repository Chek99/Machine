import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { LiveDashboardView } from './views/LiveDashboardView';
import { HardwareDesignView } from './views/HardwareDesignView';
import { FirmwareView } from './views/FirmwareView';
import { ClassifierView } from './views/ClassifierView';
import { CostModelView } from './views/CostModelView';
import { ValidationView } from './views/ValidationView';
import { PitchDeckView } from './views/PitchDeckView';
import { telemetryStore, WorkshopSummary } from './services/telemetryStore';
import { KenyaPowerTariff } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tariff, setTariff] = useState<KenyaPowerTariff>(telemetryStore.getTariff());
  const [summary, setSummary] = useState<WorkshopSummary>(telemetryStore.getWorkshopSummary());

  useEffect(() => {
    // Subscribe to real-time 1-second telemetry ticks
    const unsubscribe = telemetryStore.subscribe(() => {
      setTariff(telemetryStore.getTariff());
      setSummary(telemetryStore.getWorkshopSummary());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpdateTariff = (newTariff: KenyaPowerTariff) => {
    telemetryStore.updateTariff(newTariff);
    setTariff(telemetryStore.getTariff());
    setSummary(telemetryStore.getWorkshopSummary());
  };

  const handleExportReport = () => {
    const report = {
      project: 'GhostLoad — Industrial Energy Waste & Cost Intelligence',
      location: 'Nairobi, Kenya (Single-Phase 230V 50Hz)',
      timestamp: new Date().toISOString(),
      summary: telemetryStore.getWorkshopSummary(),
      tariff: telemetryStore.getTariff(),
      machines: telemetryStore.getMachines().map((m) => ({
        id: m.config.id,
        name: m.config.name,
        type: m.config.type,
        nominalPowerW: m.config.nominalPowerW,
        latestMetrics: m.latestTelemetry,
        stateDurationsSeconds: m.durations,
      })),
      alerts: telemetryStore.getAlerts(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GhostLoad_Workshop_Audit_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-300">
      {/* Strict Top Bar Contract Header */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportReport={handleExportReport}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <LiveDashboardView
            summary={summary}
            tariff={tariff}
            onUpdateTariff={handleUpdateTariff}
          />
        )}

        {activeTab === 'hardware' && <HardwareDesignView />}

        {activeTab === 'firmware' && <FirmwareView />}

        {activeTab === 'classifier' && <ClassifierView />}

        {activeTab === 'tariffs' && <CostModelView tariff={tariff} />}

        {activeTab === 'validation' && <ValidationView />}

        {activeTab === 'pitch' && <PitchDeckView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-400">GhostLoad Project</span>
            <span className="mx-2">·</span>
            <span>Final-Year EEE Capstone Project</span>
            <span className="mx-2">·</span>
            <span>Industrial Area, Nairobi, Kenya</span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Single-Phase 230V 50Hz · ADS1115 Discrete Integration · EPRA SC Tariff
          </div>
        </div>
      </footer>
    </div>
  );
}
