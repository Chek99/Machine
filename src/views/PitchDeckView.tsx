import React, { useState } from 'react';
import { 
  Mic, 
  Play, 
  Pause, 
  HelpCircle, 
  Layout, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { 
  THREE_MINUTE_PITCH, 
  DEMO_RUN_SHEET, 
  TOP_10_JUDGE_QUESTIONS 
} from '../data/competitionPitch';

export const PitchDeckView: React.FC = () => {
  const [activePitchIndex, setActivePitchIndex] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(1);

  // Timer effect
  React.useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev >= 180) {
            setIsTimerRunning(false);
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
          <span>Stage G: Competition Pitch, Demo Run-Sheet & Defense</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          3-Minute Pitch Script, Demo Run-Sheet & Top 10 Judge Q&A
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Engineered for university engineering capstone and innovation competitions.
          Opens with an undeniable cash-loss hook, features a flawless 3-minute stage demo, and prepares for brutal technical cross-examination.
        </p>
      </div>

      {/* 1. 3-Minute Pitch Script with Interactive Teleprompter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mic className="w-5 h-5 text-amber-400" />
              <span>1. Three-Minute Pitch Script (Hook, Problem, Solution, Proof, Ask)</span>
            </h2>
            <p className="text-xs text-slate-400">Paced for standard 3:00 competition limit (120 words per minute)</p>
          </div>

          {/* Interactive Rehearsal Timer */}
          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 shrink-0">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className={`text-xl font-bold font-mono tabular-nums ${timerSeconds > 170 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
              {formatTimer(timerSeconds)}
            </span>
            <span className="text-xs text-slate-500">/ 3:00</span>
            <button
              onClick={toggleTimer}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={resetTimer}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Pitch Phase Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 pb-2">
          {THREE_MINUTE_PITCH.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setActivePitchIndex(idx)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                activePitchIndex === idx
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950'
              }`}
            >
              {p.timestamp}: {p.phase.split(':')[0]}
            </button>
          ))}
        </div>

        {/* Active Pitch Card */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400 uppercase tracking-wide">
              {THREE_MINUTE_PITCH[activePitchIndex].phase}
            </span>
            <span className="font-mono text-slate-400">
              Target Timing: {THREE_MINUTE_PITCH[activePitchIndex].timestamp}
            </span>
          </div>

          <p className="text-base text-slate-200 leading-relaxed font-sans">
            "{THREE_MINUTE_PITCH[activePitchIndex].spokenText}"
          </p>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Speaker Cue: Maintain confident eye contact with non-technical business judges.</span>
            <button
              onClick={() => setActivePitchIndex((prev) => (prev + 1) % THREE_MINUTE_PITCH.length)}
              className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              Next Segment →
            </button>
          </div>
        </div>
      </div>

      {/* 2. Live Demo Run-Sheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Play className="w-5 h-5 text-amber-400" />
          <span>2. Live Demo Stage Run-Sheet (Step-by-Step with Backups)</span>
        </h2>
        <p className="text-xs text-slate-300">
          Choreographed cues between the speaker's physical actions on the demo rig, what judges see on the projector screen, and automatic fallback procedures:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Speaker Physical Action</th>
                <th className="py-2.5 px-3">What Judges See on Screen</th>
                <th className="py-2.5 px-3">Spoken Talking Point</th>
                <th className="py-2.5 px-3">Fail-Safe Backup Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {DEMO_RUN_SHEET.map((step, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                    {step.timeMark}
                  </td>
                  <td className="py-3 px-3 font-medium text-white max-w-[200px]">
                    {step.speakerAction}
                  </td>
                  <td className="py-3 px-3 max-w-[220px] text-slate-300">
                    {step.judgeSeesOnProjector}
                  </td>
                  <td className="py-3 px-3 italic text-amber-300/90 max-w-[220px]">
                    {step.talkingPoint}
                  </td>
                  <td className="py-3 px-3 text-rose-300/80 font-mono text-[11px] max-w-[180px]">
                    {step.failSafeFallback}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Top 10 Toughest Judge Questions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <span>3. Top 10 Toughest Judge Questions & Candid Defense Answers</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pre-empting aggressive engineering critiques on accuracy limits, VFD harmonics, ADC non-linearity, and market viability:
          </p>
        </div>

        <div className="space-y-3">
          {TOP_10_JUDGE_QUESTIONS.map((qa) => {
            const isExpanded = expandedQuestion === qa.questionNumber;
            return (
              <div
                key={qa.questionNumber}
                className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedQuestion(isExpanded ? null : qa.questionNumber)}
                  className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
                      Q{qa.questionNumber}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {qa.question}
                      </h4>
                      <span className="text-[11px] text-rose-400 font-mono block mt-0.5">
                        Core Vulnerability: {qa.coreVulnerability}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed bg-slate-900/30">
                    <strong className="text-emerald-400 block mb-1 uppercase tracking-wide text-[11px]">
                      Model Defense Answer:
                    </strong>
                    <p>{qa.modelAnswer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. One-Slide & One-Page Executive Summary Layouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Layout className="w-4 h-4 text-amber-400" />
            <span>4. One-Slide Competition Deck Layout</span>
          </h3>
          <p className="text-xs text-slate-300">
            For rapid 1-slide pitch tracks (e.g. 90-second lightning rounds):
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2 font-mono text-slate-300">
            <div className="text-amber-400 font-bold border-b border-slate-800 pb-1">
              SLIDE TITLE: GhostLoad — Turning Invisible Electrical Waste into Kenyan Shillings
            </div>
            <div>• <strong>Left 40% (The Burning Problem):</strong> "KES 16,000 Wasted Every Month in Kenyan Workshops" + Photo of metal lathe idling during tea break.</div>
            <div>• <strong>Center 30% (The Innovation):</strong> Split-Core CT + Activity Switch + ESP32 Node (BOM: KES 4,500) producing 4 discrete operational states.</div>
            <div>• <strong>Right 30% (Economic Validation):</strong> Headline KES counter + 12-day hardware payback + 1.64% verified laboratory accuracy.</div>
            <div className="text-emerald-400 text-[11px] pt-1">No bullet points or generic stock photos; leads directly with financial proof.</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>5. One-Page Executive Summary Layout</span>
          </h3>
          <p className="text-xs text-slate-300">
            Leave-behind executive brief for competition judges and angel investors:
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2 font-mono text-slate-300">
            <div className="text-amber-400 font-bold border-b border-slate-800 pb-1">
              DOCUMENT: GhostLoad Technical & Commercial Executive Brief (A4 Format)
            </div>
            <div>• <strong>Header:</strong> GhostLoad Wordmark + Student EEE Capstone Project + Nairobi, Kenya.</div>
            <div>• <strong>Section 1: Executive Summary & Opportunity:</strong> 150,000 light workshops paying high EPRA commercial electricity rates.</div>
            <div>• <strong>Section 2: Engineering Architecture:</strong> ADS1115 synchronous sampling, LittleFS offline buffer, galvanic isolation.</div>
            <div>• <strong>Section 3: Empirical Validation:</strong> PZEM-004T benchmark error table (1.64% mean error) + Confusion matrix (98.8% accuracy).</div>
            <div>• <strong>Section 4: Financial Model & Unit Economics:</strong> Cost per node KES 4,500; payback in 12 days; 65% actionable recovery.</div>
          </div>
        </div>
      </div>

      {/* Stage g Verification Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-3">
          Stage G Engineering Verification Checklist
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Is every number sourced from test results or labeled as an estimate?</strong>
              <p className="text-slate-400 mt-0.5">
                YES. 1.64% power accuracy is drawn from TC-01; KES 4,500 BOM cost from Stage A BOM; 12-day payback from empirical 65% recovery model on Stage D.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Does the demo fit in the time limit with a buffer?</strong>
              <p className="text-slate-400 mt-0.5">
                YES. The pitch is timed at 2 minutes 45 seconds, leaving a 15-second buffer before the 3-minute gong.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Is there a fallback for every point of failure?</strong>
              <p className="text-slate-400 mt-0.5">
                YES. If phone hotspot fails, the built-in LittleFS offline buffer queues data and the dashboard has an instant "Seed Fallback" toggle. If an actual load trips, software state injection buttons can demonstrate each state on demand.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
