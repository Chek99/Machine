import React, { useState } from 'react';
import { 
  Zap, 
  Activity, 
  Gauge, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  ShieldCheck,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';
import { HeadlineWidget } from '../components/HeadlineWidget';
import { HardwareSimulatorBar } from '../components/HardwareSimulatorBar';
import { MachineCard } from '../components/MachineCard';
import { AlertsDrawer } from '../components/AlertsDrawer';
import { TariffModal } from '../components/TariffModal';
import { telemetryStore, WorkshopSummary } from '../services/telemetryStore';
import { KenyaPowerTariff } from '../types';

interface LiveDashboardViewProps {
  summary: WorkshopSummary;
  tariff: KenyaPowerTariff;
  onUpdateTariff: (tariff: KenyaPowerTariff) => void;
}

export const LiveDashboardView: React.FC<LiveDashboardViewProps> = ({
  summary,
  tariff,
  onUpdateTariff,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>('MCH-01');
  const [isTariffModalOpen, setIsTariffModalOpen] = useState<boolean>(false);

  const machines = telemetryStore.getMachines();
  const alerts = telemetryStore.getAlerts();
  const isWifiOnline = telemetryStore.isWifiOnline();
  const offlineBufferCount = telemetryStore.getOfflineBufferCount();

  // Compute breakdown across all machines
  let standbyWaste = 0;
  let idleWaste = 0;
  let abnormalWaste = 0;

  // Approximate category splits
  standbyWaste = summary.totalWasteCostTodayKES * 0.22;
  idleWaste = summary.totalWasteCostTodayKES * 0.61;
  abnormalWaste = summary.totalWasteCostTodayKES * 0.17;

  return (
    <div className="space-y-6">
      {/* Top Banner Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 px-4 py-2.5 rounded-xl text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-white">Nairobi Workshop Cohort 1</span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">4 Active Machines (230V 50Hz Single-Phase)</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            {isWifiOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ESP32 Hotspot Stream Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                Hotspot Offline ({offlineBufferCount} queued in LittleFS)
              </span>
            )}
          </div>
          <span className="text-slate-600">·</span>
          <div className="text-slate-400 font-mono">
            Grid PF: <strong className={summary.avgPowerFactor < 0.75 ? 'text-amber-400' : 'text-emerald-400'}>{summary.avgPowerFactor.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Primary Headline Widget */}
      <HeadlineWidget
        summary={summary}
        tariff={tariff}
        onOpenTariffModal={() => setIsTariffModalOpen(true)}
        standbyWasteKES={standbyWaste}
        idleWasteKES={idleWaste}
        abnormalWasteKES={abnormalWaste}
      />

      {/* Hardware Lab & Live Simulator Bar */}
      <HardwareSimulatorBar
        selectedMachineId={selectedMachineId}
        setSelectedMachineId={setSelectedMachineId}
        isWifiOnline={isWifiOnline}
        offlineBufferCount={offlineBufferCount}
      />

      {/* Actionable Alerts Drawer */}
      <AlertsDrawer
        alerts={alerts}
        onAcknowledge={(id) => telemetryStore.acknowledgeAlert(id)}
      />

      {/* Multi-Machine Workshop Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Monitored Workshop Machinery</span>
          </h2>
          <span className="text-xs text-slate-500">Click any card to select for testbench injection</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {machines.map((m) => (
            <MachineCard
              key={m.config.id}
              machineData={m}
              tariff={tariff}
              isSelected={selectedMachineId === m.config.id}
              onSelect={() => setSelectedMachineId(m.config.id)}
            />
          ))}
        </div>
      </div>

      {/* Overall Workshop Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Total Workshop Load</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            {(summary.totalRealPowerW / 1000).toFixed(2)} kW
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {summary.totalApparentPowerVA.toLocaleString()} VA Apparent
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Total Energy Today</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
            {summary.totalKWhToday.toFixed(1)} kWh
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Cumulative across 4 meters
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Daily Power Bill (Total)</div>
          <div className="text-2xl font-bold text-slate-200 mt-1 font-mono">
            KES {summary.totalCostTodayKES.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Based on EPRA SC Tariff
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Avoidable Waste Ratio</div>
          <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">
            {summary.wastePercentage}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Recoverable savings potential
          </div>
        </div>
      </div>

      {/* Tariff Edit Modal */}
      <TariffModal
        isOpen={isTariffModalOpen}
        onClose={() => setIsTariffModalOpen(false)}
        tariff={tariff}
        onSave={onUpdateTariff}
      />
    </div>
  );
};
