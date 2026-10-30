import React, { useState } from 'react';
import { X, Check, RefreshCw } from 'lucide-react';
import { KenyaPowerTariff } from '../types';
import { calculateEffectiveKwhRate, DEFAULT_KENYA_TARIFF, ALTERNATE_KENYA_TARIFF_CI1 } from '../data/kenyaTariffs';

interface TariffModalProps {
  isOpen: boolean;
  onClose: () => void;
  tariff: KenyaPowerTariff;
  onSave: (newTariff: KenyaPowerTariff) => void;
}

export const TariffModal: React.FC<TariffModalProps> = ({
  isOpen,
  onClose,
  tariff,
  onSave,
}) => {
  const [formData, setFormData] = useState<KenyaPowerTariff>({ ...tariff });

  if (!isOpen) return null;

  const currentBreakdown = calculateEffectiveKwhRate(formData);

  const handleApplyPreset = (preset: KenyaPowerTariff) => {
    setFormData({ ...preset });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Kenya Power (EPRA) Tariff Configuration</h3>
            <p className="text-xs text-slate-400">
              Gazetted electricity rates for commercial workshops & small industries in Kenya
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="my-4 flex items-center gap-2">
          <span className="text-xs text-slate-400">EPRA Presets:</span>
          <button
            onClick={() => handleApplyPreset(DEFAULT_KENYA_TARIFF)}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer"
          >
            Small Commercial (SC)
          </button>
          <button
            onClick={() => handleApplyPreset(ALTERNATE_KENYA_TARIFF_CI1)}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 cursor-pointer"
          >
            Commercial & Industrial (CI1)
          </button>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Base Energy Rate (KES / kWh)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.baseEnergyRatePerKwh}
              onChange={(e) =>
                setFormData({ ...formData, baseEnergyRatePerKwh: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Fuel Energy Charge - FCC (KES / kWh)
            </label>
            <input
              type="number"
              step="0.05"
              value={formData.fuelEnergyChargePerKwh}
              onChange={(e) =>
                setFormData({ ...formData, fuelEnergyChargePerKwh: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Forex Adjustment - FX (KES / kWh)
            </label>
            <input
              type="number"
              step="0.05"
              value={formData.forexAdjustmentPerKwh}
              onChange={(e) =>
                setFormData({ ...formData, forexAdjustmentPerKwh: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Inflation Adjustment (KES / kWh)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.inflationAdjustmentPerKwh}
              onChange={(e) =>
                setFormData({ ...formData, inflationAdjustmentPerKwh: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              REP Levy (% of Base Rate)
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.repLevyPercent}
              onChange={(e) =>
                setFormData({ ...formData, repLevyPercent: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Value Added Tax - VAT (%)
            </label>
            <input
              type="number"
              step="1"
              value={formData.vatRatePercent}
              onChange={(e) =>
                setFormData({ ...formData, vatRatePercent: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Live Calculation Output Card */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Computed Breakdown per kWh:</span>
            <span>
              Base ({currentBreakdown.base.toFixed(2)}) + Fuel ({currentBreakdown.fuel.toFixed(2)}) + FX ({currentBreakdown.forex.toFixed(2)}) + Levies ({ (currentBreakdown.rep + currentBreakdown.epra + currentBreakdown.warma + currentBreakdown.inflation).toFixed(2) }) + 16% VAT
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-slate-200">Effective Unit Energy Cost:</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono">
              KES {currentBreakdown.effectiveRatePerKwh.toFixed(2)} / kWh
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Tariff Rates</span>
          </button>
        </div>
      </div>
    </div>
  );
};
