import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Wifi, 
  WifiOff, 
  Activity, 
  RotateCcw, 
  Radio, 
  Wrench,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { telemetryStore } from '../services/telemetryStore';
import { MachineState } from '../types';

interface HardwareSimulatorBarProps {
  selectedMachineId: string;
  setSelectedMachineId: (id: string) => void;
  isWifiOnline: boolean;
  offlineBufferCount: number;
}

export const HardwareSimulatorBar: React.FC<HardwareSimulatorBarProps> = ({
  selectedMachineId,
  setSelectedMachineId,
  isWifiOnline,
  offlineBufferCount,
}) => {
  const machines = telemetryStore.getMachines();
  const currentMachine = telemetryStore.getMachine(selectedMachineId);
  const isAutoScript = telemetryStore.isAutoSequenceActive();

  const handleStateClick = (state: MachineState | 'AUTO') => {
    if (!currentMachine) return;
    const activityState = state === 'PRODUCTIVE' ? true : false;
    telemetryStore.setMachineOverride(selectedMachineId, state, activityState);
  };

  const toggleActivitySensor = () => {
    telemetryStore.toggleActivitySensor(selectedMachineId);
  };

  const toggleWifiDrop = () => {
    telemetryStore.toggleWifi();
  };

  const toggleAutoSequence = () => {
    telemetryStore.toggleDemoAutoSequence();
  };

  const resetAll = () => {
    telemetryStore.resetAllToSeed();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        {/* Machine Picker & Auto-Script Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Hardware Rig Testbench
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Machine selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {machines.map((m) => (
              <button
                key={m.config.id}
                onClick={() => setSelectedMachineId(m.config.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  selectedMachineId === m.config.id
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.config.id}: {m.config.type.split('/')[0]}
              </button>
            ))}
          </div>

          {/* 3-Minute Competition Demo Autopilot */}
          <button
            onClick={toggleAutoSequence}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
              isAutoScript
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {isAutoScript ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoScript ? 'Autopilot Demo Playing...' : 'Run 3-Min Script'}</span>
          </button>
        </div>

        {/* Live Simulation Controls */}
        <div className="flex items-center gap-3 flex-wrap w-full xl:w-auto justify-between xl:justify-end">
          {/* State Injection Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-500 px-1 font-mono">Inject:</span>
            <button
              onClick={() => handleStateClick('STANDBY')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                currentMachine?.latestTelemetry.classifiedState === 'STANDBY'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Standby
            </button>
            <button
              onClick={() => handleStateClick('AVOIDABLE_IDLE')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                currentMachine?.latestTelemetry.classifiedState === 'AVOIDABLE_IDLE'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Idle Spin
            </button>
            <button
              onClick={() => handleStateClick('PRODUCTIVE')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                currentMachine?.latestTelemetry.classifiedState === 'PRODUCTIVE'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cutting
            </button>
            <button
              onClick={() => handleStateClick('ABNORMAL')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                currentMachine?.latestTelemetry.classifiedState === 'ABNORMAL'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dull Tool Fault
            </button>
          </div>

          {/* Activity Sensor Toggle (Microswitch / Spindle Vibration) */}
          <button
            onClick={toggleActivitySensor}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              currentMachine?.activityOverride
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Ground-Truth Machine Activity Input (Limit switch / vibration)"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Activity Sensor: {currentMachine?.activityOverride ? 'ENGAGED' : 'OPEN'}</span>
            {currentMachine?.activityOverride ? (
              <ToggleRight className="w-4 h-4 text-emerald-400 ml-1" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-slate-500 ml-1" />
            )}
          </button>

          {/* Phone Hotspot Dropout Simulation */}
          <button
            onClick={toggleWifiDrop}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              isWifiOnline
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-rose-950/80 text-rose-300 border-rose-600 animate-pulse'
            }`}
            title="Simulate Spotty Phone Hotspot WiFi Dropping Out"
          >
            {isWifiOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
            <span>
              {isWifiOnline
                ? 'Hotspot Online'
                : `Hotspot Drop (${offlineBufferCount} LittleFS queued)`}
            </span>
          </button>

          {/* Reset button */}
          <button
            onClick={resetAll}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer"
            title="Reset telemetry to default workshop state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
