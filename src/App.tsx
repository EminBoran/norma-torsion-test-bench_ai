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
  Cpu,
  Network,
  Menu,
  X,
  Smartphone,
  Monitor,
  Lock,
  Unlock,
  Hand,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Power,
  Gauge,
  Radio,
  Layers,
  ArrowRight
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
import ProfinetCodesysDiagnostics from './components/ProfinetCodesysDiagnostics';

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
  totalTestCount?: number;
  selectedProgram?: 'verdrehmoment' | 'vortrimmer' | 'dauerpruefung';
  x3Mode?: 'taster' | 'schalter';
  x3Active?: boolean;
  x5Active?: boolean;
  x7Active?: boolean;
  isReady?: boolean;
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
    selectedProgram: 'vortrimmer',
    x3Mode: 'taster',
    x3Active: true,
    x5Active: false,
    x7Active: false,
    isReady: true,
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

  const [activeTab, setActiveTab] = useState<'control' | 'curve' | 'records' | 'settings' | 'diagnostics' | 'profinet'>('control');
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<TestRecord | null>(null);
  const [tempSettings, setTempSettings] = useState<any>(status.settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // Haptic feedback helper for smartphones
  const triggerHaptic = (ms: number = 35) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (_) {}
    }
  };

  // Initialize WebSockets and fetch records + continuous polling
  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('status_update', (data: TestBenchStatus) => {
      setStatus(data);
    });

    fetchRecords();

    // High-frequency polling fallback (200ms) for reliable live dashboard updates
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const liveData = await res.json();
          setStatus(liveData);
        }
      } catch (err) {
        // network err
      }
    }, 200);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
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
    triggerHaptic(action === 'stop' ? 70 : 35);
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

  const handleSelectProgram = (program: 'verdrehmoment' | 'vortrimmer' | 'dauerpruefung') => {
    triggerHaptic(40);
    sendCommand('select_program', { program });
  };

  const handleToggleX3 = (mode?: 'taster' | 'schalter', forceActive?: boolean) => {
    triggerHaptic(45);
    sendCommand('set_x3', { 
      x3Active: typeof forceActive === 'boolean' ? forceActive : !status.x3Active,
      x3Mode: mode || status.x3Mode || 'taster'
    });
  };

  const handleX5Press = (pressed: boolean) => {
    triggerHaptic(pressed ? 50 : 25);
    sendCommand('set_x5', { x5Pressed: pressed });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(40);
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
        return { label: 'BEREIT (IDLE)', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
      case 1:
        return { label: 'P1: ANFAHREN', color: 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse' };
      case 2:
        return { label: 'P2: PAUSE', color: 'bg-blue-950 text-blue-300 border-blue-800' };
      case 3:
        return { label: 'P3: PRÜFFAHRT', color: 'bg-red-950 text-red-300 border-red-800 animate-pulse' };
      case 4:
        return { label: 'P4: NACHLAUF', color: 'bg-purple-950 text-purple-300 border-purple-800' };
      case 5:
        return { label: 'P5: STANDSTILL', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' };
      case 10:
        return { label: 'HOMING (0°)', color: 'bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse' };
      default:
        return { label: 'UNBEKANNT', color: 'bg-slate-900 text-slate-400 border-slate-700' };
    }
  };

  const stateBadge = getStateBadge();
  const isNearHome = Math.abs(status.motorPositionDeg) <= status.settings.start_tolerance_deg;

  return (
    <div className="min-h-screen md:h-screen bg-slate-900 text-slate-100 font-sans select-none md:overflow-hidden flex flex-col pb-16 md:pb-0">
      
      {/* Top Industrial Header Bar - Optimized for 10" Waveshare & Smartphone */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-md shrink-0">
            NT
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight">NORMA TORSION</h1>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/80 font-mono font-bold">
                PROFINET RT
              </span>
            </div>
          </div>
        </div>

        {/* Status Indicators & Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Machine State Pill */}
          <div className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold border flex items-center gap-1 sm:gap-1.5 ${stateBadge.color}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span className="hidden xs:inline">{stateBadge.label}</span>
            <span className="xs:hidden">{stateBadge.label.split(':')[0]}</span>
          </div>

          {/* PROFINET Status */}
          <div className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 bg-slate-900 rounded-md border border-slate-800 text-[11px] sm:text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${status.connected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-emerald-400'}`}></span>
            <span className="text-emerald-400 font-semibold hidden sm:inline">
              PROFINET ONLINE
            </span>
            <span className="text-emerald-400 font-semibold sm:hidden">
              RT
            </span>
          </div>

          {/* Desktop / 10" Waveshare Display Tabs */}
          <div className="hidden lg:flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 space-x-1 items-center">
            <button
              onClick={() => setActiveTab('control')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${activeTab === 'control' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Steuerung
            </button>
            <button
              onClick={() => setActiveTab('curve')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${activeTab === 'curve' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Prüfkurve
            </button>
            <button
              onClick={() => { setActiveTab('records'); fetchRecords(); }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${activeTab === 'records' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Protokolle ({records.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Parameter
            </button>

            {/* PROFINET Soft-SPS Controller Tab */}
            <div className="h-3.5 w-px bg-slate-800 mx-0.5" />
            <button
              onClick={() => setActiveTab('profinet')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'profinet' 
                  ? 'bg-blue-600 text-white shadow border border-blue-400' 
                  : 'bg-blue-950/50 text-blue-300 hover:bg-blue-900/60 border border-blue-500/40'
              }`}
              title="CODESYS PROFINET Soft-SPS"
            >
              <Network className="w-3 h-3 text-blue-400" />
              <span>PROFINET Soft-SPS</span>
            </button>

            {/* Service Tab */}
            <div className="h-3.5 w-px bg-slate-800 mx-0.5" />
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'diagnostics' 
                  ? 'bg-amber-600 text-white shadow border border-amber-400' 
                  : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-500/40'
              }`}
              title="Master Service & Diagnose (X0-X7)"
            >
              <Settings className={`w-3 h-3 text-amber-400 ${activeTab === 'diagnostics' ? 'animate-spin-slow' : ''}`} />
              <span>Diagnose</span>
            </button>
          </div>

          {/* Smartphone Menu Dropdown Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-md border border-slate-800 cursor-pointer"
            aria-label="Menü"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-blue-400" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </header>

      {/* Mobile Slide-down Drawer / Menu for Smartphone */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 space-y-2 z-20 shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold font-mono">
            <button
              onClick={() => { setActiveTab('control'); setMobileMenuOpen(false); triggerHaptic(); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'control' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
            >
              <Play className="w-4 h-4 text-emerald-400" /> Steuerung
            </button>
            <button
              onClick={() => { setActiveTab('curve'); setMobileMenuOpen(false); triggerHaptic(); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'curve' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
            >
              <Activity className="w-4 h-4 text-blue-400" /> Prüfkurve
            </button>
            <button
              onClick={() => { setActiveTab('records'); fetchRecords(); setMobileMenuOpen(false); triggerHaptic(); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'records' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
            >
              <History className="w-4 h-4 text-amber-400" /> Protokolle ({records.length})
            </button>
            <button
              onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); triggerHaptic(); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'settings' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
            >
              <Sliders className="w-4 h-4 text-purple-400" /> Parameter
            </button>
            <button
              onClick={() => { setActiveTab('profinet'); setMobileMenuOpen(false); triggerHaptic(); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'profinet' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-blue-950/60 border-blue-800 text-blue-300'}`}
            >
              <Network className="w-4 h-4 text-blue-400" /> PROFINET Soft-SPS
            </button>
            <button
              onClick={() => { setActiveTab('diagnostics'); setMobileMenuOpen(false); triggerHaptic(); }}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 ${activeTab === 'diagnostics' ? 'bg-amber-600 border-amber-400 text-white' : 'bg-amber-950/40 border-amber-800 text-amber-300'}`}
            >
              <Settings className="w-4 h-4 text-amber-400" /> Service Diagnose
            </button>
          </div>
        </div>
      )}

      {/* User Feedback Alert Toast */}
      {feedbackMsg && (
        <div className={`px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between transition-all shrink-0 ${feedbackMsg.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          <div className="flex items-center space-x-2">
            {feedbackMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-white hover:text-slate-200 text-xs px-2 py-0.5 bg-black/20 rounded">✕</button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 p-3 sm:p-4 lg:p-5 md:overflow-hidden flex flex-col gap-3 sm:gap-4">
        
        {/* TOP REAL-TIME LIVE VALUES DISPLAY (2x2 Grid on Mobile, 4x1 on 10" Waveshare Display) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 shrink-0">
          
          {/* 1. Drehmoment Live */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-center text-slate-400 text-[11px] sm:text-xs font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Drehmoment</span>
              </span>
              <button 
                onClick={() => sendCommand('tare')}
                className="px-1.5 sm:px-2 py-0.5 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-slate-300 active:text-white rounded text-[10px] sm:text-xs transition cursor-pointer font-mono shrink-0"
                title="Aktuellen Wert als 0 Nm nullen"
              >
                Tara (0)
              </button>
            </div>
            <div className="my-1.5 sm:my-2 flex items-baseline justify-between">
              <span className={`text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight ${Math.abs(status.liveTorque) > 0.05 ? 'text-emerald-400' : 'text-slate-200'}`}>
                {status.liveTorque.toFixed(3)}
              </span>
              <span className="text-sm sm:text-lg font-bold text-slate-500 font-mono">Nm</span>
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-800/60 truncate">
              <span>HBM X1</span>
              <span>Offset: {status.settings.torque_offset.toFixed(2)}</span>
            </div>
          </div>

          {/* 2. Peak / Max Drehmoment */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-center text-slate-400 text-[11px] sm:text-xs font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span className="truncate">Peak Max</span>
              </span>
              <span className="text-amber-400/80 text-[10px] sm:text-xs font-mono shrink-0">Prüfspitze</span>
            </div>
            <div className="my-1.5 sm:my-2 flex items-baseline justify-between">
              <span className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-amber-400">
                {status.peakTorque.toFixed(3)}
              </span>
              <span className="text-sm sm:text-lg font-bold text-slate-500 font-mono">Nm</span>
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-800/60 truncate">
              <span>Start: {status.settings.start_nm} Nm</span>
              <span>Drop: {status.settings.drop_val_pct}%</span>
            </div>
          </div>

          {/* 3. Motor Position / Winkel */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-center text-slate-400 text-[11px] sm:text-xs font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                <span className="truncate">Motor Ist</span>
              </span>
              <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${isNearHome ? 'bg-emerald-950 text-emerald-400' : 'bg-yellow-950 text-yellow-400'}`}>
                {isNearHome ? '0° HOME' : 'AUSGELENKT'}
              </span>
            </div>
            <div className="my-1.5 sm:my-2 flex items-baseline justify-between">
              <span className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-blue-400">
                {status.motorPositionDeg.toFixed(1)}
              </span>
              <span className="text-sm sm:text-lg font-bold text-slate-500 font-mono">° Grad</span>
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-800/60 truncate">
              <span>Inc: {status.motorPositionInc}</span>
              <span>Home: {status.settings.home_pos}</span>
            </div>
          </div>

          {/* 4. Bruch-Winkel / Break Pos */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-center text-slate-400 text-[11px] sm:text-xs font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
                <span className="truncate">Bruchwinkel</span>
              </span>
              <span className="text-purple-400/80 text-[10px] sm:text-xs font-mono shrink-0">Endpos</span>
            </div>
            <div className="my-1.5 sm:my-2 flex items-baseline justify-between">
              <span className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-purple-400">
                {status.breakPosDeg.toFixed(1)}
              </span>
              <span className="text-sm sm:text-lg font-bold text-slate-500 font-mono">° Grad</span>
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-800/60 truncate">
              <span>Nachlauf: {status.settings.overrun_deg}°</span>
              <span>{status.state >= 4 ? 'Erkannt' : 'Wartet'}</span>
            </div>
          </div>

        </div>

        {/* MAIN INTERACTIVE CONTENT AREA */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 sm:p-5 overflow-y-auto shadow-xl flex flex-col min-h-0">
          
          {/* TAB 1: STEUERUNG (Main Control Pad - Fully Touch-Optimized for 10" Display & Smartphone) */}
          {activeTab === 'control' && (
            <div className="flex-1 flex flex-col justify-between gap-4 sm:gap-6">
              
              {/* Status Message Display */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${status.state > 0 ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></div>
                  <span className="text-sm sm:text-base font-semibold text-slate-200 font-mono">
                    {status.statusInfo}
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs text-slate-400 font-mono">
                  Artikel: <strong className="text-slate-200">{status.settings.article_id}</strong> | SN: <strong className="text-slate-200">{status.settings.serial_number}</strong>
                </div>
              </div>

              {/* MAIN INTERACTIVE CONTROL PANEL (Simplified, Clean & Direct) */}
              <div className="flex-1 flex flex-col gap-4">
                
                {/* 1. PROGRAMMAUSWAHL (Clean Tabs) */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-300 font-mono">
                        Prüfprogramm
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/60 font-semibold">
                      Automatischer Rücklauf auf 0.0°
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* PROGRAM 1: VOR-TRIMMERPRÜFUNG */}
                    <button
                      onClick={() => handleSelectProgram('vortrimmer')}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-left flex items-center justify-between ${
                        (status.selectedProgram || 'vortrimmer') === 'vortrimmer'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-950/50'
                          : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Gauge className="w-5 h-5 shrink-0" />
                        <div>
                          <div className="text-sm font-bold">Vor-Trimmerprüfung</div>
                          <div className={`text-[10px] ${(status.selectedProgram || 'vortrimmer') === 'vortrimmer' ? 'text-blue-100' : 'text-slate-500'}`}>35° Prüfwinkel • Reibmoment</div>
                        </div>
                      </div>
                      {(status.selectedProgram || 'vortrimmer') === 'vortrimmer' && (
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      )}
                    </button>

                    {/* PROGRAM 2: VERDREHMOMENT */}
                    <button
                      onClick={() => handleSelectProgram('verdrehmoment')}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-left flex items-center justify-between ${
                        status.selectedProgram === 'verdrehmoment'
                          ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-950/50'
                          : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Zap className="w-5 h-5 shrink-0" />
                        <div>
                          <div className="text-sm font-bold">Verdrehmoment</div>
                          <div className={`text-[10px] ${status.selectedProgram === 'verdrehmoment' ? 'text-amber-100' : 'text-slate-500'}`}>Torsionsbruch & Peak-Drop</div>
                        </div>
                      </div>
                      {status.selectedProgram === 'verdrehmoment' && (
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      )}
                    </button>

                    {/* PROGRAM 3: DAUERPRÜFUNG */}
                    <button
                      onClick={() => handleSelectProgram('dauerpruefung')}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-left flex items-center justify-between ${
                        status.selectedProgram === 'dauerpruefung'
                          ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-950/50'
                          : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Activity className="w-5 h-5 shrink-0" />
                        <div>
                          <div className="text-sm font-bold">Dauerprüfung</div>
                          <div className={`text-[10px] ${status.selectedProgram === 'dauerpruefung' ? 'text-purple-100' : 'text-slate-500'}`}>90° Zyklus • Haltekraft</div>
                        </div>
                      </div>
                      {status.selectedProgram === 'dauerpruefung' && (
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. HARDWARE EINGÄNGE STATUS (NON-INTERACTIVE) */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-300 font-mono">
                      Hardware Eingänge (Status)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* STATUS X3: FREIGABE */}
                    <div className={`p-3 sm:p-4 rounded-xl border-2 flex items-center gap-3 ${
                      status.x3Active 
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-500'
                    }`}>
                      <div className={`p-2 rounded-lg ${status.x3Active ? 'bg-emerald-500/20' : 'bg-slate-900'}`}>
                        {status.x3Active ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide">X3 Freigabe</div>
                        <div className="text-[10px] font-mono mt-0.5">{status.x3Active ? 'AKTIV' : 'GESPERRT'}</div>
                      </div>
                    </div>

                    {/* STATUS X5: PRÜFTASTE */}
                    <div className={`p-3 sm:p-4 rounded-xl border-2 flex items-center gap-3 ${
                      status.x5Active 
                        ? 'bg-blue-950/40 border-blue-500/50 text-blue-300' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-500'
                    }`}>
                      <div className={`p-2 rounded-lg ${status.x5Active ? 'bg-blue-500/20' : 'bg-slate-900'}`}>
                        <Hand className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide">X5 Prüftaste</div>
                        <div className="text-[10px] font-mono mt-0.5">{status.x5Active ? 'GEDRÜCKT (HOLD)' : 'NICHT BETÄTIGT'}</div>
                      </div>
                    </div>

                    {/* STATUS X7: NOT-HALT */}
                    <div className={`p-3 sm:p-4 rounded-xl border-2 flex items-center gap-3 ${
                      status.x7Active // Use x7Active instead of status.state === 99
                        ? 'bg-red-950/40 border-red-500/50 text-red-300' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-500'
                    }`}>
                      <div className={`p-2 rounded-lg ${status.x7Active ? 'bg-red-500/20' : 'bg-slate-900'}`}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide">X7 Not-Halt</div>
                        <div className="text-[10px] font-mono mt-0.5">{status.x7Active ? 'NOT-HALT AKTIV!' : 'OK (NICHT BETÄTIGT)'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. SCHNELLE SETUP-LEISTE (Jog, Tara, Reset) */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 sm:p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* LEERFELD ALS PLATZHALTER STATT X3 BEREITSCHAFT */}
                    <div className="hidden sm:block"></div>

                    {/* JOG LINKS */}
                    <button
                      onMouseDown={() => sendCommand('jog', { dir: 'left' })}
                      onMouseUp={() => sendCommand('jog', { dir: 'stop' })}
                      onTouchStart={() => sendCommand('jog', { dir: 'left' })}
                      onTouchEnd={() => sendCommand('jog', { dir: 'stop' })}
                      disabled={status.state !== 0 && status.state !== 20}
                      className="p-2.5 sm:p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 disabled:text-slate-700 text-slate-200 font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer active:bg-blue-600 active:text-white text-xs sm:text-sm"
                    >
                      <ChevronLeft className="w-4 h-4 shrink-0" />
                      <span>JOG LINKS</span>
                    </button>

                    {/* JOG RECHTS */}
                    <button
                      onMouseDown={() => sendCommand('jog', { dir: 'right' })}
                      onMouseUp={() => sendCommand('jog', { dir: 'stop' })}
                      onTouchStart={() => sendCommand('jog', { dir: 'right' })}
                      onTouchEnd={() => sendCommand('jog', { dir: 'stop' })}
                      disabled={status.state !== 0 && status.state !== 20}
                      className="p-2.5 sm:p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 disabled:text-slate-700 text-slate-200 font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer active:bg-blue-600 active:text-white text-xs sm:text-sm"
                    >
                      <span>JOG RECHTS</span>
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </button>

                    {/* TARA & RESET */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => sendCommand('tare')}
                        className="flex-1 p-2.5 sm:p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer active:bg-emerald-700 text-xs"
                        title="Drehmoment auf 0.000 Nm nullen"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>TARA</span>
                      </button>
                      <button
                        onClick={() => sendCommand('reset')}
                        className="flex-1 p-2.5 sm:p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer active:bg-slate-700 text-xs"
                        title="Fehlerspeicher & Status zurücksetzen"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                        <span>RESET</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: LIVE PRÜFKURVE (Live Recharts Graph) */}
          {activeTab === 'curve' && (
            <div className="flex-1 flex flex-col gap-3 min-h-[320px]">
              <div className="flex justify-between items-center">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> Echtzeit Drehmoment-Kurve
                </h3>
                <span className="text-[11px] sm:text-xs text-slate-400 font-mono">
                  Punkte: {status.liveCurve?.length || 0}
                </span>
              </div>

              <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 min-h-[260px] sm:min-h-[320px]">
                {status.liveCurve && status.liveCurve.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={status.liveCurve} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="deg" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        unit="°" 
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        unit=" Nm" 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                        formatter={(val: any) => [`${Number(val).toFixed(3)} Nm`, 'Drehmoment']}
                        labelFormatter={(deg: any) => `Winkel: ${deg}°`}
                      />
                      {status.peakTorque > 0 && (
                        <ReferenceLine y={status.peakTorque} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Peak: ${status.peakTorque.toFixed(2)} Nm`, fill: '#f59e0b', fontSize: 10 }} />
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
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono py-12">
                    <Activity className="w-10 h-10 sm:w-12 sm:h-12 mb-2 stroke-1" />
                    <span className="text-xs sm:text-sm text-center px-4">Keine aktiven Kurvendaten. Starten Sie eine Prüfung!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MESSPROTOKOLLE & DATENBANK (Responsive Table / Cards for Mobile) */}
          {activeTab === 'records' && (
            <div className="flex-1 flex flex-col gap-3 sm:gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" /> Prüfberichte ({records.length})
                </h3>
                <button 
                  onClick={fetchRecords} 
                  className="px-2.5 sm:px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Aktualisieren
                </button>
              </div>

              {/* Mobile Cards View (< sm) */}
              <div className="sm:hidden space-y-2.5 overflow-y-auto max-h-[450px]">
                {records.map((r) => (
                  <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-400">{r.articleId}</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${r.result === 'PASSED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                        {r.result}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                      <div>SN: <span className="text-slate-200">{r.serialNumber}</span></div>
                      <div>Max: <strong className="text-emerald-400">{Number(r.maxTorque).toFixed(3)} Nm</strong></div>
                      <div>Zeit: {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div>Dauer: {Number(r.duration).toFixed(1)} s</div>
                    </div>
                    <button
                      onClick={() => { setSelectedRecord(r); triggerHaptic(); }}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold text-center cursor-pointer"
                    >
                      Details & PDF anzeigen
                    </button>
                  </div>
                ))}
                {records.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-mono text-xs">
                    Noch keine Prüfberichte in der Datenbank vorhanden.
                  </div>
                )}
              </div>

              {/* Desktop / 10" Display Table (>= sm) */}
              <div className="hidden sm:flex flex-1 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex-col">
                <div className="overflow-y-auto max-h-[420px]">
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
                              onClick={() => { setSelectedRecord(r); triggerHaptic(); }}
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
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
                  <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <h4 className="text-base sm:text-lg font-bold text-white">Prüfbericht Details ({selectedRecord.id})</h4>
                      <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-white text-lg font-bold p-1">✕</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div><span className="text-slate-500">Zeitstempel:</span> {new Date(selectedRecord.timestamp).toLocaleString()}</div>
                      <div><span className="text-slate-500">Ergebnis:</span> <strong className="text-emerald-400">{selectedRecord.result}</strong></div>
                      <div><span className="text-slate-500">Artikel-ID:</span> {selectedRecord.articleId}</div>
                      <div><span className="text-slate-500">Serien-Nr.:</span> {selectedRecord.serialNumber}</div>
                      <div><span className="text-slate-500">Max. Drehmoment:</span> <strong className="text-amber-400">{Number(selectedRecord.maxTorque).toFixed(3)} Nm</strong></div>
                      <div><span className="text-slate-500">Prüfdauer:</span> {Number(selectedRecord.duration).toFixed(1)} s</div>
                    </div>

                    <div className="pt-3 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 border-t border-slate-800">
                      <button 
                        onClick={() => window.print()} 
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer text-center"
                      >
                        Bericht drucken / PDF
                      </button>
                      <button 
                        onClick={() => setSelectedRecord(null)} 
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer text-center"
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
            <form onSubmit={handleSaveSettings} className="flex-1 flex flex-col justify-between gap-4 sm:gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                
                {/* Start-Drehmoment */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
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
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Schwelle, ab der die Pause/Prüfung startet.</p>
                </div>

                {/* Pause Dauer */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
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
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Pausenzeit nach Erreichen des Start-Drehmoments.</p>
                </div>

                {/* Bruch-Abfall % */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
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
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Prozentualer Abfall vom Peak für Brucherkennung.</p>
                </div>

                {/* Nachlaufwinkel */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
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
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Weiterer Drehwinkel nach Brucherkennung.</p>
                </div>

                {/* Home Position Inkremente */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
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
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Nullpunkt-Inkremente (Standard: 51200).</p>
                </div>

                {/* Artikel ID & Seriennummer */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
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
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Wird im Messbericht gespeichert.</p>
                </div>

              </div>

              {/* Submit Button */}
              <div className="pt-2 sm:pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition text-xs sm:text-sm"
                >
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" /> Einstellungen im Prüfstand anwenden
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: SERVICE DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <ServiceDiagnostics />
          )}

          {/* TAB 6: PROFINET CODESYS SOFT-SPS */}
          {activeTab === 'profinet' && (
            <ProfinetCodesysDiagnostics />
          )}

        </div>

      </main>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR (for Smartphones / Tablets < lg) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-slate-950 border-t border-slate-800 flex items-center justify-around px-1 z-30 shadow-2xl">
        
        <button
          onClick={() => { setActiveTab('control'); triggerHaptic(); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'control' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className={`w-5 h-5 ${activeTab === 'control' ? 'fill-current scale-110' : ''}`} />
          <span className="text-[10px] font-bold mt-0.5">Steuerung</span>
        </button>

        <button
          onClick={() => { setActiveTab('curve'); triggerHaptic(); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'curve' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className={`w-5 h-5 ${activeTab === 'curve' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold mt-0.5">Kurve</span>
        </button>

        <button
          onClick={() => { setActiveTab('records'); fetchRecords(); triggerHaptic(); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'records' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className={`w-5 h-5 ${activeTab === 'records' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold mt-0.5">Protokoll</span>
        </button>

        <button
          onClick={() => { setActiveTab('profinet'); triggerHaptic(); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'profinet' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className={`w-5 h-5 ${activeTab === 'profinet' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold mt-0.5">PROFINET</span>
        </button>

        <button
          onClick={() => { setActiveTab('settings'); triggerHaptic(); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'settings' || activeTab === 'diagnostics' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className={`w-5 h-5 ${activeTab === 'settings' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold mt-0.5">Parameter</span>
        </button>

      </nav>

    </div>
  );
}
