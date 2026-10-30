/**
 * GhostLoad Live Telemetry Store & Hardware Simulator
 * Handles real-time multi-machine telemetry streaming, LittleFS buffering simulation,
 * state machine classification, and rate-limited actionable alerts.
 */
import { INITIAL_MACHINES } from '../data/initialMachines';
import { DEFAULT_KENYA_TARIFF } from '../data/kenyaTariffs';
import { AlertItem, KenyaPowerTariff, MachineConfig, MachineState, TelemetryPacket, TimelineSegment } from '../types';
import { globalClassifier } from './classifier';
import { calculateStateCostsKES, calculateStateKWh, PowerAveragesW } from './costCalculator';

export interface MachineRuntimeData {
  config: MachineConfig;
  latestTelemetry: TelemetryPacket;
  historyTelemetry: TelemetryPacket[];
  durations: Record<MachineState, number>; // in seconds
  timeline: TimelineSegment[];
  relayTripped: boolean;
  manualOverrideState: MachineState | 'AUTO';
  activityOverride: boolean;
}

export interface WorkshopSummary {
  totalRealPowerW: number;
  totalApparentPowerVA: number;
  avgPowerFactor: number;
  totalKWhToday: number;
  totalCostTodayKES: number;
  totalWasteCostTodayKES: number;
  wastePercentage: number;
}

type Listener = () => void;

class TelemetryStore {
  private machines: Map<string, MachineRuntimeData> = new Map();
  private tariff: KenyaPowerTariff = { ...DEFAULT_KENYA_TARIFF };
  private listeners: Set<Listener> = new Set();
  private alerts: AlertItem[] = [];
  private isWifiConnected: boolean = true;
  private offlineBuffer: TelemetryPacket[] = [];
  private intervalTimer: any = null;
  private demoAutoSequenceActive: boolean = false;
  private demoSequenceStep: number = 0;

  constructor() {
    this.initMachines();
    this.startStreaming();
  }

  private initMachines() {
    const now = Date.now();

    INITIAL_MACHINES.forEach((config, idx) => {
      // Seed initial realistic running state
      const initialStates: MachineState[] = ['PRODUCTIVE', 'AVOIDABLE_IDLE', 'STANDBY', 'PRODUCTIVE'];
      const initState = initialStates[idx] || 'STANDBY';
      
      const vRms = 229 + Math.random() * 4;
      const initialW = initState === 'PRODUCTIVE' ? config.nominalPowerW * (0.85 + Math.random() * 0.2)
        : initState === 'AVOIDABLE_IDLE' ? config.nominalPowerW * 0.42
        : initState === 'STANDBY' ? (config.standbyPowerBandW[0] + 5)
        : 0;

      const pf = initState === 'PRODUCTIVE' ? 0.88 : initState === 'AVOIDABLE_IDLE' ? 0.45 : 0.65;
      const apparentVA = initialW > 0 ? initialW / pf : 0;
      const iRms = apparentVA > 0 ? apparentVA / vRms : 0;

      const packet: TelemetryPacket = {
        deviceId: `ESP32-${config.id}`,
        machineId: config.id,
        timestamp: now,
        vRms: Math.round(vRms * 10) / 10,
        iRms: Math.round(iRms * 100) / 100,
        realPowerW: Math.round(initialW),
        apparentPowerVA: Math.round(apparentVA),
        powerFactor: Math.round(pf * 100) / 100,
        kwhCumulative: 4.8 + idx * 3.2,
        activityFlag: initState === 'PRODUCTIVE',
        vibrationRms: initState === 'PRODUCTIVE' ? 1.4 : 0.08,
        bufferQueuedCount: 0,
        classifiedState: initState,
      };

      // Seed realistic timeline segments for today
      const timeline: TimelineSegment[] = [
        { startTime: now - 14400000, endTime: now - 10800000, state: 'STANDBY', durationSeconds: 3600, avgPowerW: 24, costKES: 19.5, isWaste: true },
        { startTime: now - 10800000, endTime: now - 7200000, state: 'PRODUCTIVE', durationSeconds: 3600, avgPowerW: config.nominalPowerW, costKES: 112.0, isWaste: false },
        { startTime: now - 7200000, endTime: now - 3600000, state: idx === 1 ? 'AVOIDABLE_IDLE' : 'PRODUCTIVE', durationSeconds: 3600, avgPowerW: config.nominalPowerW * 0.5, costKES: 58.0, isWaste: idx === 1 },
        { startTime: now - 3600000, endTime: now, state: initState, durationSeconds: 3600, avgPowerW: initialW, costKES: 45.0, isWaste: initState === 'STANDBY' || initState === 'AVOIDABLE_IDLE' },
      ];

      this.machines.set(config.id, {
        config,
        latestTelemetry: packet,
        historyTelemetry: [packet],
        durations: {
          PRODUCTIVE: idx === 1 ? 5400 : 12600,
          STANDBY: 7200,
          ABNORMAL: idx === 0 ? 900 : 300,
          AVOIDABLE_IDLE: idx === 1 ? 6800 : 1800,
          OFF: 3600,
        },
        timeline,
        relayTripped: false,
        manualOverrideState: 'AUTO',
        activityOverride: initState === 'PRODUCTIVE',
      });
    });

    // Seed 2 initial realistic alerts
    this.alerts.push({
      id: 'alt-01',
      machineId: 'MCH-02',
      machineName: 'Piston Air Compressor (2.2 kW)',
      timestamp: Date.now() - 1800000,
      level: 'warning',
      title: 'Prolonged Unloaded Idling',
      description: 'Compressor has been running unloaded for > 25 minutes with unloader valve open. Costing KES 26.40/hr in wasted energy.',
      wasteRateKESPerHour: 26.40,
      acknowledged: false,
    });
    this.alerts.push({
      id: 'alt-02',
      machineId: 'MCH-01',
      machineName: 'Precision Metal Lathe (1.5 kW)',
      timestamp: Date.now() - 3600000,
      level: 'critical',
      title: 'Abnormal Power Draw / Inefficiency',
      description: 'Lathe active draw exceeded 1,780 W (+23% above calibrated baseline). Probable dull tooling or lead screw binding.',
      wasteRateKESPerHour: 34.20,
      acknowledged: false,
    });
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getTariff(): KenyaPowerTariff {
    return this.tariff;
  }

  public updateTariff(newTariff: Partial<KenyaPowerTariff>) {
    this.tariff = { ...this.tariff, ...newTariff };
    this.notify();
  }

  public getMachines(): MachineRuntimeData[] {
    return Array.from(this.machines.values());
  }

  public getMachine(id: string): MachineRuntimeData | undefined {
    return this.machines.get(id);
  }

  public getAlerts(): AlertItem[] {
    return this.alerts;
  }

  public acknowledgeAlert(id: string) {
    const a = this.alerts.find(item => item.id === id);
    if (a) {
      a.acknowledged = true;
      this.notify();
    }
  }

  public isWifiOnline(): boolean {
    return this.isWifiConnected;
  }

  public getOfflineBufferCount(): number {
    return this.offlineBuffer.length;
  }

  /**
   * Simulates a phone hotspot dropout
   */
  public toggleWifi() {
    this.isWifiConnected = !this.isWifiConnected;
    if (this.isWifiConnected && this.offlineBuffer.length > 0) {
      // Reconnected: burst drain buffer into state
      this.offlineBuffer.forEach(p => {
        const m = this.machines.get(p.machineId);
        if (m) {
          m.latestTelemetry = { ...p, bufferQueuedCount: 0 };
          m.historyTelemetry.push(p);
          if (m.historyTelemetry.length > 60) m.historyTelemetry.shift();
        }
      });
      this.offlineBuffer = [];
    }
    this.notify();
  }

  /**
   * Manual override of machine condition for live judge demo
   */
  public setMachineOverride(machineId: string, state: MachineState | 'AUTO', activityFlag?: boolean) {
    const m = this.machines.get(machineId);
    if (!m) return;
    m.manualOverrideState = state;
    if (activityFlag !== undefined) {
      m.activityOverride = activityFlag;
    }
    this.tickSimulation();
    this.notify();
  }

  public toggleActivitySensor(machineId: string) {
    const m = this.machines.get(machineId);
    if (!m) return;
    m.activityOverride = !m.activityOverride;
    this.tickSimulation();
    this.notify();
  }

  public tripRelay(machineId: string) {
    const m = this.machines.get(machineId);
    if (!m) return;
    m.relayTripped = !m.relayTripped;
    this.notify();
  }

  public resetAllToSeed() {
    this.machines.clear();
    this.alerts = [];
    this.initMachines();
    this.notify();
  }

  /**
   * Demo Autopilot Sequence: runs a scripted 3-minute sequence for presentations
   */
  public toggleDemoAutoSequence() {
    this.demoAutoSequenceActive = !this.demoAutoSequenceActive;
    this.demoSequenceStep = 0;
    this.notify();
  }

  public isAutoSequenceActive(): boolean {
    return this.demoAutoSequenceActive;
  }

  private startStreaming() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    // 1-second real-time tick
    this.intervalTimer = setInterval(() => {
      this.tickSimulation();
    }, 1000);
  }

  private tickSimulation() {
    const now = Date.now();

    // Auto demo script advancement if enabled
    if (this.demoAutoSequenceActive) {
      this.demoSequenceStep = (this.demoSequenceStep + 1) % 60;
      const targetMachine = this.machines.get('MCH-01');
      if (targetMachine) {
        if (this.demoSequenceStep < 15) {
          // Stage 1: Productive
          targetMachine.manualOverrideState = 'PRODUCTIVE';
          targetMachine.activityOverride = true;
        } else if (this.demoSequenceStep < 30) {
          // Stage 2: Avoidable Idle
          targetMachine.manualOverrideState = 'AVOIDABLE_IDLE';
          targetMachine.activityOverride = false;
        } else if (this.demoSequenceStep < 45) {
          // Stage 3: Abnormal / Dull Tool
          targetMachine.manualOverrideState = 'ABNORMAL';
          targetMachine.activityOverride = true;
        } else {
          // Stage 4: Standby
          targetMachine.manualOverrideState = 'STANDBY';
          targetMachine.activityOverride = false;
        }
      }
    }

    this.machines.forEach((m) => {
      if (m.relayTripped) {
        m.latestTelemetry.realPowerW = 0;
        m.latestTelemetry.apparentPowerVA = 0;
        m.latestTelemetry.iRms = 0;
        m.latestTelemetry.classifiedState = 'OFF';
        m.durations.OFF += 1;
        return;
      }

      // Generate power based on manual override or nominal machine physics
      let targetState = m.manualOverrideState;
      let activity = m.activityOverride;
      let powerW = 0;
      let pf = 0.85;

      if (targetState === 'AUTO') {
        // Natural small jitter
        powerW = m.latestTelemetry.realPowerW + (Math.random() - 0.5) * 15;
        pf = m.latestTelemetry.powerFactor;
        activity = m.activityOverride;
      } else if (targetState === 'PRODUCTIVE') {
        powerW = m.config.nominalPowerW * (0.92 + Math.random() * 0.12);
        pf = 0.86 + Math.random() * 0.06;
        activity = true;
      } else if (targetState === 'STANDBY') {
        powerW = m.config.standbyPowerBandW[0] + Math.random() * 8;
        pf = 0.60 + Math.random() * 0.08;
        activity = false;
      } else if (targetState === 'AVOIDABLE_IDLE') {
        // Motor spinning unloaded: consumes ~35-45% of nominal power with low PF (e.g. 0.35 - 0.52)
        powerW = m.config.nominalPowerW * 0.42 + (Math.random() - 0.5) * 20;
        pf = 0.42 + (Math.random() - 0.5) * 0.05;
        activity = false;
      } else if (targetState === 'ABNORMAL') {
        // High load / binding / dull tooling
        powerW = m.config.abnormalThresholdW + 80 + Math.random() * 120;
        pf = 0.74 + Math.random() * 0.05;
        activity = true;
      } else if (targetState === 'OFF') {
        powerW = 0.5;
        pf = 0.1;
        activity = false;
      }

      // 230V mains with slight grid fluctuation (±2.5V typical in Kenya Industrial Area)
      const vRms = 230.5 + (Math.random() - 0.5) * 3.0;
      pf = Math.max(0.1, Math.min(0.99, pf));
      const apparentVA = powerW > 0 ? powerW / pf : 0;
      const iRms = apparentVA > 0 ? apparentVA / vRms : 0;

      // Classify state via GhostLoad classifier
      const classified = globalClassifier.classify({
        deviceId: `ESP32-${m.config.id}`,
        machineId: m.config.id,
        timestamp: now,
        vRms: Math.round(vRms * 10) / 10,
        iRms: Math.round(iRms * 100) / 100,
        realPowerW: Math.round(powerW),
        apparentPowerVA: Math.round(apparentVA),
        powerFactor: Math.round(pf * 100) / 100,
        kwhCumulative: m.latestTelemetry.kwhCumulative,
        activityFlag: activity,
      }, m.config);

      // Energy accumulation: kWh += Watts * (1s / 3600) / 1000
      const deltaKwh = (powerW * 1) / (3600 * 1000);
      const newKwh = m.latestTelemetry.kwhCumulative + deltaKwh;

      // Increment state duration
      m.durations[classified] = (m.durations[classified] || 0) + 1;

      const packet: TelemetryPacket = {
        deviceId: `ESP32-${m.config.id}`,
        machineId: m.config.id,
        timestamp: now,
        vRms: Math.round(vRms * 10) / 10,
        iRms: Math.round(iRms * 100) / 100,
        realPowerW: Math.round(powerW),
        apparentPowerVA: Math.round(apparentVA),
        powerFactor: Math.round(pf * 100) / 100,
        kwhCumulative: Math.round(newKwh * 1000) / 1000,
        activityFlag: activity,
        vibrationRms: classified === 'PRODUCTIVE' ? 1.35 : classified === 'AVOIDABLE_IDLE' ? 0.65 : 0.05,
        bufferQueuedCount: this.isWifiConnected ? 0 : this.offlineBuffer.length + 1,
        classifiedState: classified,
      };

      if (!this.isWifiConnected) {
        // Enqueue to simulated LittleFS / RAM ring buffer
        this.offlineBuffer.push(packet);
        m.latestTelemetry = { ...packet, bufferQueuedCount: this.offlineBuffer.length };
      } else {
        m.latestTelemetry = packet;
        m.historyTelemetry.push(packet);
        if (m.historyTelemetry.length > 60) m.historyTelemetry.shift();
      }

      // Check alert conditions
      if (classified === 'AVOIDABLE_IDLE' && m.durations.AVOIDABLE_IDLE % 300 === 0 && m.durations.AVOIDABLE_IDLE > 0) {
        const wasteRate = Math.round((powerW / 1000) * 23.5 * 10) / 10;
        this.alerts.unshift({
          id: `alt-${now}`,
          machineId: m.config.id,
          machineName: m.config.name,
          timestamp: now,
          level: 'warning',
          title: `Avoidable Idle Alert: ${m.config.name}`,
          description: `Machine has been idling without active cutting for ${Math.round(m.durations.AVOIDABLE_IDLE / 60)} minutes. Wasting ~KES ${wasteRate}/hr.`,
          wasteRateKESPerHour: wasteRate,
          acknowledged: false,
        });
        if (this.alerts.length > 15) this.alerts.pop();
      }
    });

    this.notify();
  }

  public getWorkshopSummary(): WorkshopSummary {
    let totalRealPowerW = 0;
    let totalApparentPowerVA = 0;
    let totalKWhToday = 0;
    let totalCostTodayKES = 0;
    let totalWasteCostTodayKES = 0;

    this.machines.forEach(m => {
      totalRealPowerW += m.latestTelemetry.realPowerW;
      totalApparentPowerVA += m.latestTelemetry.apparentPowerVA;
      totalKWhToday += m.latestTelemetry.kwhCumulative;

      const avgPower: PowerAveragesW = {
        PRODUCTIVE: m.config.nominalPowerW,
        STANDBY: (m.config.standbyPowerBandW[0] + m.config.standbyPowerBandW[1]) / 2,
        ABNORMAL: m.config.abnormalThresholdW + 100,
        AVOIDABLE_IDLE: m.config.nominalPowerW * 0.42,
        nominalBaselineW: m.config.nominalPowerW,
      };

      const stateKwh = calculateStateKWh(m.durations, avgPower);
      const stateCosts = calculateStateCostsKES(stateKwh, this.tariff, avgPower, m.durations);

      totalCostTodayKES += stateCosts.totalCost;
      totalWasteCostTodayKES += stateCosts.totalWasteCost;
    });

    const avgPowerFactor = totalApparentPowerVA > 0 ? totalRealPowerW / totalApparentPowerVA : 0.85;
    const wastePercentage = totalCostTodayKES > 0 ? (totalWasteCostTodayKES / totalCostTodayKES) * 100 : 0;

    return {
      totalRealPowerW: Math.round(totalRealPowerW),
      totalApparentPowerVA: Math.round(totalApparentPowerVA),
      avgPowerFactor: Math.round(avgPowerFactor * 100) / 100,
      totalKWhToday: Math.round(totalKWhToday * 10) / 10,
      totalCostTodayKES: Math.round(totalCostTodayKES),
      totalWasteCostTodayKES: Math.round(totalWasteCostTodayKES),
      wastePercentage: Math.round(wastePercentage * 10) / 10,
    };
  }
}

export const telemetryStore = new TelemetryStore();
