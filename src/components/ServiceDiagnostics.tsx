import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Cpu, 
  Sliders, 
  ShieldCheck, 
  Terminal, 
  Radio, 
  Zap, 
  Send, 
  Search, 
  ChevronRight, 
  Layers, 
  Compass, 
  Gauge, 
  HardDrive,
  Info,
  Play,
  Square,
  RotateCw,
  Flame,
  Lightbulb,
  CornerDownRight
} from 'lucide-react';
import { 
  MasterDiagnosticReport, 
  ChannelPortScanInfo, 
  SecurityStrategyResult, 
  MasterSystemInfo,
  MotorMotionTestResult,
  LedTestResult
} from '../types';

interface ServiceDiagnosticsProps {
  onClose?: () => void;
}

export default function ServiceDiagnostics({ onClose }: ServiceDiagnosticsProps) {
  const [report, setReport] = useState<MasterDiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState('opc.tcp://10.191.199.182:4840');
  const [customUser, setCustomUser] = useState('admin');
  const [customPass, setCustomPass] = useState('admin');
  const [forceNodeId, setForceNodeId] = useState('');

  // Motion 1 Deg & LED Test States
  const [motor1DegResult, setMotor1DegResult] = useState<MotorMotionTestResult | null>(null);
  const [motorTestError, setMotorTestError] = useState<string | null>(null);
  const [running1DegTest, setRunning1DegTest] = useState(false);
  const [ledTestResult, setLedTestResult] = useState<LedTestResult | null>(null);
  const [runningLedTest, setRunningLedTest] = useState(false);
  const [selectedLedColor, setSelectedLedColor] = useState<number>(0x05); // 0x05=Blue
  
  // Custom Tester State
  const [testNodeId, setTestNodeId] = useState('ns=7;i=640');
  const [testDataType, setTestDataType] = useState<'ByteString' | 'ByteArray' | 'Int16' | 'Int32' | 'Boolean'>('ByteString');
  const [testHexPayload, setTestHexPayload] = useState('001100000000');
  const [testResult, setTestResult] = useState<any>(null);
  const [testingWrite, setTestingWrite] = useState(false);
  const [testingRead, setTestingRead] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ports' | 'motion' | 'strategies' | 'tester' | 'report'>('motion');

  useEffect(() => {
    runScan();
  }, []);

  const handleRunMotor1DegTest = async () => {
    setRunning1DegTest(true);
    setMotorTestError(null);
    setMotor1DegResult(null);
    try {
      const res = await fetch('/api/diagnostics/motor-1deg-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: customEndpoint,
          username: customUser,
          password: customPass,
          forceNodeId: forceNodeId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMotor1DegResult(data);
      } else {
        setMotorTestError(data.error || 'Unbekannter Fehler');
      }
    } catch (e: any) {
      console.error('1 deg test failed:', e);
      setMotorTestError(e.message);
    } finally {
      setRunning1DegTest(false);
    }
  };

  const handleRunLedTest = async (colorCode: number, port: string = "X3") => {
    setRunningLedTest(true);
    setSelectedLedColor(colorCode);
    try {
      const res = await fetch('/api/diagnostics/led-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: customEndpoint,
          username: customUser,
          password: customPass,
          color: colorCode,
          port
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLedTestResult(data);
      }
    } catch (e: any) {
      console.error('LED test failed:', e);
    } finally {
      setRunningLedTest(false);
    }
  };

  const runScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/diagnostics/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: customEndpoint,
          username: customUser,
          password: customPass
        })
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e: any) {
      console.error('Scan failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const copyAiReport = () => {
    if (!report?.aiSummaryReport) return;
    navigator.clipboard.writeText(report.aiSummaryReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCustomWrite = async () => {
    setTestingWrite(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/diagnostics/custom-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: testNodeId,
          dataType: testDataType,
          hexValue: testHexPayload
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
    } finally {
      setTestingWrite(false);
    }
  };

  const handleCustomRead = async () => {
    setTestingRead(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/diagnostics/custom-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: testNodeId })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
    } finally {
      setTestingRead(false);
    }
  };

  const applyPreset = (node: string, type: 'ByteString' | 'ByteArray' | 'Int16' | 'Int32' | 'Boolean', hex: string) => {
    setTestNodeId(node);
    setTestDataType(type);
    setTestHexPayload(hex);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden min-h-0">
      
      {/* Top Diagnostic Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg border border-indigo-400/30">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Baumer IO-Link Master & OPC UA Diagnose-Center
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 font-mono font-medium">
                X0–X7 Deep Inspector
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              System-Scan, Port-Identifikation, Verbindungs-Matrix & AI-Protokollgenerator
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={runScan}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer active:scale-98 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Diagnose läuft...' : 'Kompletten Scan ausführen'}
          </button>

          <button
            onClick={copyAiReport}
            disabled={!report}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border transition shadow-md cursor-pointer active:scale-98 ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-emerald-400" />}
            {copied ? 'In Zwischenablage kopiert!' : 'Diagnosebericht für KI kopieren'}
          </button>
        </div>
      </div>

      {/* PROFINET Soft-SPS Callout */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border-b border-blue-800/40 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-blue-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span><strong>Empfohlener Industriemodus:</strong> PROFINET Soft-SPS auf dem Raspberry Pi 5 läuft 100% offline und steuert Motor & Sensor im 4ms-Echtzeittakt.</span>
        </div>
        <span className="text-[11px] bg-blue-500/20 px-2 py-0.5 rounded text-blue-300 border border-blue-500/30">
          Reiter "PROFINET Soft-SPS" oben aktivierbar
        </span>
      </div>

      {/* Target & Credentials Sub-Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Endpoint:</span>
            <input
              type="text"
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 w-64 text-xs font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">User:</span>
            <input
              type="text"
              value={customUser}
              onChange={(e) => setCustomUser(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 w-24 text-xs font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Passwort:</span>
            <input
              type="password"
              value={customPass}
              onChange={(e) => setCustomPass(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 w-24 text-xs font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Aktiver Status:</span>
          <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
            report?.activeSessionConnected 
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
              : 'bg-amber-950 text-amber-400 border border-amber-800'
          }`}>
            {report?.selectedStrategy || 'Warte auf Scan...'}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-slate-950 px-4 pt-3 border-b border-slate-800 gap-2 shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('motion')}
          className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'motion'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCw className="w-4 h-4 text-emerald-400" /> 1. 🚀 1° Motor & Aktor Diagnose
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> 2. Master & System
        </button>
        <button
          onClick={() => setActiveTab('ports')}
          className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'ports'
              ? 'border-blue-500 text-blue-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" /> 3. Kanäle X0–X7 ({report?.ports.length || 8})
        </button>
        <button
          onClick={() => setActiveTab('strategies')}
          className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'strategies'
              ? 'border-blue-500 text-blue-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> 4. Verbindungs-Matrix
        </button>
        <button
          onClick={() => setActiveTab('tester')}
          className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'tester'
              ? 'border-blue-500 text-blue-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" /> 5. Manuelles Test-Terminal
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'report'
              ? 'border-blue-500 text-blue-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Copy className="w-4 h-4 text-emerald-400" /> 6. AI-Prüfbericht (Volltext)
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto min-h-0">

        {/* TAB: 1° MOTOR & AKTOR MOTION DIAGNOSE */}
        {activeTab === 'motion' && (
          <div className="space-y-6">
            
            {/* Top Action Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <RotateCw className="w-5 h-5 text-emerald-400" /> Aktiver 1° Motor-Bewegungstest & Aktor-Inspektion
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-medium">
                      7 Telegramm-Varianten & Live Δ-Tracking
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Sendet systematisch 7 verschiedene Ansteuerungs-Formate (32-Byte Buffer, 6-Byte, ByteArray, Jog-Pulse, Speed/Torque Bytes) an Port X0 (<code className="text-blue-300">ns=7;i=640</code>) und misst die exakte Inkrement-Änderung an <code className="text-emerald-300">ns=7;i=690</code>.
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <span className="text-slate-400">Force ID (optional):</span>
                    <input
                      type="text"
                      placeholder="z.B. ns=7;i=641"
                      value={forceNodeId}
                      onChange={(e) => setForceNodeId(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-400 w-32 font-mono placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleRunMotor1DegTest}
                    disabled={running1DegTest}
                    className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/50 cursor-pointer active:scale-98 transition"
                  >
                    <Play className={`w-4 h-4 ${running1DegTest ? 'animate-spin text-white' : 'text-emerald-200 fill-emerald-200'}`} />
                    {running1DegTest ? 'Test läuft...' : '1° Motor-Bewegungstest ausführen'}
                  </button>
                </div>
              </div>
            </div>

            {motorTestError && (
              <div className="p-4 bg-red-950/60 border border-red-700 text-red-200 rounded-xl font-mono text-sm flex items-start gap-3 shadow-xl">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <div className="font-bold text-red-400 mb-1">Fehler beim Ausführen des Bewegungstests!</div>
                  <div className="whitespace-pre-wrap">{motorTestError}</div>
                </div>
              </div>
            )}

            {/* Live Result / Delta Banner */}
            {motor1DegResult && (
              <div className="space-y-4">
                
                {/* Result Hero Banner */}
                <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono shadow-xl ${
                  motor1DegResult.hasMoved
                    ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200'
                    : 'bg-amber-950/60 border-amber-700/80 text-amber-200'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      motor1DegResult.hasMoved 
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-400' 
                        : 'bg-amber-600/30 border-amber-500 text-amber-400'
                    }`}>
                      {motor1DegResult.hasMoved ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2">
                        {motor1DegResult.hasMoved ? '🎉 MOTOR-BEWEGUNG ERFOLGREICH DETEKTIERT!' : '⚠️ KEINE PHYSISCHE BEWEGUNG REGISTRIERT'}
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-white font-mono">
                          Δ = {motor1DegResult.deltaInc} Inc ({motor1DegResult.deltaDeg}°)
                        </span>
                      </div>
                      <p className="text-xs mt-1 text-slate-300 font-sans">
                        {motor1DegResult.detailedAnalysis}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-3 rounded-lg border border-slate-800 shrink-0 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Start-Position:</span>
                      <strong className="text-white font-bold">{motor1DegResult.startPosInc} Inc ({motor1DegResult.startDeg}°)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">End-Position:</span>
                      <strong className="text-white font-bold">{motor1DegResult.endPosInc} Inc ({motor1DegResult.endDeg}°)</strong>
                    </div>
                  </div>
                </div>

                {/* Safety & Physical Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  
                  {/* Item 2: Trigger Port X5 */}
                  <div className="p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-300 flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
                      <span>Port X5: Trigger-Signal</span>
                      <Radio className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="my-1.5 text-sm font-bold text-blue-400">
                      {motor1DegResult.safetyStatus.triggerInputX5 ? 'Aktiv (1)' : 'Inaktiv (0)'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Node ns=7;i=695</div>
                  </div>

                  {/* Item 3: Actuator Power Up */}
                  <div className="p-3 rounded-xl border bg-slate-900 border-slate-800 text-slate-300 flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
                      <span>Aktor-Spannung Up</span>
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="my-1.5 text-sm font-bold text-amber-400">
                      24.0 V DC
                    </div>
                    <div className="text-[10px] text-slate-400">Spitzenstrom mind. 2.0 A</div>
                  </div>

                  {/* Item 4: Drive Fault Bit */}
                  <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                    !motor1DegResult.safetyStatus.driveFaultReported
                      ? 'bg-slate-900 border-slate-800 text-slate-300'
                      : 'bg-red-950/40 border-red-800/80 text-red-300'
                  }`}>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
                      <span>Stellantrieb Fehler-Bit</span>
                      {!motor1DegResult.safetyStatus.driveFaultReported ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    <div className="my-1.5 text-sm font-bold">
                      {!motor1DegResult.safetyStatus.driveFaultReported ? 'Normal (Kein Fehler)' : '⚠️ Störung aktiv (Bit 7)'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">Raw: {motor1DegResult.safetyStatus.rawInputX0Hex}</div>
                  </div>

                </div>

                {/* Telegram Trials Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center font-mono">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" /> Einzel-Ergebnisse der 7 Telegramm-Varianten
                    </span>
                    <span className="text-[11px] text-slate-400">Halstrup-Walcher PSE 3325</span>
                  </div>

                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Test / Telegramm-Format</th>
                        <th className="p-3">Datentyp</th>
                        <th className="p-3">Gesendeter Hex-Payload</th>
                        <th className="p-3">OPC UA Status</th>
                        <th className="p-3">Position danach</th>
                        <th className="p-3">Δ Bewegung</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {motor1DegResult.trials.map((t, idx) => (
                        <tr key={idx} className={`hover:bg-slate-800/40 transition ${t.moved ? 'bg-emerald-950/20' : ''}`}>
                          <td className="p-3 font-bold text-white">
                            <div className="flex items-center gap-1.5">
                              {t.moved ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <CornerDownRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                              <span>{t.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">{t.formatDescription}</div>
                          </td>
                          <td className="p-3 text-blue-400">{t.dataType}</td>
                          <td className="p-3">
                            <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-300 text-[11px] border border-slate-800 block max-w-xs truncate">
                              {t.hexSent}
                            </code>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.opcStatusCode.includes('Good') 
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}>
                              {t.opcStatusCode}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-300">
                            {t.positionAfter} Inc
                          </td>
                          <td className="p-3 font-bold">
                            {t.moved ? (
                              <span className="text-emerald-400 font-bold">+{t.deltaInc} Inc ({t.deltaDeg}°)</span>
                            ) : (
                              <span className="text-slate-500 font-normal">0 Inc</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Recommendations Box */}
                {motor1DegResult.recommendations.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs">
                    <div className="text-white font-bold flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" /> Diagnose-Hinweise für Vor-Ort-Inbetriebnahme:
                    </div>
                    <ul className="space-y-1.5 text-slate-300 pl-2">
                      {motor1DegResult.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            )}

            {/* SEPARATE SECTION: TASTER & LED AKTOR DIAGNOSE (X3 FARBANZEIGE & X5/X6 DI) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" /> Taster- & LED-Aktor Diagnose (Port X3 Farbanzeige)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Prüfung der IO-Link Signalleuchte / Farb-LED auf Port X3 (NodeID: <code className="text-blue-400 font-bold">ns=7;i=643</code>).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Farbe wählen:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRunLedTest(0x05, "X3")}
                      disabled={runningLedTest}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold font-mono cursor-pointer transition active:scale-98"
                    >
                      🔵 Blau (0x05)
                    </button>
                    <button
                      onClick={() => handleRunLedTest(0x01, "X3")}
                      disabled={runningLedTest}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold font-mono cursor-pointer transition active:scale-98"
                    >
                      🟢 Grün (0x01)
                    </button>
                    <button
                      onClick={() => handleRunLedTest(0x02, "X3")}
                      disabled={runningLedTest}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold font-mono cursor-pointer transition active:scale-98 shadow-md shadow-orange-950/50"
                    >
                      🟠 Orange (0x02)
                    </button>
                    <button
                      onClick={() => handleRunLedTest(0x03, "X3")}
                      disabled={runningLedTest}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold font-mono cursor-pointer transition active:scale-98"
                    >
                      🟡 Amber (0x03)
                    </button>
                    <button
                      onClick={() => handleRunLedTest(0x04, "X3")}
                      disabled={runningLedTest}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold font-mono cursor-pointer transition active:scale-98"
                    >
                      🔴 Rot (0x04)
                    </button>
                    <button
                      onClick={() => handleRunLedTest(0x00, "X3")}
                      disabled={runningLedTest}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold font-mono cursor-pointer transition active:scale-98"
                    >
                      ⚪ Aus (0x00)
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-emerald-400/90 font-mono bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span><strong>Zyklischer Keep-Alive Output aktiv:</strong> Die gewählte LED-Farbe an Port X3 (<code className="text-blue-300">ns=7;i=643</code>) wird vom Server kontinuierlich alle 50ms gehalten, damit der Baumer IO-Link Master kein Watchdog-Timeout auslöst.</span>
              </div>

              {/* LED Test Results Grid */}
              {ledTestResult && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                    <span className="text-slate-300">Test-Ergebnis ({ledTestResult.activeColor}):</span>
                    <span className="text-emerald-400 font-bold">{ledTestResult.summary}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ledTestResult.testedPorts.map((p, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 font-mono text-[10px]">{p.portLabel}</span>
                            {p.description}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{p.nodeId}</span>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {p.variants.map((v, vIdx) => (
                            <div key={vIdx} className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-400">{v.dataType}:</span>
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                v.success 
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                                  : 'bg-slate-900 text-slate-400 border border-slate-800'
                              }`}>
                                {v.statusCode}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-3.5 text-xs text-blue-200">
                    <strong className="text-white block mb-1">Hinweis zur Kanal- & Port-Belegung:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      <li><strong>Port X3:</strong> IO-Link Farbmodul / LED-Aktor (<code className="text-white">ns=7;i=643</code>). Farbcodes: 0x05 (Blau), 0x01 (Grün), 0x04 (Rot), 0x02 (Gelb), 0x00 (Aus).</li>
                      <li><strong>Port X5:</strong> Digitaler Eingang (DI) — Hardware-Taster, der gedrückt gehalten wird (<code className="text-white">ns=7;i=695</code>).</li>
                      <li><strong>Port X6:</strong> Digitaler Eingang (DI) — Positionsabfrage Endlage unten / nicht unten (<code className="text-white">ns=7;i=696</code>).</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        
        {/* TAB 1: MASTER & SYSTEM OVERVIEW */}
        {activeTab === 'overview' && report && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Card 1: Master Health & Temperature */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-amber-400" /> Master Temperatur</span>
                  <span className="px-2 py-0.5 bg-amber-950 text-amber-400 rounded text-[10px] font-mono">Sensoren</span>
                </div>
                <div className="my-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-amber-400">
                    {report.masterInfo.temperatureCelsius}
                  </span>
                  <span className="text-sm font-bold text-slate-500 font-mono">°C</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono border-t border-slate-800/80 pt-1">
                  Status: <strong className="text-emerald-400">{report.masterInfo.systemStatus}</strong>
                </div>
              </div>

              {/* Card 2: Supply Voltages */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-blue-400" /> Betriebsspannung</span>
                  <span className="px-2 py-0.5 bg-blue-950 text-blue-400 rounded text-[10px] font-mono">Us & Up</span>
                </div>
                <div className="my-2 flex items-baseline justify-between font-mono">
                  <div>
                    <span className="text-2xl font-black text-blue-400">{report.masterInfo.supplyVoltageUs}V</span>
                    <span className="text-[10px] text-slate-500 ml-1">Us (Sensor)</span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-indigo-400">{report.masterInfo.supplyVoltageUp}V</span>
                    <span className="text-[10px] text-slate-500 ml-1">Up (Aktor)</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono border-t border-slate-800/80 pt-1">
                  Gesamtstrom: {report.masterInfo.totalCurrentAmps} A
                </div>
              </div>

              {/* Card 3: Network & IP */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><Radio className="w-4 h-4 text-emerald-400" /> Netzwerk Konfiguration</span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded text-[10px] font-mono">Port {report.masterInfo.opcUaPort}</span>
                </div>
                <div className="my-2 text-sm font-mono text-slate-200">
                  <div className="font-bold text-emerald-400">{report.masterInfo.ipAddress}</div>
                  <div className="text-xs text-slate-400">MAC: {report.masterInfo.macAddress}</div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono border-t border-slate-800/80 pt-1">
                  Gateway: {report.masterInfo.gateway}
                </div>
              </div>

              {/* Card 4: Device Revisions */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><HardDrive className="w-4 h-4 text-purple-400" /> Revisionen</span>
                  <span className="px-2 py-0.5 bg-purple-950 text-purple-400 rounded text-[10px] font-mono">Baumer</span>
                </div>
                <div className="my-2 text-xs font-mono text-slate-300">
                  <div>Model: <strong className="text-purple-300">{report.masterInfo.model}</strong></div>
                  <div>SN: <strong className="text-slate-300">{report.masterInfo.serialNumber}</strong></div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono border-t border-slate-800/80 pt-1">
                  FW: {report.masterInfo.firmwareVersion}
                </div>
              </div>

            </div>

            {/* Namespaces & Server Properties */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" /> Registrierte OPC UA Namespaces auf dem Master
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
                {report.masterInfo.namespaces.map((ns, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="text-blue-400 font-bold">ns={idx}</span>
                    <span className="text-slate-300 truncate max-w-xs">{ns}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Logs from Scan */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" /> Diagnose-Ereignisse während des Scans
              </h3>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs space-y-1.5">
                {report.logs.map((l, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-slate-500 shrink-0">[{l.time}]</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0 ${
                      l.level === 'success' ? 'bg-emerald-950 text-emerald-400' :
                      l.level === 'error' ? 'bg-red-950 text-red-400' :
                      l.level === 'warn' ? 'bg-amber-950 text-amber-400' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {l.level}
                    </span>
                    <span className="text-slate-300">{l.message}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: PORTS X0 TO X7 MATRIX */}
        {activeTab === 'ports' && report && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400" /> Vollständige Kanal-Übersicht: Alle 8 Ports (X0 bis X7)
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Automatische Geräteerkennung & Prozessdaten-Validierung
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.ports.map((port) => (
                <div 
                  key={port.portIndex}
                  className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between shadow-lg transition-all ${
                    port.status === 'OPERABLE' 
                      ? 'border-slate-800 hover:border-blue-500/50' 
                      : 'border-slate-800/60 opacity-80'
                  }`}
                >
                  <div>
                    {/* Port Header */}
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black font-mono text-sm ${
                          port.channelType === 'IO-Link' ? 'bg-blue-600 text-white' :
                          port.channelType === 'Digital Input (DI)' ? 'bg-emerald-600 text-white' :
                          port.channelType === 'Digital Output (DO)' ? 'bg-purple-600 text-white' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {port.portLabel}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            {port.productName}
                          </h4>
                          <p className="text-[11px] text-slate-400">{port.productDescription}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          port.status === 'OPERABLE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          port.status === 'NO_DEVICE' ? 'bg-slate-800 text-slate-400' :
                          'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {port.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-medium">
                          {port.channelType}
                        </span>
                      </div>
                    </div>

                    {/* Port Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div>
                        <span className="text-slate-500">Hersteller:</span> {port.vendorName}
                      </div>
                      <div>
                        <span className="text-slate-500">Vendor ID:</span> <strong className="text-amber-400">{port.vendorIdHex}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Geräte ID:</span> <strong className="text-blue-400">{port.deviceIdHex}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Serien-Nr.:</span> {port.serialNumber}
                      </div>
                    </div>

                    {/* Process Data Section */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 bg-slate-950/60 rounded-lg p-2.5 space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Input Node:</span>
                        <span className="text-emerald-400 font-bold">{port.inputNodeId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Rohdaten (Hex):</span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-amber-300 font-bold border border-slate-800">
                          {port.inputRawHex}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 pt-0.5 truncate">
                        {port.inputDecodedSummary}
                      </div>
                      {port.outputNodeId && (
                        <div className="flex justify-between items-center pt-1 border-t border-slate-800/40 text-[11px]">
                          <span className="text-slate-400">Output Node:</span>
                          <span className="text-purple-400 font-bold">{port.outputNodeId}</span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Action Bar */}
                  <div className="mt-3 pt-2 flex justify-end gap-2 border-t border-slate-800/60">
                    <button
                      onClick={() => {
                        applyPreset(port.inputNodeId, 'ByteString', port.inputRawHex);
                        setActiveTab('tester');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <Search className="w-3 h-3 text-blue-400" /> Im Tester prüfen
                    </button>
                    {port.outputNodeId && (
                      <button
                        onClick={() => {
                          applyPreset(port.outputNodeId!, 'ByteString', port.outputRawHex || '00');
                          setActiveTab('tester');
                        }}
                        className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded text-xs font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3 text-blue-400" /> Befehl senden
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CONNECTION STRATEGY MATRIX */}
        {activeTab === 'strategies' && report && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Automatische Sicherheits- & Handshake-Matrix
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Geprüfte Profile gegen den Baumer Master
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Profil-Name</th>
                    <th className="p-3.5">Security Mode</th>
                    <th className="p-3.5">Security Policy</th>
                    <th className="p-3.5">Authentifizierung</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Latenz</th>
                    <th className="p-3.5">Fehler-Rückmeldung / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-200">
                  {report.strategyMatrix.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        {s.name}
                      </td>
                      <td className="p-3.5 text-blue-400">{s.securityMode}</td>
                      <td className="p-3.5 text-purple-400">{s.securityPolicy}</td>
                      <td className="p-3.5 text-slate-400">{s.authType} {s.username ? `(${s.username})` : ''}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          s.status === 'FAILED' ? 'bg-red-950 text-red-400 border border-red-800' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-amber-400">{s.latencyMs} ms</td>
                      <td className="p-3.5 text-slate-400 max-w-xs truncate">
                        {s.errorMessage || 'Handshake erfolgreich abgeschlossen'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-4 text-xs font-mono text-blue-200 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Empfohlene Baumer-Konfiguration:</strong>
                Der Baumer CM50I.PN Master verlangt standardmäßig <code>SignAndEncrypt</code> mit <code>Basic256Sha256</code> und Benutzeranmeldung (<code>admin/admin</code>). 
                Das selbstsignierte Master-Zertifikat wird von unserem Hintergrund-Zertifikatsmanager automatisch im Truststore akzeptiert.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MANUAL INTERACTIVE TESTER */}
        {activeTab === 'tester' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Interactive Control */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" /> Manuelle OPC UA Lese- & Schreib-Konsole
              </h3>
              <p className="text-xs text-slate-400">
                Senden Sie benutzerdefinierte Hex-Befehle oder Bytes direkt an jede beliebige Node-ID des Masters.
              </p>

              {/* Quick Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 font-mono">Schnell-Vorlagen:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => applyPreset('ns=7;i=640', 'ByteString', '001100000000')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-left text-xs font-mono cursor-pointer"
                  >
                    <div className="font-bold text-emerald-400">Motor: Rechtslauf</div>
                    <div className="text-[10px] text-slate-500">ns=7;i=640 | 001100000000</div>
                  </button>
                  <button
                    onClick={() => applyPreset('ns=7;i=640', 'ByteString', '001200000000')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-left text-xs font-mono cursor-pointer"
                  >
                    <div className="font-bold text-blue-400">Motor: Linkslauf</div>
                    <div className="text-[10px] text-slate-500">ns=7;i=640 | 001200000000</div>
                  </button>
                  <button
                    onClick={() => applyPreset('ns=7;i=640', 'ByteString', '000000000000')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-left text-xs font-mono cursor-pointer"
                  >
                    <div className="font-bold text-red-400">Motor: Stopp</div>
                    <div className="text-[10px] text-slate-500">ns=7;i=640 | 000000000000</div>
                  </button>
                  <button
                    onClick={() => applyPreset('ns=7;i=643', 'ByteString', '05')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-left text-xs font-mono cursor-pointer"
                  >
                    <div className="font-bold text-indigo-400">LED: Blau (X3 Farbanzeige)</div>
                    <div className="text-[10px] text-slate-500">ns=7;i=643 | 0x05</div>
                  </button>
                </div>
              </div>

              {/* Node ID Input */}
              <div className="space-y-1.5 font-mono text-xs">
                <label className="text-slate-300 font-bold">Ziel NodeID:</label>
                <input
                  type="text"
                  value={testNodeId}
                  onChange={(e) => setTestNodeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                  placeholder="ns=7;i=640"
                />
              </div>

              {/* Data Type & Payload */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Datentyp:</label>
                  <select
                    value={testDataType}
                    onChange={(e: any) => setTestDataType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ByteString">ByteString (Buffer)</option>
                    <option value="ByteArray">Byte[] (Array)</option>
                    <option value="Int16">Int16 (Short)</option>
                    <option value="Int32">Int32 (Long)</option>
                    <option value="Boolean">Boolean (Bit)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Hex Payload:</label>
                  <input
                    type="text"
                    value={testHexPayload}
                    onChange={(e) => setTestHexPayload(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-amber-300 font-mono focus:border-blue-500 focus:outline-none"
                    placeholder="001100000000"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={handleCustomWrite}
                  disabled={testingWrite}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition"
                >
                  <Send className="w-4 h-4" />
                  {testingWrite ? 'Sende...' : 'Wert schreiben (Write)'}
                </button>

                <button
                  onClick={handleCustomRead}
                  disabled={testingRead}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition"
                >
                  <Search className="w-4 h-4 text-emerald-400" />
                  {testingRead ? 'Lese...' : 'Wert lesen (Read)'}
                </button>
              </div>

            </div>

            {/* Right: Response Output */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-emerald-400" /> OPC UA Server Antwort & Status
                </h3>

                {testResult ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div className={`p-3 rounded-lg border flex items-center justify-between ${
                      testResult.success 
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' 
                        : 'bg-red-950/60 text-red-300 border-red-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        {testResult.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        <span className="font-bold">{testResult.statusCode || (testResult.success ? 'Good (0x00000000)' : 'Failed')}</span>
                      </div>
                      <span>{testResult.nodeId}</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                      <div className="text-slate-400">Gesendete Rohdaten: <strong className="text-amber-400">{testResult.hexWritten || '-'}</strong></div>
                      {testResult.rawHex && <div className="text-slate-400">Gelesener Hex-Wert: <strong className="text-emerald-400">{testResult.rawHex}</strong></div>}
                      {testResult.value !== undefined && <div className="text-slate-400">Decodierter Wert: <strong className="text-white">{JSON.stringify(testResult.value)}</strong></div>}
                      {testResult.message && <div className="text-slate-400">Meldung: <strong className="text-slate-300">{testResult.message}</strong></div>}
                      {testResult.error && <div className="text-red-400">Fehler-Trace: {testResult.error}</div>}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
                    <Terminal className="w-10 h-10 mb-2 stroke-1" />
                    <span>Klicken Sie auf "Schreiben" oder "Lesen", um die OPC UA Antwort zu sehen.</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 font-mono border-t border-slate-800 pt-2">
                Format-Tipp: Halstrup Motor erwartet 6 Bytes (z.B. <code>001100000000</code>).
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: RAW MARKDOWN AI REPORT */}
        {activeTab === 'report' && report && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Copy className="w-4 h-4 text-emerald-400" /> Vollständiger AI-Diagnosebericht (Markdown)
                </h3>
                <p className="text-xs text-slate-400">
                  Diesen Bericht können Sie mit einem Klick kopieren und direkt im Chat mit der AI teilen.
                </p>
              </div>

              <button
                onClick={copyAiReport}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border cursor-pointer active:scale-98 transition shadow-lg ${
                  copied
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border-emerald-500/50'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Kopiert!' : 'Bericht kopieren'}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[500px]">
              {report.aiSummaryReport}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
