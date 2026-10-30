/**
 * GhostLoad Type Definitions
 * Industrial Energy Waste & Cost Intelligence System for Kenya
 */

export type MachineState = 
  | 'PRODUCTIVE'
  | 'STANDBY'
  | 'ABNORMAL'
  | 'AVOIDABLE_IDLE'
  | 'OFF';

export interface TelemetryPacket {
  deviceId: string;
  machineId: string;
  timestamp: number; // Unix ms
  vRms: number; // Volts RMS (e.g., 231.4)
  iRms: number; // Amps RMS (e.g., 4.22)
  realPowerW: number; // Instantaneous V*I average in Watts (e.g., 880.5)
  apparentPowerVA: number; // Vrms * Irms (e.g., 976.5)
  powerFactor: number; // Real / Apparent (0.0 to 1.0)
  kwhCumulative: number; // Cumulative energy kWh
  activityFlag: boolean; // Machine activity sensor (microswitch, optical, or MPU6050 vibration)
  vibrationRms?: number; // Optional MPU6050 vibration intensity in g
  bufferQueuedCount?: number; // Offline buffered packets in ESP32 RAM/LittleFS
  classifiedState: MachineState;
}

export interface MachineConfig {
  id: string;
  name: string;
  type: string;
  nominalPowerW: number;
  standbyPowerBandW: [number, number]; // [min, max]
  productivePowerBandW: [number, number]; // [min, max]
  abnormalThresholdW: number;
  minPowerFactorThreshold: number; // Below this during operation = abnormal
  idleDelayGraceSeconds: number; // Delay before classifying as Avoidable Idle (e.g. 180s)
  relayActive: boolean;
  ctRatingA: number; // e.g. 30 for SCT-013-030
}

export interface StateDurationSeconds {
  PRODUCTIVE: number;
  STANDBY: number;
  ABNORMAL: number;
  AVOIDABLE_IDLE: number;
  OFF: number;
}

export interface StateKWh {
  PRODUCTIVE: number;
  STANDBY: number;
  ABNORMAL: number;
  AVOIDABLE_IDLE: number;
}

export interface StateCostKES {
  PRODUCTIVE: number;
  STANDBY: number;
  ABNORMAL: number;
  AVOIDABLE_IDLE: number;
  totalCost: number;
  totalWasteCost: number; // STANDBY + AVOIDABLE_IDLE + abnormal excess
}

export interface KenyaPowerTariff {
  tariffName: string; // e.g., "Small Commercial (SC) Single Phase" or "Commercial & Industrial (CI1)"
  baseEnergyRatePerKwh: number; // KES 14.50
  fuelEnergyChargePerKwh: number; // KES 4.25 (EPRA FCC)
  forexAdjustmentPerKwh: number; // KES 1.85 (FX rate)
  warmaLevyPerKwh: number; // KES 0.02 (Water Resource Management Authority)
  epraLevyPerKwh: number; // KES 0.08 (Energy & Petroleum Regulatory Authority)
  repLevyPercent: number; // 5% of base energy
  inflationAdjustmentPerKwh: number; // KES 0.67
  vatRatePercent: number; // 16% on taxable items
  fixedMonthlyCharge: number; // KES 0 or 250
}

export interface WasteSummary {
  standbyCostKES: number;
  idleCostKES: number;
  abnormalCostKES: number;
  totalWasteCostKES: number;
  totalWasteKWh: number;
  projectedMonthlyWasteKES: number;
  projectedAnnualWasteKES: number;
  potentialCo2SavedKg: number; // ~0.38 kg CO2 / kWh grid factor in Kenya (geothermal/hydro/thermal mix)
}

export interface TimelineSegment {
  startTime: number;
  endTime: number;
  state: MachineState;
  durationSeconds: number;
  avgPowerW: number;
  costKES: number;
  isWaste: boolean;
}

export interface AlertItem {
  id: string;
  machineId: string;
  machineName: string;
  timestamp: number;
  level: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  wasteRateKESPerHour: number;
  acknowledged: boolean;
}

export interface HardwareBOMItem {
  partNumber: string;
  name: string;
  purpose: string;
  unitCostKES: number;
  quantity: number;
  localSource: string; // e.g. "Luthuli Ave / River Road / Kijabe St / Nerokas"
  alternatives: string;
  safetyRating: string;
}
