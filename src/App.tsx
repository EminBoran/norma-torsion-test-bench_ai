import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Play, 
  Square, 
  Home, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  Activity, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  FileText, 
  Target, 
  Zap,
  Save,
  Trash2,
  RefreshCw,
  Settings,
  Cpu
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import ServiceDiagnostics from './components/ServiceDiagnostics';

interface TestBenchStatus {
  connected: boolean;
  state: number;
  statusInfo: string;
  liveTorque: number;
  peakTorque: number;
  motorPositionDeg: number;
  motorPositionInc: number;
  breakPosDeg: number;
  ledColor: number;
  settings: {
    start_nm: number;
    pause_ms: number;
    drop_val_pct: number;
    overrun_deg: number;
    standstill_s: number;
    max_time_s: number;
    start_tolerance_deg: number;
    home_pos: number;
    home_tol_inc: number;
    tester_name: string;
    article_id: string;
    serial_number: string;
    torque_offset: number;
  };
  liveCurve?: { rel_ms: number; deg: number; nm: number; state: number }[];
}

interface TestRecord {
  id: string;
  timestamp: string;
  articleId: string;
  serialNumber: string;
  testerId: string;
  result: string;
  maxTorque: number;
  duration: number;
  torqueData: any;
  testParams: any;
}

export default function App() {
  const [status, setStatus] = useState<TestBenchStatus>({
    connected: false,
    state: 0,
    statusInfo: 'Verbinde mit Prüfstand...',
    liveTorque: 0.0,
    peakTorque: 0.0,
    motorPositionDeg: 0.0,
    motorPositionInc: 51200,
    breakPosDeg: 0.0,
    ledColor: 0x05,
    settings: {
      start_nm: 0.5,
      pause_ms: 1000,
      drop_val_pct: 5.0,
      overrun_deg: 15.0,
      standstill_s: 5.0,
      max_time_s: 60.0,
      start_tolerance_deg: 2.0,
      home_pos: 51200,
      home_tol_inc: 2,
      tester_name: "Pruefer",
      article_id: "NORM-TORQUE-01",
      serial_number: "SN-1001",
      torque_offset: 0.0
    }
  });

  const [activeTab, setActiveTab] = useState<'control' | 'curve' | 'records' | 'settings' | 'diagnostics'>('control');
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<TestRecord | null>(null);
  const [tempSettings, setTempSettings] = useState<any>(status.settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Initialize WebSockets and fetch records
  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('status_update', (data: TestBenchStatus) => {
      setStatus(data);
    });

    fetchRecords();

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    setTempSettings(status.settings);
  }, [status.settings]);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/records');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (e) {
      console.error('Failed to load records:', e);
    }
  };

  const sendCommand = async (action: string, extra: any = {}) => {
    try {
      const res = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra })
      });
      const data = await res.json();
      if (data.message) {
        setFeedbackMsg({ type: data.success ? 'ok' : 'err', text: data.message });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
      if (action === 'stop' || action === 'reset') {
        fetchRecords();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'err', text: 'Fehler beim Senden des Befehls: ' + err.message });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempSettings)
      });
      if (res.ok) {
        setFeedbackMsg({ type: 'ok', text: 'Einstellungen erfolgreich im Prüfstand gespeichert!' });
      }
    } catch (e: any) {
      setFeedbackMsg({ type: 'err', text: 'Fehler beim Speichern: ' + e.message });
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // State Name & Color styling
  const getStateBadge = () => {
    switch (status.state) {
      case 0:
        return { label: 'BEREIT (IDLE)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 1:
        return { label: 'PHASE 1: ANFAHREN', color: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' };
      case 2:
        return { label: 'PHASE 2: PAUSE', color: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 3:
        return { label: 'PHASE 3: PRÜFFAHRT', color: 'bg-red-100 text-red-900 border-red-300 animate-pulse' };
      case 4:
        return { label: 'PHASE 4: NACHLAUF', color: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 5:
        return { label: 'PHASE 5: STANDSTILL', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
      case 10:
        return { label: 'HOMING (0.0°)', color: 'bg-yellow-100 text-yellow-900 border-yellow-300 animate-pulse' };
      default:
        return { label: 'UNBEKANNT', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  const stateBadge = getStateBadge();
  const isNearHome = Math.abs(status.motorPositionDeg) <= status.settings.start_tolerance_deg;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans select-none overflow-hidden">
      
      {/* Top Industrial Header Bar */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-base shadow-md">
            NT
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              NORMA TORSIONSPRÜFSTAND
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-normal">v3.2 Edge</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">OPC-UA Direct Engine | Port X0 Motor & Port X1 Sensor</p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${stateBadge.color}`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            {stateBadge.label}
          </div>

          <div className="flex items-center space-x-2 px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${status.connected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-red-500 animate-pulse'}`}></span>
            <span className={status.connected ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
              {status.connected ? 'OPC-UA ONLINE' : 'OPC-UA OFFLINE'}
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 space-x-1 items-center">
            <button
              onClick={() => setActiveTab('control')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'control' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Steuerung
            </button>
            <button
              onClick={() => setActiveTab('curve')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'curve' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Prüfkurve
            </button>
            <button
              onClick={() => { setActiveTab('records'); fetchRecords(); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'records' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Messprotokolle ({records.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Parameter
            </button>

            {/* Gear Icon - Service Diagnose Page */}
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'diagnostics' 
                  ? 'bg-amber-600 text-white shadow-lg border border-amber-400' 
                  : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-500/40'
              }`}
              title="Baumer IO-Link Master Service & Diagnose (X0-X7)"
            >
              <Settings className={`w-3.5 h-3.5 text-amber-400 ${activeTab === 'diagnostics' ? 'animate-spin-slow' : ''}`} />
              <span>Service Diagnose</span>
            </button>
          </div>
        </div>
      </header>

      {/* User Feedback Alert Toast */}
      {feedbackMsg && (
        <div className={`px-4 py-2.5 text-sm font-semibold flex items-center justify-between transition-all ${feedbackMsg.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          <div className="flex items-center space-x-2">
            {feedbackMsg.type === 'ok' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-white hover:text-slate-200 text-xs px-2 py-1 bg-black/20 rounded">Schließen</button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 p-5 overflow-hidden flex flex-col gap-4">
        
        {/* TOP REAL-TIME LIVE VALUES DISPLAY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          
          {/* Drehmoment Live */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-center text-slate-400 text-xs font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-emerald-400" /> Drehmoment Live</span>
              <button 
                onClick={() => sendCommand('tare')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition cursor-pointer font-mono"
                title="Aktuellen Wert als 0 Nm nullen"
              >
                Tara (0)
              </button>
            </div>
            <div className="my-2 flex items-baseline justify-between">
              <span className={`text-4xl lg:text-5xl font-black font-mono tracking-tight ${Math.abs(status.liveTorque) > 0.05 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {status.liveTorque.toFixed(3)}
              </span>
              <span className="text-xl font-bold text-slate-500 font-mono">Nm</span>
            </div>
            <div className="text-xs text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-800/60">
              <span>HBM T22 Sensor (Port X1)</span>
              <span>Offset: {status.settings.torque_offset.toFixed(2)} Nm</span>
            </div>
          </div>

          {/* Peak / Max Drehmoment */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-center text-slate-400 text-xs font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Target className="w-4 h-4 text-amber-400" /> Peak / Max Drehmoment</span>
              <span className="text-amber-400/80 text-xs font-mono">Prüfspitze</span>
            </div>
            <div className="my-2 flex items-baseline justify-between">
              <span className="text-4xl lg:text-5xl font-black font-mono tracking-tight text-amber-400">
                {status.peakTorque.toFixed(3)}
              </span>
              <span className="text-xl font-bold text-slate-500 font-mono">Nm</span>
            </div>
            <div className="text-xs text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-800/60">
              <span>Start-Schwelle: {status.settings.start_nm} Nm</span>
              <span>Abfall: {status.settings.drop_val_pct}%</span>
            </div>
          </div>

          {/* Motor Position / Winkel */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-center text-slate-400 text-xs font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Compass className="w-4 h-4 text-blue-400" /> Motor Ist-Position</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isNearHome ? 'bg-emerald-950 text-emerald-400' : 'bg-yellow-950 text-yellow-400'}`}>
                {isNearHome ? '0° HOME' : 'AUSGELENKT'}
              </span>
            </div>
            <div className="my-2 flex items-baseline justify-between">
              <span className="text-4xl lg:text-5xl font-black font-mono tracking-tight text-blue-400">
                {status.motorPositionDeg.toFixed(1)}
              </span>
              <span className="text-xl font-bold text-slate-500 font-mono">° Grad</span>
            </div>
            <div className="text-xs text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-800/60">
              <span>Inkremente: {status.motorPositionInc}</span>
              <span>Home: {status.settings.home_pos}</span>
            </div>
          </div>

          {/* Bruch-Winkel / Break Pos */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-center text-slate-400 text-xs font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-purple-400" /> Bruch-Winkel (Break)</span>
              <span className="text-purple-400/80 text-xs font-mono">Endposition</span>
            </div>
            <div className="my-2 flex items-baseline justify-between">
              <span className="text-4xl lg:text-5xl font-black font-mono tracking-tight text-purple-400">
                {status.breakPosDeg.toFixed(1)}
              </span>
              <span className="text-xl font-bold text-slate-500 font-mono">° Grad</span>
            </div>
            <div className="text-xs text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-800/60">
              <span>Nachlauf: {status.settings.overrun_deg}°</span>
              <span>Status: {status.state >= 4 ? 'Erkannt' : 'Wartet'}</span>
            </div>
          </div>

        </div>

        {/* MAIN INTERACTIVE CONTENT AREA */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-5 overflow-y-auto shadow-xl flex flex-col">
          
          {/* TAB 1: STEUERUNG (Main Control Pad) */}
          {activeTab === 'control' && (
            <div className="flex-1 flex flex-col justify-between gap-6">
              
              {/* Status Message Display */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${status.state > 0 ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></div>
                  <span className="text-base font-semibold text-slate-200 font-mono">
                    {status.statusInfo}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Prüfkörper: <strong className="text-slate-300">{status.settings.article_id}</strong> | SN: <strong className="text-slate-300">{status.settings.serial_number}</strong>
                </div>
              </div>

              {/* BIG TOUCH CONTROLS (Direct Node-RED Actions) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                
                {/* 1. AUTO START BUTTON */}
                <button
                  onClick={() => sendCommand('start')}
                  disabled={status.state !== 0}
                  className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all cursor-pointer shadow-xl ${
                    status.state === 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 active:scale-98'
                      : 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-16 h-16 mb-3 fill-current" />
                  <span className="text-2xl font-black tracking-wide">AUTO START</span>
                  <span className="text-xs opacity-80 mt-1 font-mono">
                    {isNearHome ? 'Startbereit bei 0.0°' : 'Achtung: Nicht bei 0.0°'}
                  </span>
                </button>

                {/* 2. EMERGENCY STOP BUTTON */}
                <button
                  onClick={() => sendCommand('stop')}
                  className="flex flex-col items-center justify-center p-8 rounded-2xl bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 transition-all active:scale-98 cursor-pointer shadow-xl"
                >
                  <Square className="w-16 h-16 mb-3 fill-current" />
                  <span className="text-2xl font-black tracking-wide">NOT-HALT</span>
                  <span className="text-xs text-red-100 mt-1 font-mono">Sofortiger Motor-Stopp</span>
                </button>

                {/* 3. GO HOME BUTTON */}
                <button
                  onClick={() => sendCommand('go_home')}
                  disabled={status.state !== 0}
                  className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all cursor-pointer shadow-xl ${
                    status.state === 0
                      ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 active:scale-98'
                      : 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <Home className="w-16 h-16 mb-3" />
                  <span className="text-2xl font-black tracking-wide">GO HOME (0°)</span>
                  <span className="text-xs opacity-80 mt-1 font-mono">Auf Nullposition {status.settings.home_pos} Inc</span>
                </button>

              </div>

              {/* MANUAL JOG & RESET ROW */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <button
                  onMouseDown={() => sendCommand('jog', { dir: 'left' })}
                  onMouseUp={() => sendCommand('jog', { dir: 'stop' })}
                  onTouchStart={() => sendCommand('jog', { dir: 'left' })}
                  onTouchEnd={() => sendCommand('jog', { dir: 'stop' })}
                  disabled={status.state !== 0}
                  className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 flex items-center justify-center gap-2 font-bold cursor-pointer active:bg-blue-600 active:text-white transition"
                >
                  <ChevronLeft className="w-6 h-6" /> JOG LINKS
                </button>

                <button
                  onMouseDown={() => sendCommand('jog', { dir: 'right' })}
                  onMouseUp={() => sendCommand('jog', { dir: 'stop' })}
                  onTouchStart={() => sendCommand('jog', { dir: 'right' })}
                  onTouchEnd={() => sendCommand('jog', { dir: 'stop' })}
                  disabled={status.state !== 0}
                  className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 flex items-center justify-center gap-2 font-bold cursor-pointer active:bg-blue-600 active:text-white transition"
                >
                  JOG RECHTS <ChevronRight className="w-6 h-6" />
                </button>

                <button
                  onClick={() => sendCommand('reset')}
                  className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 flex items-center justify-center gap-2 font-bold cursor-pointer transition"
                >
                  <RotateCcw className="w-5 h-5 text-blue-400" /> STATUS RESET
                </button>

                <button
                  onClick={() => sendCommand('tare')}
                  className="p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 flex items-center justify-center gap-2 font-bold cursor-pointer transition"
                >
                  <RefreshCw className="w-5 h-5 text-emerald-400" /> TARA DREHMOMENT
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: LIVE PRÜFKURVE (Live Recharts Graph) */}
          {activeTab === 'curve' && (
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" /> Echtzeit Drehmoment-Kurve
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Punkte im Speicher: {status.liveCurve?.length || 0}
                </span>
              </div>

              <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 min-h-[300px]">
                {status.liveCurve && status.liveCurve.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={status.liveCurve} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="deg" 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        unit="°" 
                        label={{ value: 'Winkel (°)', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }} 
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        unit=" Nm" 
                        label={{ value: 'Drehmoment (Nm)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                        formatter={(val: any) => [`${Number(val).toFixed(3)} Nm`, 'Drehmoment']}
                        labelFormatter={(deg: any) => `Winkel: ${deg}°`}
                      />
                      {status.peakTorque > 0 && (
                        <ReferenceLine y={status.peakTorque} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Peak: ${status.peakTorque.toFixed(2)} Nm`, fill: '#f59e0b', fontSize: 11 }} />
                      )}
                      <Line 
                        type="monotone" 
                        dataKey="nm" 
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        dot={false} 
                        isAnimationActive={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono">
                    <Activity className="w-12 h-12 mb-2 stroke-1" />
                    <span>Keine aktiven Kurvendaten. Starten Sie eine Prüfung!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MESSPROTOKOLLE & DATENBANK */}
          {activeTab === 'records' && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" /> Gespeicherte Prüfberichte (SQLite)
                </h3>
                <button 
                  onClick={fetchRecords} 
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Aktualisieren
                </button>
              </div>

              {/* Table */}
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                <div className="overflow-y-auto max-h-[400px]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Zeitstempel</th>
                        <th className="p-3">Artikel-ID</th>
                        <th className="p-3">Seriennummer</th>
                        <th className="p-3">Prüfer</th>
                        <th className="p-3">Max Drehmoment</th>
                        <th className="p-3">Dauer</th>
                        <th className="p-3">Ergebnis</th>
                        <th className="p-3">Aktion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/50">
                          <td className="p-3">{new Date(r.timestamp).toLocaleString()}</td>
                          <td className="p-3 font-bold text-blue-400">{r.articleId}</td>
                          <td className="p-3">{r.serialNumber}</td>
                          <td className="p-3 text-slate-400">{r.testerId}</td>
                          <td className="p-3 font-bold text-emerald-400">{Number(r.maxTorque).toFixed(3)} Nm</td>
                          <td className="p-3">{Number(r.duration).toFixed(1)} s</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${r.result === 'PASSED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                              {r.result}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => setSelectedRecord(r)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                      {records.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            Noch keine Prüfberichte in der Datenbank vorhanden.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Record Detail Modal */}
              {selectedRecord && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                  <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <h4 className="text-lg font-bold text-white">Prüfbericht Details ({selectedRecord.id})</h4>
                      <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div><span className="text-slate-500">Zeitstempel:</span> {new Date(selectedRecord.timestamp).toLocaleString()}</div>
                      <div><span className="text-slate-500">Ergebnis:</span> <strong className="text-emerald-400">{selectedRecord.result}</strong></div>
                      <div><span className="text-slate-500">Artikel-ID:</span> {selectedRecord.articleId}</div>
                      <div><span className="text-slate-500">Serien-Nr.:</span> {selectedRecord.serialNumber}</div>
                      <div><span className="text-slate-500">Max. Drehmoment:</span> <strong className="text-amber-400">{Number(selectedRecord.maxTorque).toFixed(3)} Nm</strong></div>
                      <div><span className="text-slate-500">Prüfdauer:</span> {Number(selectedRecord.duration).toFixed(1)} s</div>
                    </div>

                    <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                      <button 
                        onClick={() => window.print()} 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Bericht drucken / PDF
                      </button>
                      <button 
                        onClick={() => setSelectedRecord(null)} 
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Schließen
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PRÜFPARAMETER & EINSTELLUNGEN */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="flex-1 flex flex-col justify-between gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                
                {/* Start-Drehmoment */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Start-Drehmoment (Phase 1)</span>
                    <span className="text-emerald-400 font-mono">{tempSettings.start_nm} Nm</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempSettings.start_nm}
                    onChange={(e) => setTempSettings({ ...tempSettings, start_nm: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-white font-mono"
                  />
                  <p className="text-[11px] text-slate-500">Schwelle, ab der die Pause/Prüfung startet.</p>
                </div>

                {/* Pause Dauer */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Beruhigungszeit (Phase 2)</span>
                    <span className="text-blue-400 font-mono">{tempSettings.pause_ms} ms</span>
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={tempSettings.pause_ms}
                    onChange={(e) => setTempSettings({ ...tempSettings, pause_ms: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-white font-mono"
                  />
                  <p className="text-[11px] text-slate-500">Pausenzeit nach Erreichen des Start-Drehmoments.</p>
                </div>

                {/* Bruch-Abfall % */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Bruch-Erkennung (Drop %)</span>
                    <span className="text-amber-400 font-mono">{tempSettings.drop_val_pct} %</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={tempSettings.drop_val_pct}
                    onChange={(e) => setTempSettings({ ...tempSettings, drop_val_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-white font-mono"
                  />
                  <p className="text-[11px] text-slate-500">Prozentualer Abfall vom Peak für Brucherkennung.</p>
                </div>

                {/* Nachlaufwinkel */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Nachlaufwinkel (Phase 4)</span>
                    <span className="text-purple-400 font-mono">{tempSettings.overrun_deg} °</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={tempSettings.overrun_deg}
                    onChange={(e) => setTempSettings({ ...tempSettings, overrun_deg: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-white font-mono"
                  />
                  <p className="text-[11px] text-slate-500">Weiterer Drehwinkel nach Brucherkennung.</p>
                </div>

                {/* Home Position Inkremente */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Home-Position (Inkremente)</span>
                    <span className="text-slate-400 font-mono">{tempSettings.home_pos} Inc</span>
                  </label>
                  <input
                    type="number"
                    value={tempSettings.home_pos}
                    onChange={(e) => setTempSettings({ ...tempSettings, home_pos: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-white font-mono"
                  />
                  <p className="text-[11px] text-slate-500">Nullpunkt-Inkremente (Standard: 51200).</p>
                </div>

                {/* Artikel ID & Seriennummer */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                  <label className="text-xs font-bold text-slate-300">Artikel-ID & Prüfer</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Artikel ID"
                      value={tempSettings.article_id}
                      onChange={(e) => setTempSettings({ ...tempSettings, article_id: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded-md p-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Prüfer Name"
                      value={tempSettings.tester_name}
                      onChange={(e) => setTempSettings({ ...tempSettings, tester_name: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded-md p-2 text-xs text-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">Wird im Messbericht gespeichert.</p>
                </div>

              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-lg active:scale-98 transition"
                >
                  <Save className="w-5 h-5" /> Einstellungen im Prüfstand anwenden
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: SERVICE DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <ServiceDiagnostics />
          )}

        </div>

      </main>

    </div>
  );
}
