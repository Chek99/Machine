import { MachineConfig } from '../types';

export const INITIAL_MACHINES: MachineConfig[] = [
  {
    id: 'MCH-01',
    name: 'Precision Metal Lathe (1.5 kW)',
    type: 'Turning / Machining',
    nominalPowerW: 1450,
    standbyPowerBandW: [8, 45], // Digital DRO + cooling fan + control circuitry
    productivePowerBandW: [850, 1650], // Motor under cutting pass with tool feed
    abnormalThresholdW: 1750, // Dull carbide insert, binding gears, or excessive depth of cut
    minPowerFactorThreshold: 0.72,
    idleDelayGraceSeconds: 120, // 2 minutes motor spinning without workpiece engaged
    relayActive: true,
    ctRatingA: 30,
  },
  {
    id: 'MCH-02',
    name: 'Piston Air Compressor (2.2 kW)',
    type: 'Pneumatics / Supply',
    nominalPowerW: 2200,
    standbyPowerBandW: [4, 18], // Pressure switch & unloader solenoid idle
    productivePowerBandW: [1950, 2450], // Tank charging under compression
    abnormalThresholdW: 2650, // Piston ring wear, blocked air intake, or leaking manifold
    minPowerFactorThreshold: 0.82,
    idleDelayGraceSeconds: 60, // Rapid idle detection when unloader valve vents continuously
    relayActive: true,
    ctRatingA: 30,
  },
  {
    id: 'MCH-03',
    name: 'Pillar Drill Press (750 W)',
    type: 'Drilling & Boring',
    nominalPowerW: 720,
    standbyPowerBandW: [2, 12], // Pilot light / digital depth readout
    productivePowerBandW: [480, 820], // Hole penetration in mild steel
    abnormalThresholdW: 900, // Dull drill bit rubbing without cutting, excessive feed force
    minPowerFactorThreshold: 0.65,
    idleDelayGraceSeconds: 150, // Spindle spinning freely while operator reads blueprints
    relayActive: true,
    ctRatingA: 30,
  },
  {
    id: 'MCH-04',
    name: 'Heavy Wood Thicknesser (3.0 kW)',
    type: 'Carpentry & Planing',
    nominalPowerW: 2900,
    standbyPowerBandW: [12, 50], // Magnetic starter coil + indicator
    productivePowerBandW: [2100, 3200], // Cutter block planing timber
    abnormalThresholdW: 3450, // Knives blunt, timber jammed, or heavy wet timber pass
    minPowerFactorThreshold: 0.78,
    idleDelayGraceSeconds: 180, // Heavy cutterhead running at no-load between timber passes
    relayActive: true,
    ctRatingA: 30,
  },
];
