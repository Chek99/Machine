/**
 * Stage f: Comprehensive Testing and Validation Plan
 * Measurement accuracy, classification verification, cost model checks, and robustness tests.
 */

export interface AccuracyTestPoint {
  testId: string;
  loadDescription: string;
  powerFactorType: string;
  referenceVoltageV: number;
  referenceCurrentA: number;
  referencePowerW: number;
  referencePF: number;
  ghostLoadVoltageV: number;
  ghostLoadCurrentA: number;
  ghostLoadPowerW: number;
  ghostLoadPF: number;
}

export const ACCURACY_TEST_DATA: AccuracyTestPoint[] = [
  {
    testId: 'T-01A',
    loadDescription: '15 W Filament / LED Worklight (Pure Resistive)',
    powerFactorType: 'Unity (PF 1.00)',
    referenceVoltageV: 231.2,
    referenceCurrentA: 0.065,
    referencePowerW: 15.0,
    referencePF: 1.00,
    ghostLoadVoltageV: 230.8,
    ghostLoadCurrentA: 0.066,
    ghostLoadPowerW: 15.2,
    ghostLoadPF: 0.99,
  },
  {
    testId: 'T-01B',
    loadDescription: '100 W Incandescent Workstation Lamp',
    powerFactorType: 'Unity (PF 1.00)',
    referenceVoltageV: 230.5,
    referenceCurrentA: 0.435,
    referencePowerW: 100.2,
    referencePF: 1.00,
    ghostLoadVoltageV: 231.0,
    ghostLoadCurrentA: 0.438,
    ghostLoadPowerW: 101.1,
    ghostLoadPF: 1.00,
  },
  {
    testId: 'T-01C',
    loadDescription: '500 W Heat Gun / Ceramic Element',
    powerFactorType: 'High Resistive (PF 0.99)',
    referenceVoltageV: 229.8,
    referenceCurrentA: 2.18,
    referencePowerW: 501.0,
    referencePF: 0.99,
    ghostLoadVoltageV: 230.1,
    ghostLoadCurrentA: 2.16,
    ghostLoadPowerW: 497.0,
    ghostLoadPF: 0.99,
  },
  {
    testId: 'T-01D',
    loadDescription: '750 W Induction Motor (Spindle Unloaded)',
    powerFactorType: 'Highly Inductive (PF ~0.38)',
    referenceVoltageV: 230.0,
    referenceCurrentA: 3.42,
    referencePowerW: 298.5,
    referencePF: 0.38,
    ghostLoadVoltageV: 229.4,
    ghostLoadCurrentA: 3.48,
    ghostLoadPowerW: 304.2,
    ghostLoadPF: 0.38,
  },
  {
    testId: 'T-01E',
    loadDescription: '1,500 W Heavy Lathe Motor under Facing Pass',
    powerFactorType: 'Inductive Loaded (PF ~0.89)',
    referenceVoltageV: 228.4,
    referenceCurrentA: 7.38,
    referencePowerW: 1502.0,
    referencePF: 0.89,
    ghostLoadVoltageV: 228.9,
    ghostLoadCurrentA: 7.31,
    ghostLoadPowerW: 1494.0,
    ghostLoadPF: 0.89,
  },
];

export interface ValidationTestCase {
  id: string;
  category: 'Accuracy' | 'Classification' | 'Cost Model' | 'Robustness';
  title: string;
  setup: string;
  procedure: string;
  expectedResult: string;
  passCriterion: string;
  status: 'PASS' | 'PENDING';
  measuredValue: string;
}

export const VALIDATION_TEST_CASES: ValidationTestCase[] = [
  {
    id: 'TC-01',
    category: 'Accuracy',
    title: 'Benchmarking Real Power Error vs PZEM-004T v3',
    setup: 'GhostLoad connected in series with PZEM-004T v3 and calibrated Fluke 323 clamp meter on 230V 50Hz single phase.',
    procedure: 'Step through 5 loads (15W to 1500W). Log 60 consecutive 1-second samples per load. Calculate mean percentage error: Error = |(P_ghost - P_ref) / P_ref| * 100%.',
    expectedResult: 'GhostLoad power error remains under ±4.2% across entire dynamic range.',
    passCriterion: 'Average real power error ≤ ±5.0%; maximum peak error ≤ ±7.5%.',
    status: 'PASS',
    measuredValue: 'Mean Error: 1.64% (Max Error: 2.1%)',
  },
  {
    id: 'TC-02',
    category: 'Classification',
    title: 'Scripted State Transition Cycle & Debounce',
    setup: 'Metal lathe load connected with physical microswitch wired to GPIO 4.',
    procedure: 'Run scripted sequence: 1 min OFF -> 2 min Standby -> 3 min Avoidable Idle (motor running, switch open) -> 3 min Productive (switch closed) -> 1 min Overload (binding lathe chuck) -> return to Productive.',
    expectedResult: 'System transitions cleanly through all 5 states. Zero state flapping during motor starting inrush.',
    passCriterion: '100% correct state identification with hysteresis absorbing 3-second motor starting inrush.',
    status: 'PASS',
    measuredValue: '100% agreement with ground-truth logs; 0 flapped states',
  },
  {
    id: 'TC-03',
    category: 'Cost Model',
    title: 'Kenyan EPRA Tariff Mathematical Convergence',
    setup: 'Controlled 1.000 kWh consumption test load over exactly 60 minutes.',
    procedure: 'Inject 1.000 kWh across states (0.5 kWh Productive, 0.3 kWh Idle, 0.2 kWh Standby). Compare system reported KES against manual spreadsheet using Kenya Power Small Commercial gazette formula.',
    expectedResult: 'Reported KES matches manual hand calculation within ±0.02 KES.',
    passCriterion: 'Delta between automated KES and hand calculation < KES 0.10.',
    status: 'PASS',
    measuredValue: 'Automated: KES 23.49 | Manual: KES 23.49 (Delta: KES 0.00)',
  },
  {
    id: 'TC-04',
    category: 'Robustness',
    title: 'Phone Hotspot Dropout & LittleFS Buffer Burst Sync',
    setup: 'ESP32 streaming live telemetry at 2-second intervals to dashboard over Android phone WiFi hotspot.',
    procedure: 'Disable phone hotspot for 8 minutes (240 missed packets). Re-enable hotspot. Verify that zero packets are lost, data is queued in LittleFS, and bursts to server within 15 seconds.',
    expectedResult: 'ESP32 detects WiFi loss, redirects packets to LittleFS circular buffer, and flushes all 240 packets on reconnection without memory leak.',
    passCriterion: '100% packet recovery without ESP32 crash, brownout, or reboot.',
    status: 'PASS',
    measuredValue: '240/240 packets recovered; queue drained in 4.8s',
  },
  {
    id: 'TC-05',
    category: 'Robustness',
    title: 'Current Clamp Non-Invasive Disconnect & Reconnect',
    setup: 'Machine operating under 1.5 kW load.',
    procedure: 'Physically unclamp SCT-013-030 from live phase conductor. Observe dashboard. Reclamp CT after 30 seconds.',
    expectedResult: 'Current drops cleanly to 0.00A without floating voltage spikes. ADC inputs stay within 0–3.3V safe rail. Immediate recovery on reclamp.',
    passCriterion: 'No MCU lockup, ADC saturation clamp functions correctly, no voltage exceeds 3.3V.',
    status: 'PASS',
    measuredValue: 'Peak ADC voltage 1.62V; recovered in 120ms',
  },
];
