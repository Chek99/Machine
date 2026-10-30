import React from 'react';
import { AlertTriangle, Check, Bell, Power } from 'lucide-react';
import { AlertItem } from '../types';
import { telemetryStore } from '../services/telemetryStore';

interface AlertsDrawerProps {
  alerts: AlertItem[];
  onAcknowledge: (id: string) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({ alerts, onAcknowledge }) => {
  const unacknowledged = alerts.filter((a) => !a.acknowledged);

  if (unacknowledged.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>All workshop machines operating within normal nominal baselines. No active waste alerts.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-rose-400 animate-bounce" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Actionable Waste Alerts ({unacknowledged.length})
          </h4>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">Rate-limited to 1 alert / 5 min</span>
      </div>

      <div className="space-y-2">
        {unacknowledged.slice(0, 3).map((alert) => (
          <div
            key={alert.id}
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              alert.level === 'critical'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  alert.level === 'critical' ? 'text-rose-400' : 'text-amber-400'
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-tight text-white">{alert.title}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-xs font-mono font-semibold text-amber-300">
                    KES {alert.wasteRateKESPerHour.toFixed(1)}/hr waste
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {alert.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => telemetryStore.tripRelay(alert.machineId)}
                className="px-2.5 py-1 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                title="Immediately isolate this machine to halt electrical waste"
              >
                <Power className="w-3 h-3" />
                <span>Trip Relay</span>
              </button>
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
