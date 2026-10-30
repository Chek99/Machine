/**
 * Kenya Power and Lighting Company (KPLC) EPRA Gazetted Tariff Schedule
 * Commercial Tariffs for Kenyan Workshops (Small Commercial SC & CI1)
 */
import { KenyaPowerTariff } from '../types';

export const DEFAULT_KENYA_TARIFF: KenyaPowerTariff = {
  tariffName: 'Small Commercial (SC) — Single Phase',
  baseEnergyRatePerKwh: 15.20,
  fuelEnergyChargePerKwh: 4.14,
  forexAdjustmentPerKwh: 1.82,
  warmaLevyPerKwh: 0.02,
  epraLevyPerKwh: 0.08,
  repLevyPercent: 5.0, // 5% of base energy charge
  inflationAdjustmentPerKwh: 0.67,
  vatRatePercent: 16.0, // 16% VAT
  fixedMonthlyCharge: 0.0, // Removed in recent EPRA harmonizations for SC
};

export const ALTERNATE_KENYA_TARIFF_CI1: KenyaPowerTariff = {
  tariffName: 'Commercial & Industrial (CI1) — Workshop Feed',
  baseEnergyRatePerKwh: 12.80,
  fuelEnergyChargePerKwh: 4.14,
  forexAdjustmentPerKwh: 1.82,
  warmaLevyPerKwh: 0.02,
  epraLevyPerKwh: 0.08,
  repLevyPercent: 5.0,
  inflationAdjustmentPerKwh: 0.67,
  vatRatePercent: 16.0,
  fixedMonthlyCharge: 500.0,
};

/**
 * Calculates the exact effective per-kWh rate in KES inclusive of all EPRA levies and VAT
 */
export function calculateEffectiveKwhRate(tariff: KenyaPowerTariff): {
  base: number;
  fuel: number;
  forex: number;
  rep: number;
  epra: number;
  warma: number;
  inflation: number;
  subtotalPreVat: number;
  vatAmount: number;
  effectiveRatePerKwh: number;
} {
  const base = tariff.baseEnergyRatePerKwh;
  const fuel = tariff.fuelEnergyChargePerKwh;
  const forex = tariff.forexAdjustmentPerKwh;
  const rep = (tariff.repLevyPercent / 100) * base;
  const epra = tariff.epraLevyPerKwh;
  const warma = tariff.warmaLevyPerKwh;
  const inflation = tariff.inflationAdjustmentPerKwh;

  // Subtotal subject to VAT (In Kenya, VAT 16% applies to base, fuel, forex, rep, inflation)
  const taxableSum = base + fuel + forex + rep + inflation;
  const vatAmount = taxableSum * (tariff.vatRatePercent / 100);

  const subtotalPreVat = taxableSum + epra + warma;
  const effectiveRatePerKwh = subtotalPreVat + vatAmount;

  return {
    base,
    fuel,
    forex,
    rep,
    epra,
    warma,
    inflation,
    subtotalPreVat,
    vatAmount,
    effectiveRatePerKwh,
  };
}
