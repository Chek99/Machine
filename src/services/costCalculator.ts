/**
 * GhostLoad Electricity Cost & Waste Economic Engine
 * Computes energy expenditure and avoidable monetary waste using Kenyan EPRA Tariffs.
 */
import { calculateEffectiveKwhRate } from '../data/kenyaTariffs';
import { KenyaPowerTariff, StateCostKES, StateDurationSeconds, StateKWh, WasteSummary } from '../types';

export interface PowerAveragesW {
  PRODUCTIVE: number;
  STANDBY: number;
  ABNORMAL: number;
  AVOIDABLE_IDLE: number;
  nominalBaselineW: number;
}

/**
 * Pure function: converts duration (seconds) and average power (W) to energy (kWh)
 */
export function calculateStateKWh(
  durations: StateDurationSeconds,
  avgPower: PowerAveragesW
): StateKWh {
  const toKWh = (powerW: number, seconds: number) => {
    if (powerW <= 0 || seconds <= 0) return 0;
    return (powerW * seconds) / (3600 * 1000);
  };

  return {
    PRODUCTIVE: toKWh(avgPower.PRODUCTIVE, durations.PRODUCTIVE),
    STANDBY: toKWh(avgPower.STANDBY, durations.STANDBY),
    ABNORMAL: toKWh(avgPower.ABNORMAL, durations.ABNORMAL),
    AVOIDABLE_IDLE: toKWh(avgPower.AVOIDABLE_IDLE, durations.AVOIDABLE_IDLE),
  };
}

/**
 * Pure function: converts kWh in each state to KES based on EPRA tariff
 */
export function calculateStateCostsKES(
  stateKWh: StateKWh,
  tariff: KenyaPowerTariff,
  avgPower: PowerAveragesW,
  durations: StateDurationSeconds
): StateCostKES {
  const { effectiveRatePerKwh } = calculateEffectiveKwhRate(tariff);

  const productiveCost = stateKWh.PRODUCTIVE * effectiveRatePerKwh;
  const standbyCost = stateKWh.STANDBY * effectiveRatePerKwh;
  const idleCost = stateKWh.AVOIDABLE_IDLE * effectiveRatePerKwh;
  const abnormalTotalCost = stateKWh.ABNORMAL * effectiveRatePerKwh;

  // For abnormal waste, only the *excess* power over nominal baseline is considered waste:
  const excessAbnormalRatio = avgPower.ABNORMAL > avgPower.nominalBaselineW && avgPower.ABNORMAL > 0
    ? (avgPower.ABNORMAL - avgPower.nominalBaselineW) / avgPower.ABNORMAL
    : 0.25; // default 25% waste if exact baseline is missing
  
  const abnormalWasteCost = abnormalTotalCost * excessAbnormalRatio;

  // Avoidable waste = 100% of standby during breaks/off-hours + 100% of avoidable idle + abnormal excess
  const totalWasteCost = standbyCost + idleCost + abnormalWasteCost;
  const totalCost = productiveCost + standbyCost + idleCost + abnormalTotalCost;

  return {
    PRODUCTIVE: roundTwoDecimals(productiveCost),
    STANDBY: roundTwoDecimals(standbyCost),
    ABNORMAL: roundTwoDecimals(abnormalTotalCost),
    AVOIDABLE_IDLE: roundTwoDecimals(idleCost),
    totalCost: roundTwoDecimals(totalCost),
    totalWasteCost: roundTwoDecimals(totalWasteCost),
  };
}

/**
 * Computes forward-looking waste projections & hardware payback period
 */
export function computeWasteProjections(
  todayWasteKES: number,
  todayWasteKWh: number,
  hardwareDeploymentCostKES: number,
  operatingDaysPerMonth: number = 26
): WasteSummary & { paybackPeriodMonths: number; paybackPeriodDays: number } {
  const projectedMonthlyWasteKES = todayWasteKES * operatingDaysPerMonth;
  const projectedAnnualWasteKES = projectedMonthlyWasteKES * 12;

  // Assuming an actionable workshop recovers 65% of detected waste by auto-tripping idlers & fixing tool drag
  const recoverableMonthlySavingsKES = projectedMonthlyWasteKES * 0.65;
  const paybackPeriodMonths = recoverableMonthlySavingsKES > 0
    ? roundTwoDecimals(hardwareDeploymentCostKES / recoverableMonthlySavingsKES)
    : 999;
  const paybackPeriodDays = Math.round(paybackPeriodMonths * 30);

  // Kenya grid emission factor: ~0.38 kg CO2 / kWh
  const potentialCo2SavedKg = roundTwoDecimals(todayWasteKWh * 0.38 * operatingDaysPerMonth * 12);

  return {
    standbyCostKES: 0,
    idleCostKES: 0,
    abnormalCostKES: 0,
    totalWasteCostKES: roundTwoDecimals(todayWasteKES),
    totalWasteKWh: roundTwoDecimals(todayWasteKWh),
    projectedMonthlyWasteKES: Math.round(projectedMonthlyWasteKES),
    projectedAnnualWasteKES: Math.round(projectedAnnualWasteKES),
    potentialCo2SavedKg,
    paybackPeriodMonths,
    paybackPeriodDays,
  };
}

/**
 * Sensitivity Analysis for Measurement Tolerance (±5% CT / ADC margin)
 */
export function calculateSensitivityRange(nominalKES: number, tolerancePercent: number = 5) {
  const delta = (nominalKES * tolerancePercent) / 100;
  return {
    minKES: roundTwoDecimals(nominalKES - delta),
    nominalKES: roundTwoDecimals(nominalKES),
    maxKES: roundTwoDecimals(nominalKES + delta),
    marginDeltaKES: roundTwoDecimals(delta),
  };
}

function roundTwoDecimals(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Self-contained Unit Tests for Cost Calculations
 */
export function runCostModelUnitTests(tariff: KenyaPowerTariff) {
  const tests: { name: string; passed: boolean; message: string }[] = [];

  // Test 1: Zero usage equals zero cost
  const zeroKWh: StateKWh = { PRODUCTIVE: 0, STANDBY: 0, ABNORMAL: 0, AVOIDABLE_IDLE: 0 };
  const zeroAverages: PowerAveragesW = { PRODUCTIVE: 0, STANDBY: 0, ABNORMAL: 0, AVOIDABLE_IDLE: 0, nominalBaselineW: 0 };
  const zeroDurations: StateDurationSeconds = { PRODUCTIVE: 0, STANDBY: 0, ABNORMAL: 0, AVOIDABLE_IDLE: 0, OFF: 0 };
  const zeroResult = calculateStateCostsKES(zeroKWh, tariff, zeroAverages, zeroDurations);
  tests.push({
    name: 'Zero Usage Test (Edge Case)',
    passed: zeroResult.totalCost === 0 && zeroResult.totalWasteCost === 0,
    message: `Expected KES 0.00, received KES ${zeroResult.totalCost}`,
  });

  // Test 2: Known energy test (10 kWh consumed)
  const knownKWh: StateKWh = { PRODUCTIVE: 10, STANDBY: 0, ABNORMAL: 0, AVOIDABLE_IDLE: 0 };
  const knownResult = calculateStateCostsKES(knownKWh, tariff, zeroAverages, zeroDurations);
  const { effectiveRatePerKwh } = calculateEffectiveKwhRate(tariff);
  const expectedCost = roundTwoDecimals(10 * effectiveRatePerKwh);
  tests.push({
    name: 'Known 10 kWh Hand-Calculation Test',
    passed: Math.abs(knownResult.PRODUCTIVE - expectedCost) < 0.05,
    message: `Expected KES ${expectedCost}, calculated KES ${knownResult.PRODUCTIVE} (Effective Rate: KES ${effectiveRatePerKwh.toFixed(2)}/kWh)`,
  });

  // Test 3: Conservation of energy (Sum of state costs equals total cost)
  const mixedKWh: StateKWh = { PRODUCTIVE: 15.5, STANDBY: 2.1, ABNORMAL: 4.3, AVOIDABLE_IDLE: 8.4 };
  const mixedResult = calculateStateCostsKES(mixedKWh, tariff, {
    PRODUCTIVE: 1500,
    STANDBY: 20,
    ABNORMAL: 2200,
    AVOIDABLE_IDLE: 900,
    nominalBaselineW: 1400,
  }, {
    PRODUCTIVE: 36000,
    STANDBY: 18000,
    ABNORMAL: 7200,
    AVOIDABLE_IDLE: 33600,
    OFF: 0,
  });
  const sumStates = mixedResult.PRODUCTIVE + mixedResult.STANDBY + mixedResult.ABNORMAL + mixedResult.AVOIDABLE_IDLE;
  tests.push({
    name: 'State Cost Additivity (Sum Check)',
    passed: Math.abs(sumStates - mixedResult.totalCost) < 0.05,
    message: `Sum of states (KES ${sumStates.toFixed(2)}) == Total (KES ${mixedResult.totalCost.toFixed(2)})`,
  });

  // Test 4: Payback calculation integrity
  const paybackTest = computeWasteProjections(650, 24, 5500, 26);
  tests.push({
    name: 'Payback Estimation Validity',
    passed: paybackTest.paybackPeriodMonths > 0 && paybackTest.paybackPeriodMonths < 12,
    message: `Hardware cost KES 5,500 amortized in ${paybackTest.paybackPeriodDays} days with daily waste KES 650`,
  });

  return tests;
}
