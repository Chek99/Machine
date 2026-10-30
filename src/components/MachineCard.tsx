import React from 'react';
import { 
  Zap, 
  Activity, 
  AlertTriangle, 
  Power, 
  ShieldAlert, 
  Clock, 
  Gauge,
  TrendingDown
} from 'lucide-react';
import { MachineRuntimeData, telemetryStore } from '../services/telemetryStore';
import { KenyaPowerTariff, MachineState } from '../types';
import { calculateEffectiveKwhRate } from '../data/kenyaTariffs';
import { calculateStateCostsKES, calculateStateKWh, PowerAveragesW } from '../services/costCalculator';

interface MachineCardProps {
  machineData: MachineRuntimeData;
  tariff: KenyaPowerTariff;
  isSelected: boolean;
  onSelect: () => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({
  machineData,
  tariff,
  isSelected,
  onSelect,
}) => {
  const { config, latestTelemetry, durations, relayTripped } = machineData;
  const { effectiveRatePerKwh } = calculateEffectiveKwhRate(tariff);

  // Compute machine specific costs & waste
  const avgPower: PowerAveragesW = {
    PRODUCTIVE: config.nominalPowerW,
    STANDBY: (config.standbyPowerBandW[0] + config.standbyPowerBandW[1]) / 2,
    ABNORMAL: config.abnormalThresholdW + 100,
    AVOIDABLE_IDLE: config.nominalPowerW * 0.42,
    nominalBaselineW: config.nominalPowerW,
  };

  const stateKwh = calculateStateKWh(durations, avgPower);
  const stateCosts = calculateStateCostsKES(stateKwh, tariff, avgPower, durations);

  const stateBadgeConfig: Record<MachineState, { label: string; bg: string; text: string; border: string }> = {
    PRODUCTIVE: {
      label: 'PRODUCTIVE CUTTING',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
    STANDBY: {
      label: 'STANDBY VAMPIRE',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
    },
    AVOIDABLE_IDLE: {
      label: 'AVOIDABLE IDLE',
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/40',
    },
    ABNORMAL: {
      label: 'ABNORMAL / INEFFICIENT',
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/40',
    },
    OFF: {
      label: 'DE-ENERGIZED (OFF)',
      bg: 'bg-slate-800',
      text: 'text-slate-400',
      border: 'border-slate-700',
    },
  };

  const currentBadge = stateBadgeConfig[latestTelemetry.classifiedState] || stateBadgeConfig.STANDBY;

  // Total recorded time in hours
  const totalSeconds = Object.values(durations).reduce((a, b) => a + b, 0);
  const productivePct = totalSeconds > 0 ? (durations.PRODUCTIVE / totalSeconds) * 100 : 0;
  const idlePct = totalSeconds > 0 ? (durations.AVOIDABLE_IDLE / totalSeconds) * 100 : 0;
  const standbyPct = totalSeconds > 0 ? (durations.STANDBY / totalSeconds) * 100 : 0;
  const abnormalPct = totalSeconds > 0 ? (durations.ABNORMAL / totalSeconds) * 100 : 0;

  const handleToggleRelay = (e: React.MouseEvent) => {
    e.stopPropagation();
    telemetryStore.tripRelay(config.id);
  };

  return (
    <div
      onClick={onSelect}
      className={`bg-slate-900 border rounded-xl p-5 transition-all cursor-pointer relative ${
        isSelected
          ? 'border-amber-400/80 shadow-lg shadow-amber-500/10'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header: Machine Name & State Badge */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400">{config.id}</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">{config.type}</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
            {config.name}
          </h3>
        </div>

        {/* State Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-md border ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border} tracking-wide`}
          >
            {relayTripped ? 'RELAY TRIPPED' : currentBadge.label}
          </span>
        </div>
      </div>

      {/* Main Real-Time Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
        <div>
          <div className="text-[11px] text-slate-500">Real Power (W)</div>
          <div className="text-lg font-bold text-white tabular-nums">
            {latestTelemetry.realPowerW.toLocaleString()} W
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500">Power Factor</div>
          <div className={`text-lg font-bold tabular-nums ${latestTelemetry.powerFactor < 0.70 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {latestTelemetry.powerFactor.toFixed(2)}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500">RMS Current</div>
          <div className="text-lg font-bold text-slate-200 tabular-nums">
            {latestTelemetry.iRms.toFixed(2)} A
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500">Voltage</div>
          <div className="text-lg font-bold text-slate-200 tabular-nums">
            {latestTelemetry.vRms.toFixed(1)} V
          </div>
        </div>
      </div>

      {/* State Timeline Bar (Today's Distribution) */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span>Today's State Distribution</span>
          <span className="tabular-nums">{(totalSeconds / 3600).toFixed(1)} operating hours</span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${productivePct}%` }}
            className="h-full bg-emerald-500"
            title={`Productive: ${productivePct.toFixed(0)}%`}
          />
          <div
            style={{ width: `${idlePct}%` }}
            className="h-full bg-amber-500"
            title={`Avoidable Idle: ${idlePct.toFixed(0)}%`}
          />
          <div
            style={{ width: `${standbyPct}%` }}
            className="h-full bg-blue-500"
            title={`Standby: ${standbyPct.toFixed(0)}%`}
          />
          <div
            style={{ width: `${abnormalPct}%` }}
            className="h-full bg-rose-500"
            title={`Abnormal: ${abnormalPct.toFixed(0)}%`}
          />
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Productive ({productivePct.toFixed(0)}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Idle ({idlePct.toFixed(0)}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Standby ({standbyPct.toFixed(0)}%)
          </span>
          {abnormalPct > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Abnormal ({abnormalPct.toFixed(0)}%)
            </span>
          )}
        </div>
      </div>

      {/* Cost & Waste Summary */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-slate-500">Accumulated Waste Today</div>
          <div className="text-base font-bold text-amber-400 tabular-nums">
            KES {stateCosts.totalWasteCost.toLocaleString()}
            <span className="text-[11px] text-slate-500 font-normal ml-1">
              ({stateCosts.totalCost > 0 ? Math.round((stateCosts.totalWasteCost / stateCosts.totalCost) * 100) : 0}% waste)
            </span>
          </div>
        </div>

        {/* Action button: Remote Relay Interlock */}
        <button
          onClick={handleToggleRelay}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
            relayTripped
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 hover:bg-emerald-900'
              : 'bg-rose-950/60 text-rose-300 border-rose-800 hover:bg-rose-900/60'
          }`}
          title={relayTripped ? 'Re-engage machine relay' : 'Remotely trip machine to stop waste'}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{relayTripped ? 'Restore Power' : 'Emergency Trip'}</span>
        </button>
      </div>
    </div>
  );
};
