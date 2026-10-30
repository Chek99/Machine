import React from 'react';
import { AlertTriangle, Clock, Flame, SlidersHorizontal, TrendingDown } from 'lucide-react';
import { WorkshopSummary } from '../services/telemetryStore';
import { KenyaPowerTariff } from '../types';
import { calculateEffectiveKwhRate } from '../data/kenyaTariffs';

interface HeadlineWidgetProps {
  summary: WorkshopSummary;
  tariff: KenyaPowerTariff;
  onOpenTariffModal: () => void;
  standbyWasteKES: number;
  idleWasteKES: number;
  abnormalWasteKES: number;
}

export const HeadlineWidget: React.FC<HeadlineWidgetProps> = ({
  summary,
  tariff,
  onOpenTariffModal,
  standbyWasteKES,
  idleWasteKES,
  abnormalWasteKES,
}) => {
  const { effectiveRatePerKwh } = calculateEffectiveKwhRate(tariff);

  // Real-time instantaneous waste rate in KES per hour
  // Calculated from currently idling or standby power draws
  const currentWasteKWhPerHour = (summary.totalRealPowerW * (summary.wastePercentage / 100)) / 1000;
  const currentWasteRateKESPerHour = Math.round(currentWasteKWhPerHour * effectiveRatePerKwh * 10) / 10;

  // Monthly projection (26 working days)
  const monthlyProjectedWasteKES = Math.round(summary.totalWasteCostTodayKES * 26);
  // Annual projection
  const annualProjectedWasteKES = Math.round(monthlyProjectedWasteKES * 12);

  // Kenyan artisan daily wage benchmark (~KES 800 - 1200 / day in Industrial Area)
  const equivalentArtisanDays = (summary.totalWasteCostTodayKES / 950).toFixed(1);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Subtle ambient gradient highlight */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left Column: Primary Money Metric for Projector Readability */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-400/90">
              Workshop Energy Waste Monitor
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">
              {tariff.tariffName} (KES {effectiveRatePerKwh.toFixed(2)}/kWh)
            </span>
            <button
              onClick={onOpenTariffModal}
              className="text-xs text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer underline decoration-dotted"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Edit Tariff</span>
            </button>
          </div>

          <div className="flex items-baseline gap-4 flex-wrap">
            <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white tabular-nums">
              KES {summary.totalWasteCostTodayKES.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-rose-400 flex items-center gap-1 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
              <span>{summary.wastePercentage}% of Total Power Bill</span>
            </span>
          </div>

          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Invisible electrical waste accumulated today across 4 workshop machines. Equivalent to{' '}
            <strong className="text-amber-300">{equivalentArtisanDays} artisan daily wages</strong> or{' '}
            <strong className="text-amber-300">KES {monthlyProjectedWasteKES.toLocaleString()}/month</strong> in preventable overhead.
          </p>
        </div>

        {/* Right Column: Instantaneous Run-Rate & Projections */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Current Waste Rate</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              KES {currentWasteRateKESPerHour.toFixed(1)}
              <span className="text-xs text-slate-400 font-normal"> /hr</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>30-Day Projected</span>
            </div>
            <div className="text-xl font-bold text-rose-300 tabular-nums">
              KES {monthlyProjectedWasteKES.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-sky-400" />
              <span>Annual Potential</span>
            </div>
            <div className="text-xl font-bold text-sky-300 tabular-nums">
              KES {annualProjectedWasteKES.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Strip by Waste Type */}
      <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div>
            <div className="text-xs font-medium text-amber-400">Avoidable Idle Waste</div>
            <div className="text-xs text-slate-400">Motor spinning with no cutting/load</div>
          </div>
          <div className="text-lg font-bold text-amber-300 tabular-nums">
            KES {Math.round(idleWasteKES)}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <div>
            <div className="text-xs font-medium text-blue-400">Standby Vampire Draw</div>
            <div className="text-xs text-slate-400">Energized off-hours & tea breaks</div>
          </div>
          <div className="text-lg font-bold text-blue-300 tabular-nums">
            KES {Math.round(standbyWasteKES)}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
          <div>
            <div className="text-xs font-medium text-rose-400">Abnormal / Inefficient</div>
            <div className="text-xs text-slate-400">Dull tooling, low PF & bearing drag</div>
          </div>
          <div className="text-lg font-bold text-rose-300 tabular-nums">
            KES {Math.round(abnormalWasteKES)}
          </div>
        </div>
      </div>
    </div>
  );
};
