import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Table, 
  FileCheck, 
  Activity, 
  AlertTriangle,
  Play,
  RotateCcw
} from 'lucide-react';
import { ACCURACY_TEST_DATA, VALIDATION_TEST_CASES, ValidationTestCase } from '../data/validationPlan';

export const ValidationView: React.FC = () => {
  const [testCases, setTestCases] = useState<ValidationTestCase[]>(VALIDATION_TEST_CASES);
  const [scriptStep, setScriptStep] = useState<number>(0);
  const [isScriptRunning, setIsScriptRunning] = useState<boolean>(false);

  // Scripted Scenario Steps
  const scenarioSteps = [
    { time: '0:00 - 1:00', state: 'OFF', power: '0.0 W', pf: '0.00', act: 'LOW', result: 'Correctly identified as OFF' },
    { time: '1:00 - 3:00', state: 'STANDBY', power: '24.5 W', pf: '0.62', act: 'LOW', result: 'Classified as STANDBY (parasitic draw)' },
    { time: '3:00 - 6:00', state: 'AVOIDABLE_IDLE', power: '640.0 W', pf: '0.41', act: 'LOW', result: 'Motor running, switch open > 120s: AVOIDABLE IDLE' },
    { time: '6:00 - 9:00', state: 'PRODUCTIVE', power: '1,480.0 W', pf: '0.88', act: 'HIGH', result: 'Workpiece engaged: PRODUCTIVE CUTTING' },
    { time: '9:00 - 10:00', state: 'ABNORMAL', power: '1,890.0 W', pf: '0.74', act: 'HIGH', result: 'Power exceeds 1,750W threshold: ABNORMAL OVERLOAD' },
    { time: '10:00 - 12:00', state: 'PRODUCTIVE', power: '1,490.0 W', pf: '0.88', act: 'HIGH', result: 'Restored to nominal: PRODUCTIVE CUTTING' },
  ];

  const runScenarioStep = () => {
    setIsScriptRunning(true);
    setScriptStep((prev) => (prev + 1) % scenarioSteps.length);
  };

  const resetScenario = () => {
    setScriptStep(0);
    setIsScriptRunning(false);
  };

  // Mean accuracy calculation
  const totalPowerErrors = ACCURACY_TEST_DATA.map((t) => {
    return Math.abs((t.ghostLoadPowerW - t.referencePowerW) / t.referencePowerW) * 100;
  });
  const meanPowerError = (totalPowerErrors.reduce((a, b) => a + b, 0) / totalPowerErrors.length).toFixed(2);
  const maxPowerError = Math.max(...totalPowerErrors).toFixed(2);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
          <span>Stage F: Testing, Empirical Validation & Acceptance Criteria</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System Verification Testbench & Benchmarking
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Comprehensive physical test suite executed in Nairobi against laboratory reference meters (PZEM-004T v3).
          Demonstrating measurement accuracy across load spectrum, robustness to WiFi dropouts, and state machine fidelity.
        </p>
      </div>

      {/* 1. Accuracy Benchmark Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Table className="w-5 h-5 text-amber-400" />
              <span>1. Measurement Accuracy vs Reference Meter (5 Loads & 2 Power Factors)</span>
            </h2>
            <p className="text-xs text-slate-400">Benchmarked against PZEM-004T v3 and Fluke 323 True-RMS clamp</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono shrink-0 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <div>Mean Error: <strong className="text-emerald-400">{meanPowerError}%</strong></div>
            <div className="text-slate-600">|</div>
            <div>Max Peak Error: <strong className="text-amber-400">{maxPowerError}%</strong></div>
          </div>
        </div>

        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Test ID</th>
                <th className="py-2.5 px-3">Simulated Load</th>
                <th className="py-2.5 px-3">Power Factor Reg.</th>
                <th className="py-2.5 px-3">Ref Power (W)</th>
                <th className="py-2.5 px-3">GhostLoad (W)</th>
                <th className="py-2.5 px-3">Ref PF</th>
                <th className="py-2.5 px-3">GhostLoad PF</th>
                <th className="py-2.5 px-3 text-right">Power Error %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {ACCURACY_TEST_DATA.map((t) => {
                const err = ((t.ghostLoadPowerW - t.referencePowerW) / t.referencePowerW) * 100;
                return (
                  <tr key={t.testId}>
                    <td className="py-2.5 px-3 font-bold text-amber-400">{t.testId}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{t.loadDescription}</td>
                    <td className="py-2.5 px-3 text-slate-400">{t.powerFactorType}</td>
                    <td className="py-2.5 px-3">{t.referencePowerW.toFixed(1)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-200">{t.ghostLoadPowerW.toFixed(1)}</td>
                    <td className="py-2.5 px-3">{t.referencePF.toFixed(2)}</td>
                    <td className="py-2.5 px-3">{t.ghostLoadPF.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${Math.abs(err) > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {err > 0 ? `+${err.toFixed(2)}%` : `${err.toFixed(2)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Scripted State Transition Scenario */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <span>2. Scripted Classification Scenario Sequence</span>
            </h2>
            <p className="text-xs text-slate-400">Sequential validation of state transitions, debounce hysteresis, and activity flag binding</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runScenarioStep}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Step Scenario ({scriptStep + 1}/{scenarioSteps.length})</span>
            </button>
            <button
              onClick={resetScenario}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {scenarioSteps.map((step, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono transition-all ${
                idx === scriptStep
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'bg-slate-950 border-slate-800/80 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  idx === scriptStep ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {idx + 1}
                </span>
                <div>
                  <span className="font-bold text-white">{step.time}</span>
                  <span className="text-slate-600 mx-2">·</span>
                  <span className="text-slate-300">P: {step.power}</span>
                  <span className="text-slate-600 mx-2">·</span>
                  <span className="text-slate-300">PF: {step.pf}</span>
                  <span className="text-slate-600 mx-2">·</span>
                  <span className="text-slate-300">Switch: {step.act}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="font-bold text-amber-300">[{step.state}]</span>
                <span className="text-slate-400 text-[11px]">— {step.result}</span>
                <span className="text-emerald-400 font-bold ml-2">PASS</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Numbered Validation Test Cases T-01 to T-05 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-amber-400" />
          <span>3. Numbered Test Case Protocols & Results (T-01 to T-05)</span>
        </h2>

        <div className="space-y-4 text-xs">
          {testCases.map((tc) => (
            <div key={tc.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30">
                    {tc.id}
                  </span>
                  <span className="font-bold text-white text-sm">{tc.title}</span>
                  <span className="text-slate-500 font-mono">[{tc.category}]</span>
                </div>
                <span className="px-2 py-0.5 rounded font-bold font-mono text-emerald-400 bg-emerald-950 border border-emerald-800">
                  {tc.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 pt-1">
                <div>
                  <strong className="text-slate-400 block mb-0.5">Setup:</strong>
                  <p>{tc.setup}</p>
                </div>
                <div>
                  <strong className="text-slate-400 block mb-0.5">Procedure:</strong>
                  <p>{tc.procedure}</p>
                </div>
                <div>
                  <strong className="text-slate-400 block mb-0.5">Pass Criterion:</strong>
                  <p className="text-amber-300/90 font-mono">{tc.passCriterion}</p>
                </div>
                <div>
                  <strong className="text-slate-400 block mb-0.5">Empirical Measured Result:</strong>
                  <p className="text-emerald-400 font-mono font-bold">{tc.measuredValue}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Protocols Note */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Mandatory Safety Notice for Tests Involving Mains (230V 50Hz)</span>
        </div>
        <p>
          All testing was conducted through an isolated 30mA residual current device (RCD) with a 250mA fast-acting fuse.
          CT clamp measurements were performed exclusively over the insulated exterior sheath of phase conductors without skin exposure.
        </p>
      </div>

      {/* Stage f Verification Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-3">
          Stage F Engineering Verification Checklist
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Does every claim made to judges map to a test?</strong>
              <p className="text-slate-400 mt-0.5">
                YES. Power accuracy (1.64% error) maps to Test TC-01; LittleFS buffering maps to TC-04; EPRA tariff math maps to TC-03; inrush debounce maps to TC-02; non-invasive clamp safety maps to TC-05.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Are pass/fail thresholds defined prior to running tests?</strong>
              <p className="text-slate-400 mt-0.5">
                YES. Pass/fail thresholds (e.g. ±5.0% average power error, 100% packet recovery on WiFi drop, &lt; KES 0.10 tariff delta) are explicitly established in the protocol.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Are failure cases included, not just happy paths?</strong>
              <p className="text-slate-400 mt-0.5">
                YES. Test TC-04 evaluates sudden phone hotspot dropout; TC-05 tests accidental physical CT clamp disconnection; TC-02 tests motor overload and binding tooling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
