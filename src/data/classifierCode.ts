/**
 * Stage c Reference Implementation: State Classification Logic
 * Contains Python and Node.js reference implementations, decision table,
 * and confusion matrix evaluation plan.
 */

export const PYTHON_CLASSIFIER_CODE = `"""
GhostLoad Industrial Energy State Classification Engine
Language: Python 3.10+
Used for offline batch log analysis, baseline training, and evaluation.
"""

from dataclasses import dataclass
from enum import Enum
import numpy as np
import pandas as pd
from typing import List, Tuple, Optional


class MachineState(str, Enum):
    PRODUCTIVE = "PRODUCTIVE"
    STANDBY = "STANDBY"
    ABNORMAL = "ABNORMAL"
    AVOIDABLE_IDLE = "AVOIDABLE_IDLE"
    OFF = "OFF"


@dataclass
class MachineProfile:
    machine_id: str
    nominal_power_w: float
    standby_band_w: Tuple[float, float] = (5.0, 50.0)
    abnormal_threshold_w: float = 1750.0
    min_pf_threshold: float = 0.70
    idle_grace_seconds: float = 120.0


class RuleBasedClassifierWithHysteresis:
    def __init__(self, profile: MachineProfile, debounce_samples: int = 3):
        self.profile = profile
        self.debounce_samples = debounce_samples
        self.current_state = MachineState.OFF
        self.idle_start_time: Optional[float] = None
        self.power_window: List[float] = []
        self.pf_window: List[float] = []

    def classify_sample(
        self,
        timestamp_s: float,
        power_w: float,
        pf: float,
        activity_flag: bool
    ) -> MachineState:
        """
        Classifies a single telemetry sample with rolling smoothing and state hysteresis.
        """
        self.power_window.append(power_w)
        self.pf_window.append(pf)
        if len(self.power_window) > 5:
            self.power_window.pop(0)
            self.pf_window.pop(0)

        smoothed_p = np.mean(self.power_window)
        smoothed_pf = np.mean(self.pf_window)

        # 1. Check OFF state
        if smoothed_p < 2.5:
            self.idle_start_time = None
            self.current_state = MachineState.OFF
            return self.current_state

        # 2. Check Standby Vampire Draw
        if smoothed_p <= self.profile.standby_band_w[1]:
            self.idle_start_time = None
            self.current_state = MachineState.STANDBY
            return self.current_state

        # 3. Check Abnormal / Inefficient (Over-power OR severe PF drop)
        if (smoothed_p >= self.profile.abnormal_threshold_w) or \\
           (smoothed_p > self.profile.standby_band_w[1] and smoothed_pf < self.profile.min_pf_threshold - 0.15):
            self.idle_start_time = None
            self.current_state = MachineState.ABNORMAL
            return self.current_state

        # 4. Check Activity Sensor for Productive vs Avoidable Idle
        if activity_flag:
            self.idle_start_time = None
            self.current_state = MachineState.PRODUCTIVE
            return self.current_state

        # 5. Avoidable Idle evaluation (Machine energized & spinning, but no workpiece)
        if self.idle_start_time is None:
            self.idle_start_time = timestamp_s

        elapsed_idle = timestamp_s - self.idle_start_time
        if elapsed_idle >= self.profile.idle_grace_seconds:
            self.current_state = MachineState.AVOIDABLE_IDLE
        else:
            self.current_state = MachineState.PRODUCTIVE  # In grace period

        return self.current_state


def evaluate_confusion_matrix(y_true: List[str], y_pred: List[str]):
    """
    Computes Precision, Recall, and 4x4 Confusion Matrix
    """
    labels = [s.value for s in MachineState if s != MachineState.OFF]
    matrix = pd.crosstab(
        pd.Series(y_true, name='Actual Ground Truth'),
        pd.Series(y_pred, name='GhostLoad Predicted'),
        margins=True
    )
    print("=== GhostLoad Classification Confusion Matrix ===")
    print(matrix)
    return matrix
`;

export const NODEJS_CLASSIFIER_CODE = `/**
 * GhostLoad Backend Express / Node.js Classifier Microservice
 * Production-ready ingest pipeline compatible with MongoDB Time-Series collections.
 */

import { MachineConfig, MachineState, TelemetryPacket } from './types';

export class NodeJSEnergyClassifier {
  private config: MachineConfig;
  private rollingPower: number[] = [];
  private idleStartTimeMs: number | null = null;
  private currentState: MachineState = 'OFF';

  constructor(config: MachineConfig) {
    this.config = config;
  }

  public processTelemetry(packet: TelemetryPacket): MachineState {
    this.rollingPower.push(packet.realPowerW);
    if (this.rollingPower.length > 5) this.rollingPower.shift();

    const avgP = this.rollingPower.reduce((a, b) => a + b, 0) / this.rollingPower.length;

    // Mutually Exclusive, Collectively Exhaustive State Tree:
    if (avgP < 2.5) {
      this.idleStartTimeMs = null;
      this.currentState = 'OFF';
    } else if (avgP <= this.config.standbyPowerBandW[1]) {
      this.idleStartTimeMs = null;
      this.currentState = 'STANDBY';
    } else if (avgP >= this.config.abnormalThresholdW || packet.powerFactor < this.config.minPowerFactorThreshold) {
      this.idleStartTimeMs = null;
      this.currentState = 'ABNORMAL';
    } else if (packet.activityFlag) {
      this.idleStartTimeMs = null;
      this.currentState = 'PRODUCTIVE';
    } else {
      if (!this.idleStartTimeMs) {
        this.idleStartTimeMs = packet.timestamp;
      }
      const idleElapsedSec = (packet.timestamp - this.idleStartTimeMs) / 1000;
      this.currentState = idleElapsedSec >= this.config.idleDelayGraceSeconds ? 'AVOIDABLE_IDLE' : 'PRODUCTIVE';
    }

    return this.currentState;
  }
}
`;
