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
  Square
} from 'lucide-react';
import { MasterDiagnosticReport, ChannelPortScanInfo, SecurityStrategyResult, MasterSystemInfo } from '../types';

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
  
  // Custom Tester State
  const [testNodeId, setTestNodeId] = useState('ns=7;i=640');
  const [testDataType, setTestDataType] = useState<'ByteString' | 'ByteArray' | 'Int16' | 'Int32' | 'Boolean'>('ByteString');
  const [testHexPayload, setTestHexPayload] = useState('001100000000');
  const [testResult, setTestResult] = useState<any>(null);
  const [testingWrite, setTestingWrite] = useState(false);
  const [testingRead, setTestingRead] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ports' | 'strategies' | 'tester' | 'report'>('overview');

  useEffect(() => {
    runScan();
  }, []);

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
      <div className="flex bg-slate-950 px-4 pt-3 border-b border-slate-800 gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> 1. Master & System
        </button>
        <button
          onClick={() => setActiveTab('ports')}
          className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'ports'
              ? 'border-blue-500 text-blue-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" /> 2. Kanäle X0–X7 ({report?.ports.length || 8})
        </button>
        <button
          onClick={() => setActiveTab('strategies')}
          className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'strategies'
              ? 'border-blue-500 text-blue-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> 3. Verbindungs-Matrix
        </button>
        <button
          onClick={() => setActiveTab('tester')}
          className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'tester'
              ? 'border-blue-500 text-blue-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" /> 4. Manuelles Test-Terminal
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'report'
              ? 'border-blue-500 text-blue-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Copy className="w-4 h-4 text-emerald-400" /> 5. AI-Prüfbericht (Volltext)
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto min-h-0">
        
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
                    onClick={() => applyPreset('ns=7;i=646', 'ByteString', '05')}
                    className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-left text-xs font-mono cursor-pointer"
                  >
                    <div className="font-bold text-indigo-400">LED: Blau (Bereit)</div>
                    <div className="text-[10px] text-slate-500">ns=7;i=646 | 0x05</div>
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
