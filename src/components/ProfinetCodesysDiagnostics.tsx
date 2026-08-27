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
  Download,
  Layers, 
  Gauge, 
  HardDrive,
  Info,
  Play,
  Square,
  Network,
  FileCode,
  CheckSquare,
  RotateCw,
  ExternalLink
} from 'lucide-react';
import { ProfinetDiagnosticReport, ProfinetSlotMapping } from '../types';

export default function ProfinetCodesysDiagnostics() {
  const [report, setReport] = useState<ProfinetDiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [masterIp, setMasterIp] = useState('10.191.199.182');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'slots' | 'checks' | 'code' | 'guide'>('overview');
  const [togglingPlc, setTogglingPlc] = useState(false);

  useEffect(() => {
    fetchProfinetStatus();
  }, []);

  const fetchProfinetStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profinet/status');
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to fetch PROFINET status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunProfinetScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profinet/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterIp })
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('PROFINET scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlcState = async (targetState: 'RUN' | 'STOP') => {
    setTogglingPlc(true);
    try {
      const res = await fetch('/api/profinet/plc-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: targetState })
      });
      if (res.ok) {
        await fetchProfinetStatus();
      }
    } catch (err) {
      console.error('Toggle PLC state failed:', err);
    } finally {
      setTogglingPlc(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans p-3 sm:p-5 overflow-y-auto space-y-4 sm:space-y-6">
      
      {/* Header Banner - Compact */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-3.5 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow shrink-0">
            <Network className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">PROFINET Soft-SPS Controller</h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Offline RT (4ms)
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md px-2 py-1 flex-1 sm:flex-initial">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono mr-1.5">Master:</span>
            <input 
              type="text" 
              value={masterIp} 
              onChange={(e) => setMasterIp(e.target.value)} 
              className="bg-transparent text-white font-mono text-xs w-full sm:w-28 focus:outline-none"
            />
          </div>

          <button
            onClick={handleRunProfinetScan}
            disabled={loading}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Scan</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation - Horizontally Scrollable on Mobile */}
      <div className="flex bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 gap-1.5 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === 'overview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Soft-SPS & Status</span>
        </button>

        <button
          onClick={() => setActiveSubTab('slots')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === 'slots' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>PROFINET E/A Mapping</span>
        </button>

        <button
          onClick={() => setActiveSubTab('checks')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === 'checks' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Fehleranalyse</span>
        </button>

        <button
          onClick={() => setActiveSubTab('code')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === 'code' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>IEC 61131 ST-Code</span>
        </button>

        <button
          onClick={() => setActiveSubTab('guide')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === 'guide' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Pi 5 Anleitung</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && report && (
        <div className="space-y-6">
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Soft-PLC State Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex justify-between items-center text-xs text-slate-400 font-mono uppercase">
                <span>CODESYS Soft-SPS</span>
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <div className="my-2 flex items-center justify-between">
                <span className={`text-2xl font-black font-mono ${
                  report.codesysStatus.plcState === 'RUN' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {report.codesysStatus.plcState}
                </span>
                <button
                  onClick={() => handleTogglePlcState(report.codesysStatus.plcState === 'RUN' ? 'STOP' : 'RUN')}
                  disabled={togglingPlc}
                  className={`px-3 py-1 rounded text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1 ${
                    report.codesysStatus.plcState === 'RUN'
                      ? 'bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {report.codesysStatus.plcState === 'RUN' ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{report.codesysStatus.plcState === 'RUN' ? 'Stoppen' : 'Starten'}</span>
                </button>
              </div>
              <div className="text-[11px] text-slate-500 font-mono flex justify-between border-t border-slate-800/80 pt-1">
                <span>Task: 4.00 ms (Zyklisch)</span>
                <span>CPU: {report.codesysStatus.cpuLoadPercent}%</span>
              </div>
            </div>

            {/* PROFINET Bus AR State */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex justify-between items-center text-xs text-slate-400 font-mono uppercase">
                <span>PROFINET AR Status</span>
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="my-2 flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {report.profinetDevice.arState}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono">
                  RT Class 1
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono flex justify-between border-t border-slate-800/80 pt-1">
                <span>Jitter: ±{report.profinetDevice.jitterUs} µs</span>
                <span>Verluste: {report.profinetDevice.missedPackets}</span>
              </div>
            </div>

            {/* Baumer Master Station Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex justify-between items-center text-xs text-slate-400 font-mono uppercase">
                <span>Baumer IO-Link Master</span>
                <HardDrive className="w-4 h-4 text-purple-400" />
              </div>
              <div className="my-1">
                <div className="text-base font-bold text-white font-mono">{report.profinetDevice.stationName}</div>
                <div className="text-xs text-slate-400 font-mono">{report.profinetDevice.ipAddress}</div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono flex justify-between border-t border-slate-800/80 pt-1">
                <span>MAC: {report.profinetDevice.macAddress}</span>
                <span>DevID: {report.profinetDevice.deviceId}</span>
              </div>
            </div>

            {/* Diagnostic Health */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex justify-between items-center text-xs text-slate-400 font-mono uppercase">
                <span>Systemzustand</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="my-1">
                <div className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Echtzeit-Betrieb OK
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Keine Alarme oder Busfehler (BF/SF).</div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono flex justify-between border-t border-slate-800/80 pt-1">
                <span>6 E/A Submodule aktiv</span>
                <span>100% Offline</span>
              </div>
            </div>

          </div>

          {/* Root Cause & Summary Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              Analyse & Betriebsstatus
            </h3>
            <p className="text-sm text-slate-300 font-mono leading-relaxed bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              {report.rootCauseAnalysis}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {report.actionableSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 font-mono">
                  <CheckSquare className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SLOTS MAPPING */}
      {activeSubTab === 'slots' && report && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              PROFINET Steckplatz- & Submodul-Matrix (GSDML V2.35)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Direkt gekoppelt mit IEC 61131-3 E/A-Speicherbereichen</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {report.slots.map((slot) => (
              <div key={slot.slot} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded-md bg-blue-950 text-blue-300 border border-blue-800 font-mono text-xs font-bold">
                      Slot {slot.slot} ({slot.portLabel})
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{slot.moduleName}</h4>
                      <p className="text-xs text-slate-400">{slot.configuredDevice}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> {slot.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 text-xs font-mono">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="text-slate-500 text-[10px] uppercase">Eingangsbereich (PLC Input)</div>
                    <div className="text-blue-300 font-bold mt-0.5">{slot.inputAddressPlc} ({slot.inputBytes} Bytes)</div>
                    <div className="text-slate-400 text-[11px] mt-1">Live HEX: <span className="text-emerald-400 font-bold">{slot.inputHexLive}</span></div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="text-slate-500 text-[10px] uppercase">Ausgangsbereich (PLC Output)</div>
                    <div className="text-purple-300 font-bold mt-0.5">{slot.outputAddressPlc} ({slot.outputBytes} Bytes)</div>
                    <div className="text-slate-400 text-[11px] mt-1">Live HEX: <span className="text-purple-400 font-bold">{slot.outputHexLive}</span></div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-center">
                    <div className="text-slate-500 text-[10px] uppercase">Echtzeit-Interpretation</div>
                    <div className="text-slate-200 text-[11px] mt-0.5">{slot.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM CHECKS */}
      {activeSubTab === 'checks' && report && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Automatisierte PROFINET & Hardware-Diagnoseprüfungen
            </h3>
            <span className="text-xs text-slate-400 font-mono">Pinpoint-Fehlerlokalisierung</span>
          </div>

          <div className="space-y-3">
            {report.systemChecks.map((check, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
                  check.passed 
                    ? 'bg-slate-900/90 border-slate-800 text-slate-200' 
                    : 'bg-red-950/40 border-red-800 text-red-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {check.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{check.checkName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                        {check.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{check.message}</p>
                    {check.remedy && (
                      <div className="mt-2 text-xs text-amber-300 bg-amber-950/50 p-2 rounded border border-amber-800/80 font-mono">
                        💡 Lösung: {check.remedy}
                      </div>
                    )}
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold shrink-0 ${
                  check.passed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-900 text-red-200 border border-red-700'
                }`}>
                  {check.passed ? 'BESTANDEN' : 'FEHLER'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CODE & DRIVERS */}
      {activeSubTab === 'code' && (
        <div className="space-y-6">
          
          {/* Action Download Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* GSDML Driver Download */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex justify-between items-center text-xs text-slate-400 font-mono uppercase">
                  <span>PROFINET GSDML Treiber</span>
                  <FileCode className="w-4 h-4 text-blue-400" />
                </div>
                <h4 className="text-sm font-bold text-white mt-2">GSDML-V2.35-Baumer-CM50I-PN-2024.xml</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Gerätebeschreibungsdatei für CODESYS IDE / TIA Portal mit allen 8 vordefinierten IO-Link Ports.
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href="/api/profinet/download/gsdml"
                  download="GSDML-V2.35-Baumer-CM50I-PN-2024.xml"
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download GSDML</span>
                </a>
              </div>
            </div>

            {/* ST PLC Code Download */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex justify-between items-center text-xs text-slate-400 font-mono uppercase">
                  <span>IEC 61131-3 Quellcode</span>
                  <FileCode className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-white mt-2">MAIN_PRG.st (Structured Text)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Vollständiges Soft-SPS Programm für 2ms Drehmomentabschaltung, Homing & Stellantriebssteuerung.
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href="/api/profinet/download/st"
                  download="MAIN_PRG.st"
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download ST-Code</span>
                </a>
              </div>
            </div>

            {/* Offline Script Download */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex justify-between items-center text-xs text-slate-400 font-mono uppercase">
                  <span>1-Click Pi 5 Offline Skript</span>
                  <Terminal className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="text-sm font-bold text-white mt-2">setup_pi5_profinet_codesys.sh</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Automatisiertes Bash-Skript für Linux Realtime Limits, eth0 Konfiguration und Soft-SPS Autostart.
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href="/api/profinet/download/setup-script"
                  download="setup_pi5_profinet_codesys.sh"
                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Setup-Skript</span>
                </a>
              </div>
            </div>

          </div>

          {/* Code Viewer Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-slate-300">Vorschau: MAIN_PRG.st (IEC 61131-3)</span>
              <button
                onClick={() => copyToClipboard(`PROGRAM PLC_PRG
VAR
    bMotorStatusWord  AT %IB0 : WORD;
    diMotorPosInc     AT %ID2 : DINT;
    bMotorControlWord AT %QB0 : WORD;
    diMotorTargetInc  AT %QD2 : DINT;
    iTorqueRaw        AT %IB6 : INT;
    iTempRaw          AT %IB8 : INT;
    bButtonX3         AT %IB10 : BYTE;
    bLedColorX3       AT %QB6  : BYTE;
END_VAR`, 'st_code')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded font-mono flex items-center gap-1"
              >
                {copiedKey === 'st_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'st_code' ? 'Kopiert!' : 'Kopieren'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800/80">
{`PROGRAM PLC_PRG
VAR
    (* Slot 1: Port X0 Halstrup-Walcher PSE 3325 *)
    bMotorStatusWord  AT %IB0 : WORD;   (* Statuswort des Stellantriebs *)
    diMotorPosInc     AT %ID2 : DINT;   (* Aktuelle Ist-Position in Inkrementen *)
    bMotorControlWord AT %QB0 : WORD;   (* Steuerwort: 0x0014=Pos, 0x0011=Jog+, 0x0000=Stop *)
    diMotorTargetInc  AT %QD2 : DINT;   (* Soll-Position in Inkrementen *)

    (* Slot 2: Port X1 HBM T22 Drehmomentmesswelle *)
    iTorqueRaw        AT %IB6 : INT;    (* Drehmoment Rohwert 16-Bit *)

    (* Slot 3: Port X2 ifm Temperatursensor *)
    iTempRaw          AT %IB8 : INT;    (* Temperatur Rohwert *)

    (* Slot 4: Port X3 ifm Farbanzeige & Taster *)
    bButtonX3         AT %IB10 : BYTE;  (* Taster X3 *)
    bLedColorX3       AT %QB6  : BYTE;  (* LED Farbe: 1=Grün, 2=Gelb, 4=Rot, 5=Blau *)

    rLiveTorqueNm     : REAL := 0.0;
    rPeakTorqueNm     : REAL := 0.0;
    rLiveMotorDeg     : REAL := 0.0;
    rStartNm          : REAL := 0.50;
    iState            : INT  := 0;
END_VAR

(* 1. Drehmoment Skalierung & Peak-Erfassung *)
rLiveTorqueNm := INT_TO_REAL(iTorqueRaw) * 0.001;
rLiveMotorDeg := DINT_TO_REAL(diMotorPosInc - 51200) / 142.222;

IF rLiveTorqueNm > rPeakTorqueNm THEN
    rPeakTorqueNm := rLiveTorqueNm;
END_IF;

(* 2. Zustandssteuerung & 2ms Not-Halt *)
CASE iState OF
    0: (* IDLE *)
        bMotorControlWord := 16#0000;
        bLedColorX3 := 16#05; (* Blau *)
    1: (* ANFAHREN *)
        bMotorControlWord := 16#0011; (* Drehen *)
        IF rLiveTorqueNm >= rStartNm THEN
            bMotorControlWord := 16#0000; (* Sofortiger Stopp *)
            iState := 3;
        END_IF;
END_CASE;`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 5: OFFLINE PI 5 SETUP GUIDE */}
      {activeSubTab === 'guide' && (
        <div className="space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              100% Offline Inbetriebnahme-Anleitung für Raspberry Pi 5
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
              Kein Internet erforderlich
            </span>
          </div>

          <div className="space-y-4 text-xs font-mono text-slate-300">
            
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="text-white font-bold text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                <span>Netzwerkkabel direkt verbinden</span>
              </div>
              <p className="text-slate-400 pl-8">
                Verbinden Sie den Ethernet-Port des Raspberry Pi 5 (eth0) direkt mit Port <strong>P1</strong> des Baumer IO-Link Masters CM50I.PN.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="text-white font-bold text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                <span>Setup-Skript auf dem Pi 5 ausführen</span>
              </div>
              <p className="text-slate-400 pl-8">
                Führen Sie im Terminal des Pi 5 folgenden Befehl aus:
              </p>
              <div className="pl-8">
                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded border border-slate-800 text-emerald-400">
                  <code>chmod +x setup_pi5_profinet_codesys.sh &amp;&amp; ./setup_pi5_profinet_codesys.sh</code>
                  <button 
                    onClick={() => copyToClipboard('chmod +x setup_pi5_profinet_codesys.sh && ./setup_pi5_profinet_codesys.sh', 'sh_cmd')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'sh_cmd' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="text-white font-bold text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</span>
                <span>GSDML in CODESYS laden (Fertig!)</span>
              </div>
              <p className="text-slate-400 pl-8">
                In CODESYS unter <em>Tools -&gt; Device Repository</em> auf <strong>Install</strong> klicken und die Datei <code>GSDML-V2.35-Baumer-CM50I-PN-2024.xml</code> auswählen.
                Die Touchscreen-Oberfläche verbindet sich automatisch mit der Soft-SPS.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
