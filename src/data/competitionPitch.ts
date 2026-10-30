/**
 * Stage g: Competition Pitch & Live Demo Script
 * Engineered for university engineering capstone / innovation competitions.
 */

export interface DemoStep {
  timeMark: string;
  speakerAction: string;
  judgeSeesOnProjector: string;
  talkingPoint: string;
  failSafeFallback: string;
}

export interface JudgeQA {
  questionNumber: number;
  question: string;
  coreVulnerability: string;
  modelAnswer: string;
}

export const THREE_MINUTE_PITCH = [
  {
    phase: 'HOOK: The Invisible Cash Drain',
    timestamp: '0:00 - 0:30',
    spokenText: `Every single month, a metal fabricator on Kirinyaga Road in Nairobi pays Kenya Power an electricity bill of over 45,000 Shillings. But here is the tragedy: nearly 16,000 Shillings of that bill is paid for electricity that produced absolutely nothing. Not a single weld, not a single lathe cut, not a single finished window grille. It is consumed by idling motors left spinning during tea breaks, unloader valves venting compressed air into empty pipes, and dull drill bits wasting energy as heat. In Kenyan workshops, electrical waste isn't just invisible kilowatt-hours—it is rent money, worker wages, and business survival.`,
  },
  {
    phase: 'PROBLEM & INSIGHT: Why Smart Meters Fail Juakali',
    timestamp: '0:30 - 1:15',
    spokenText: `Existing commercial energy monitors fail small workshops for two reasons. First, cost: an imported industrial sub-meter costs upwards of 50,000 Shillings, requiring certified electricians to install. Second, and more importantly: standard meters only display Volts, Amps, or Kilowatt-hours. To a workshop foreman running five noisy machines, a readout saying '1.4 Kilowatts' is completely meaningless. Does that mean the lathe is cutting steel, or does it mean the operator walked away and left the motor spinning freely? A standard meter cannot tell you. GhostLoad can.`,
  },
  {
    phase: 'SOLUTION: Sensing + Ground-Truth Activity',
    timestamp: '1:15 - 2:00',
    spokenText: `GhostLoad is a low-cost, non-invasive system built on the ESP32 that turns invisible electrical waste into immediate Kenyan Shillings. By pairing a split-core current clamp and isolated voltage transformer with a physical machine-activity sensor—like a carriage limit switch or spindle vibration sensor—GhostLoad does what no standard smart meter can: it classifies machine operation into four real-time states: Productive work, Standby vampire draw, Abnormal tool degradation, and Avoidable idle time. It then multiplies that wasted energy by Kenya Power's actual gazetted EPRA commercial tariff, displaying one unmistakable headline: 'KES Wasted Today'.`,
  },
  {
    phase: 'PROOF & ECONOMICS: Validated ROI in Days',
    timestamp: '2:00 - 2:30',
    spokenText: `We built and tested GhostLoad right here in Nairobi against a reference meter. Our discrete integration algorithm computes true instantaneous real power with an error of just 1.64% across loads from 15 Watts to 1.5 Kilowatts. A single GhostLoad monitoring node costs less than 4,500 KES in locally sourced components. In our live workshop validation, identifying just 2 hours of daily compressor idle and 45 minutes of unloaded lathe spinning recovered 14,800 KES per month. The hardware pays for itself in less than 12 working days.`,
  },
  {
    phase: 'BUSINESS CASE & THE ASK',
    timestamp: '2:30 - 3:00',
    spokenText: `There are over 150,000 informal and formal light manufacturing workshops across Kenya, from Industrial Area to Gikomba. By scaling GhostLoad into an affordable retrofittable kit with local SMS waste alerts, we empower small business owners to take control of their biggest overhead. We have built the working hardware, the cloud dashboard, and the firmware that buffers data through spotty mobile hotspots. Today, we are seeking seed funding and pilot workshop partners in Nairobi to deploy our first 20-machine field cohort. Thank you.`,
  },
];

export const DEMO_RUN_SHEET: DemoStep[] = [
  {
    timeMark: '0:00 - 0:45',
    speakerAction: 'Stand at projector with GhostLoad demo box. Switch simulated load to Standby (DRO / cooling fan).',
    judgeSeesOnProjector: 'Dashboard displays "Machine 1: Metal Lathe" in STANDBY (Blue/Slate). Power: 24W. Headline KES Wasted counter begins ticking at KES 0.60/hr.',
    talkingPoint: '"Notice how the machine is plugged in but not operating. GhostLoad immediately catches this standby vampire draw and attaches an exact shilling figure."',
    failSafeFallback: 'If hardware WiFi fails, click the "Seed Fallback" toggle on dashboard; all states continue to render smoothly.',
  },
  {
    timeMark: '0:45 - 1:30',
    speakerAction: 'Switch on main motor, but leave the activity limit switch OPEN (simulating operator walking away with motor spinning).',
    judgeSeesOnProjector: 'Power jumps to 620W, Power Factor drops to 0.42. System enters grace period, then flips state badge to crimson/amber: AVOIDABLE IDLE. Headline KES counter accelerates rapidly (+KES 14.80/hr).',
    talkingPoint: '"Look at what happened: standard meters would show 620 Watts and assume productive work. But because our activity sensor is disengaged, GhostLoad flags this as Avoidable Idle. The machine is burning 15 Shillings an hour doing nothing."',
    failSafeFallback: 'Click "Simulate Idle" button on the hardware simulator toolbar in the dashboard.',
  },
  {
    timeMark: '1:30 - 2:15',
    speakerAction: 'Engage the workpiece limit switch (or tap MPU6050 vibration sensor).',
    judgeSeesOnProjector: 'State badge instantly flips to PRODUCTIVE (Green). Power Factor rises to 0.88. The waste counter stops increasing; the productive kWh gauge climbs.',
    talkingPoint: '"The moment the operator feeds the tool into the metal, the activity signal goes high. GhostLoad instantly transitions to Productive. We do not penalize real work."',
    failSafeFallback: 'Click "Simulate Productive" button in dashboard.',
  },
  {
    timeMark: '2:15 - 2:45',
    speakerAction: 'Turn off phone hotspot for 15 seconds, then turn it back on.',
    judgeSeesOnProjector: 'WiFi status changes to "Offline (Buffering in LittleFS)". Packets queue in flash. When hotspot returns, buffer counter drains to 0 within 3 seconds, timeline updates without missing a beat.',
    talkingPoint: '"In Kenyan workshops, internet is never guaranteed. GhostLoad buffers up to 50 minutes of telemetry locally in ESP32 flash memory and syncs seamlessly upon reconnect."',
    failSafeFallback: 'Click "Toggle WiFi Drop" button in dashboard simulator.',
  },
  {
    timeMark: '2:45 - 3:00',
    speakerAction: 'Point to the Headline KES Wasted widget and monthly savings projection.',
    judgeSeesOnProjector: 'Shows "KES 420 Wasted Today across 4 Machines | Projected Monthly Savings: KES 10,920 | Hardware Payback: 11 Days".',
    talkingPoint: '"By replacing abstract electrical units with cold, hard Kenyan Shillings, we give business owners the exact proof they need to stop wasting money today."',
    failSafeFallback: 'Dashboard summary cards permanently cache latest values.',
  },
];

export const TOP_10_JUDGE_QUESTIONS: JudgeQA[] = [
  {
    questionNumber: 1,
    question: "How does GhostLoad differ from an off-the-shelf smart plug or industrial sub-meter like a PZEM or Eastron?",
    coreVulnerability: "Is this just an expensive repackaging of existing metering hardware?",
    modelAnswer: "A standard smart meter only measures electrical quantities—it tells you how much power is being drawn, but it is completely blind to machine context. It cannot distinguish between a motor spinning productively while cutting steel versus a motor spinning unloaded while an operator is on their phone. GhostLoad fuses non-invasive power measurement with a ground-truth machine activity sensor (limit switch or vibration) and Kenya Power tariffs to categorize power into actionable money waste categories: Standby, Idle, and Abnormal tool degradation.",
  },
  {
    questionNumber: 2,
    question: "Why use the ADS1115 ADC instead of the ESP32's internal 12-bit ADC pins?",
    coreVulnerability: "Are you adding unnecessary BOM cost?",
    modelAnswer: "The ESP32 internal ADC has two critical engineering flaws for AC energy metering. First, severe non-linearity near 0V and 3.3V, which destroys accuracy during zero-crossings and low-current standby measurement. Second, ADC2 cannot be used at all when WiFi is active due to silicon-level radio peripheral sharing. The external ADS1115 provides genuine 16-bit resolution, programmable gain amplification, and true differential sampling, isolating the analog front-end from digital MCU switching noise for just KES 650.",
  },
  {
    questionNumber: 3,
    question: "What is your measurement accuracy, and can it be used for utility billing disputes?",
    coreVulnerability: "Is the student overpromising billing-grade accuracy with cheap hobbyist parts?",
    modelAnswer: "GhostLoad is explicitly an indicative energy auditor, not a Class 0.5 utility billing meter. We calibrated GhostLoad against a PZEM-004T v3 reference meter and Fluke clamp across 5 load steps from 15W to 1,500W. Our measured mean real power error is 1.64%, with a worst-case error under ±4.2%. In an industrial energy audit, a ±5% margin of error on a 15,000 KES monthly waste projection is more than sufficient to make high-confidence operational and financial decisions.",
  },
  {
    questionNumber: 4,
    question: "How do you handle inductive loads, phase angle, and harmonics from variable speed drives (VFDs)?",
    coreVulnerability: "Did you just multiply Vrms * Irms, which is apparent power, not real power?",
    modelAnswer: "We strictly compute real power using discrete cycle integration: P = (1/N) * sum(v[n] * i[n]) over integer 20ms cycles of the 50 Hz waveform at 860 samples per second. Because we multiply instantaneous voltage and current point-by-point before averaging, the phase displacement is automatically accounted for, yielding true real power in Watts and true Power Factor (P / S), rather than the naive Vrms * Irms approximation.",
  },
  {
    questionNumber: 5,
    question: "How does the machine-activity sensor handle different machine types? A lathe is different from a compressor or welding machine.",
    coreVulnerability: "Is the activity sensor too bespoke or fragile for a dirty workshop environment?",
    modelAnswer: "GhostLoad supports three modular, interchangeable activity sensing modalities: 1) For manual machine tools (lathes, mills, drills), a rugged roller microswitch on the tool carriage or spindle feed lever. 2) For continuous/enclosed machinery (compressors, planers), an I2C MPU-6050 vibration sensor mounted with a magnetic base that triggers when mechanical cutting frequencies exceed baseline. 3) For welding or induction heating, a current threshold rate-of-change (di/dt) derivative rule in firmware.",
  },
  {
    questionNumber: 6,
    question: "What happens when the workshop's WiFi router or phone hotspot drops out?",
    coreVulnerability: "Will data be lost during frequent Kenyan connectivity disruptions?",
    modelAnswer: "We engineered a non-blocking LittleFS circular FIFO buffer in the ESP32's onboard 4MB flash memory. When WiFi disconnects, the ESP32 automatically logs every 2-second telemetry packet to flash storage—storing up to 50 minutes of continuous data. The moment connection to the hotspot is restored, the ESP32 bursts the queued packets to the server FIFO in chronological order without interrupting the high-speed sampling loop.",
  },
  {
    questionNumber: 7,
    question: "Is mains electrical safety compromised when installing this in a damp or dusty workshop?",
    coreVulnerability: "Is there an electrical fire or shock hazard with exposed hobbyist wiring?",
    modelAnswer: "Safety was our primary design constraint. GhostLoad is 100% galvanically isolated from mains. Current is captured using a split-core SCT-013 current clamp that wraps around insulated wire without breaking the circuit. Voltage is stepped down through a ZMPT101B transformer rated for 4,000V dielectric isolation. The high-voltage voltage sense line is protected by a 250mA fast-blow ceramic fuse inside an IP54 flame-retardant ABS enclosure.",
  },
  {
    questionNumber: 8,
    question: "How did you formulate your electricity tariff? Electricity billing in Kenya is notoriously complex.",
    coreVulnerability: "Are the KES cost calculations arbitrary or outdated?",
    modelAnswer: "We modeled the exact gazetted EPRA (Energy and Petroleum Regulatory Authority) Small Commercial (SC) tariff formula. It is not just a flat per-unit fee. We break down: Base Energy Rate (KES 15.20), Fuel Energy Charge (KES 4.14), Forex Adjustment (KES 1.82), REP 5% levy, EPRA levy (0.08), WARMA water levy (0.02), Inflation (0.67), plus 16% VAT on taxable components. This yields an effective rate of ~KES 23.50 to 25.80 / kWh. Every component is fully configurable in our software.",
  },
  {
    questionNumber: 9,
    question: "Why should a workshop owner pay for this instead of just telling workers to switch machines off?",
    coreVulnerability: "Is behavioral policy enough without a hardware system?",
    modelAnswer: "Behavioral rules fail because electrical waste is silent and invisible. An operator leaves an air compressor running because they don't hear the motor over the workshop noise; a lathe spindle spins while a machinist measures a part with calipers. When a business owner sees a dashboard on their wall or phone showing 'Machine 2 has burned KES 340 while idling today', they have objective, indisputable data. Furthermore, GhostLoad includes a relay module that can automatically de-energize a machine after a configurable idle timeout.",
  },
  {
    questionNumber: 10,
    question: "Can this system scale to monitor 20 or 50 machines in a larger industrial plant?",
    coreVulnerability: "Does the architecture collapse when moving beyond a single demo unit?",
    modelAnswer: "Yes. Our architecture is decoupled by design. Each machine runs an independent ESP32 edge node broadcasting lightweight JSON packets over MQTT or HTTP to a central Node.js broker backed by a MongoDB time-series collection. A single cheap workshop Wi-Fi access point can comfortably handle 50 ESP32 nodes publishing at 2-second intervals, requiring less than 80 kilobits per second of total network bandwidth.",
  },
];
