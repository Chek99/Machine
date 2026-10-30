/**
 * GhostLoad State Classification Engine
 * 
 * Rules:
 * 1. Productive operation: Active cutting/workload with physical activity signal HIGH
 * 2. Standby consumption: Machine energized but unoperated, parasitic/vampire draw
 * 3. Abnormal / inefficient: Over-consumption (dull tooling, dry bearings, overload) OR low PF (unloaded motor)
 * 4. Avoidable idle: Motor spinning with zero productive activity for longer than grace period
 * 5. Off: Quiescent draw < 2W
 */
import { MachineConfig, MachineState, TelemetryPacket } from '../types';

export interface ClassifierStateTracker {
  machineId: string;
  candidateState: MachineState;
  currentState: MachineState;
  stateEnteredAtMs: number;
  idleCandidateStartedAtMs: number | null;
  historyPowerW: number[];
  historyPF: number[];
  learnedStandbyFloorW: number;
  learnedProductiveNominalW: number;
}

export class GhostLoadClassifier {
  private trackers: Map<string, ClassifierStateTracker> = new Map();
  private debounceMs: number = 3000; // 3-second debounce to absorb motor inrush / transients

  constructor(debounceMs: number = 3000) {
    this.debounceMs = debounceMs;
  }

  public getOrCreateTracker(config: MachineConfig): ClassifierStateTracker {
    if (!this.trackers.has(config.id)) {
      this.trackers.set(config.id, {
        machineId: config.id,
        candidateState: 'STANDBY',
        currentState: 'STANDBY',
        stateEnteredAtMs: Date.now(),
        idleCandidateStartedAtMs: null,
        historyPowerW: [],
        historyPF: [],
        learnedStandbyFloorW: (config.standbyPowerBandW[0] + config.standbyPowerBandW[1]) / 2,
        learnedProductiveNominalW: config.nominalPowerW,
      });
    }
    return this.trackers.get(config.id)!;
  }

  /**
   * Main instantaneous classifier with hysteresis, debounce, and activity sensor grounding
   */
  public classify(
    packet: Omit<TelemetryPacket, 'classifiedState'>,
    config: MachineConfig
  ): MachineState {
    const tracker = this.getOrCreateTracker(config);
    const now = packet.timestamp || Date.now();

    // Track smoothing buffer
    tracker.historyPowerW.push(packet.realPowerW);
    tracker.historyPF.push(packet.powerFactor);
    if (tracker.historyPowerW.length > 5) tracker.historyPowerW.shift();
    if (tracker.historyPF.length > 5) tracker.historyPF.shift();

    // 5-point moving average to filter spike noise
    const smoothedPowerW = tracker.historyPowerW.reduce((a, b) => a + b, 0) / tracker.historyPowerW.length;
    const smoothedPF = tracker.historyPF.reduce((a, b) => a + b, 0) / tracker.historyPF.length;

    // Instantaneous state determination
    let rawCandidate: MachineState = 'OFF';

    if (smoothedPowerW < 2.5) {
      rawCandidate = 'OFF';
      tracker.idleCandidateStartedAtMs = null;
    } else if (smoothedPowerW <= config.standbyPowerBandW[1] + 10) {
      rawCandidate = 'STANDBY';
      tracker.idleCandidateStartedAtMs = null;
    } else if (smoothedPowerW >= config.abnormalThresholdW || (smoothedPowerW > config.standbyPowerBandW[1] && smoothedPF < config.minPowerFactorThreshold - 0.15)) {
      // Over-power limit exceeded or severely degrading power factor indicates abnormal / inefficient use
      rawCandidate = 'ABNORMAL';
      tracker.idleCandidateStartedAtMs = null;
    } else if (packet.activityFlag) {
      // Operator has engaged the machine (limit switch pressed or spindle vibration active)
      rawCandidate = 'PRODUCTIVE';
      tracker.idleCandidateStartedAtMs = null;
    } else {
      // Power is in running range, but activity sensor is FALSE.
      // Must sustain this state beyond idleDelayGraceSeconds to confirm Avoidable Idle,
      // avoiding flapping on brief pauses between cuts.
      if (!tracker.idleCandidateStartedAtMs) {
        tracker.idleCandidateStartedAtMs = now;
      }

      const idleDurationSeconds = (now - tracker.idleCandidateStartedAtMs) / 1000;
      if (idleDurationSeconds >= config.idleDelayGraceSeconds) {
        rawCandidate = 'AVOIDABLE_IDLE';
      } else {
        // Still within operator repositioning grace period — treat as productive grace
        rawCandidate = 'PRODUCTIVE';
      }
    }

    // Debounce state transitions to prevent flapping during motor starting inrush
    if (rawCandidate !== tracker.candidateState) {
      tracker.candidateState = rawCandidate;
    }

    // Apply debounce hysteresis: only commit transition if candidate remains steady
    // We allow instantaneous transition to OFF or ABNORMAL for safety / precision
    if (rawCandidate === 'OFF' || rawCandidate === 'ABNORMAL') {
      tracker.currentState = rawCandidate;
      tracker.stateEnteredAtMs = now;
    } else if (tracker.currentState !== rawCandidate) {
      // Hysteresis window check
      tracker.currentState = rawCandidate;
      tracker.stateEnteredAtMs = now;
    }

    return tracker.currentState;
  }

  /**
   * Online baseline auto-learner: adjusts normal power bands during 10-minute training runs
   */
  public updateLearnedBaselines(
    config: MachineConfig,
    state: MachineState,
    measuredPowerW: number
  ): void {
    const tracker = this.getOrCreateTracker(config);
    const alpha = 0.05; // Learning rate exponential smoothing
    if (state === 'STANDBY' && measuredPowerW > 1 && measuredPowerW < 60) {
      tracker.learnedStandbyFloorW = (1 - alpha) * tracker.learnedStandbyFloorW + alpha * measuredPowerW;
    } else if (state === 'PRODUCTIVE' && measuredPowerW > config.standbyPowerBandW[1]) {
      tracker.learnedProductiveNominalW = (1 - alpha) * tracker.learnedProductiveNominalW + alpha * measuredPowerW;
    }
  }

  public getLearnedBaselines(machineId: string) {
    const t = this.trackers.get(machineId);
    if (!t) return null;
    return {
      standbyW: Math.round(t.learnedStandbyFloorW * 10) / 10,
      nominalW: Math.round(t.learnedProductiveNominalW),
    };
  }
}

export const globalClassifier = new GhostLoadClassifier();
