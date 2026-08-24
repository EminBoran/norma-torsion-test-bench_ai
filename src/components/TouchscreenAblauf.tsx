import React, { useState } from 'react';
import { useTestBench, ProgramType } from '../context/TestBenchContext';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Maximize2, 
  Minimize2, 
  Sliders, 
  Radio, 
  Cpu, 
  Compass, 
  Check, 
  Settings2, 
  RotateCw,
  Thermometer,
  Layers,
  Power,
  SlidersHorizontal,
  Home,
  Droplets,
  Gauge,
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

interface TouchscreenAblaufProps {
  onNavigateToSettings?: (subTab?: 'ablauf' | 'motor' | 'torque' | 'klima' | 'ports' | 'service' | 'diagnose' | 'rpi') => void;
}

export default function TouchscreenAblauf({ onNavigateToSettings }: TouchscreenAblaufProps) {
  const {
    sequenceConfig,
    sequenceState,
    startSequence,
    stopSequence,
    resetSequence,
    setX5Hold,
    toggleDIX6Input,
    jumpToStep,
    liveTorque,
    motorPosition,
    motorSpeedRpm,
    torqueData,
    records,
    ports,
    opcUaConnected,
    activeProgram,
    selectProgram,
    temperature,
    humidity,
    homeStatus,
    moveToHome,
    jogMotorX5
  } = useTestBench();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const currentStep = sequenceState.currentStep;
  const isRunning = sequenceState.isRunning;
  const isCompleted = sequenceState.isCompleted;

  const totalPower = ports.reduce((acc, p) => acc + (p.status === 'active' ? p.power : 0), 0);
  const activePortCount = ports.filter(p => p.status === 'active').length;

  const stepList = [
    {
      id: 0,
      title: '0. Rüst- & Initialablauf',
      sub: 'Baumer CC50 connect, Lüfter X7 EIN, Status-LED GRÜN, Motor BEREIT',
      badge: sequenceState.baumerConnected ? 'OK' : 'Init',
      paramText: 'Auto-Init'
    },
    {
      id: 1,
      title: '1. X5 Voranzug (Hold)',
      sub: `Taster X5 halten: Motor mit ${sequenceConfig.step1_speedRpm} RPM bis ${sequenceConfig.step1_targetNm} Nm`,
      badge: `${sequenceState.step1AchievedNm.toFixed(1)} / ${sequenceConfig.step1_targetNm} Nm`,
      paramText: `${sequenceConfig.step1_speedRpm} RPM | ${sequenceConfig.step1_targetNm} Nm`
    },
    {
      id: 2,
      title: '2. Beruhigungszeit',
      sub: `Warte ${sequenceConfig.step2_dwellSeconds} s vor Hauptlastprüfung`,
      badge: currentStep === 2 ? `${sequenceState.stepTimerRemaining.toFixed(1)} s` : `${sequenceConfig.step2_dwellSeconds} s`,
      paramText: `t = ${sequenceConfig.step2_dwellSeconds} s`
    },
    {
      id: 3,
      title: '3. Torsion bis Bruch',
      sub: `Fahre mit ${sequenceConfig.step3_speedRpm} RPM bis Bruchdrehmoment (Peak Drop)`,
      badge: sequenceState.maxMeasuredTorque > 0 ? `${sequenceState.maxMeasuredTorque.toFixed(1)} Nm` : 'Prüfung',
      paramText: `${sequenceConfig.step3_speedRpm} RPM | Bruch`
    },
    {
      id: 4,
      title: '4. Datenspeicherung',
      sub: 'Schreibe Max-Drehmoment & Ist-Position automatisch in Messdatenbank',
      badge: records.length > 0 ? 'DB OK' : 'Auto-Save',
      paramText: 'Auto SQL'
    },
    {
      id: 5,
      title: '5. Entlastungszeit',
      sub: `Warte ${sequenceConfig.step5_dwellSeconds} s zur thermischen/mechanischen Entspannung`,
      badge: currentStep === 5 ? `${sequenceState.stepTimerRemaining.toFixed(1)} s` : `${sequenceConfig.step5_dwellSeconds} s`,
      paramText: `t = ${sequenceConfig.step5_dwellSeconds} s`
    },
    {
      id: 6,
      title: '6. Referenzfahrt (Home)',
      sub: sequenceConfig.step6_requireDIX6 
        ? 'Fahre auf 0.0° zurück, wenn digitaler Eingang DI X6 aktiv ist' 
        : 'Fahre auf 0.0° Home-Position zurück',
      badge: sequenceState.diX6Input ? 'DI X6 HIGH' : 'DI X6 LOW',
      paramText: 'Home 0.0°'
    }
  ];

  return (
    <div className="flex flex-col space-y-5 max-w-6xl mx-auto select-none font-sans">
      {/* Top Banner: Restrained Header with direct link to separate Settings */}
      <div className="bg-white border border-slate-300 rounded-sm p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center font-bold text-xs rounded-sm">
            CC50
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
                Prüfstand Hauptsteuerung
              </h2>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm ${
                opcUaConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {opcUaConnected ? 'OPC UA Online' : 'OPC UA Offline'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Sequenzablauf (Schritte 0 - 6) • Waveshare 10.1" Touchscreen Kiosk
            </p>
          </div>
        </div>

        {/* Quick Navigation to Settings & Fullscreen */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigateToSettings?.('ablauf')}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer rounded-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Erweiterte Einstellungen</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors cursor-pointer rounded-sm flex items-center space-x-1"
            title="Vollbild Kiosk-Modus"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-slate-500" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-500" />}
            <span className="text-xs font-medium">Kiosk</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          THE 3 CORE CARDS IN EXACT USER REQUESTED ORDER:
          1. Prüfprogramm
          2. Motor Position
          3. Temp, Feuchtigkeit & Werte Power
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARD 1: Prüfprogramm (Kommt als erste) */}
        <div className="bg-white border border-slate-300 rounded-sm p-4 flex flex-col justify-between shadow-xs relative">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-sm bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Prüfprogramm
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm ${
                isRunning 
                  ? 'bg-blue-100 text-blue-800' 
                  : isCompleted 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {isRunning ? `LÄUFT (S${currentStep})` : isCompleted ? 'BEENDET' : 'BEREIT'}
              </span>
            </div>

            {/* Program Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Aktives Programm:</span>
                <select
                  value={activeProgram}
                  onChange={(e) => selectProgram(e.target.value as ProgramType)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-sm px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="verdrehmoment">Verdrehmoment (Torsion)</option>
                  <option value="anfahren">Anfahren (Drehzahlrampe)</option>
                  <option value="kalibrierung">Kalibrierung (CC50)</option>
                  <option value="service">Service-Programm</option>
                </select>
              </div>

              {/* Part Details & Target */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-sm space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sachnummer:</span>
                  <span className="font-bold text-slate-900">{sequenceConfig.partNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Seriennr.:</span>
                  <span className="font-bold text-slate-700">{sequenceConfig.serialNumber}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="text-slate-500">Vorlast / Prüfdrehzahl:</span>
                  <span className="font-bold text-blue-700">{sequenceConfig.step1_targetNm.toFixed(1)} Nm / {sequenceConfig.step3_speedRpm} RPM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Preset: Standard Torsion</span>
            <button
              onClick={() => onNavigateToSettings?.('ablauf')}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 cursor-pointer"
            >
              <span>Parameter bearbeiten</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* CARD 2: Motor Position (Kommt als zweite) */}
        <div className="bg-white border border-slate-300 rounded-sm p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-sm bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Motor Position
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm ${
                homeStatus === 'homed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {homeStatus === 'homed' ? '0.0° Referenziert' : 'Referenz nötig'}
              </span>
            </div>

            {/* Big Angle Gauge */}
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {motorPosition.toFixed(1)}°
                </span>
                <span className="text-[11px] text-slate-500 font-mono block">
                  Ist-Winkel (PSE Antrieb)
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-indigo-700 block">
                  {motorSpeedRpm} RPM
                </span>
                <span className="text-[10px] text-slate-500 uppercase">
                  Rechtslauf
                </span>
              </div>
            </div>

            {/* Angle Progress Bar 0..360° */}
            <div className="w-full bg-slate-200 h-2 rounded-sm overflow-hidden mb-3">
              <div 
                className="bg-indigo-600 h-2 transition-all duration-100" 
                style={{ width: `${Math.min(100, (motorPosition / 360) * 100)}%` }}
              />
            </div>

            {/* Quick Jog & Home Controls */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={moveToHome}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-sm text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-slate-600" />
                <span>Home 0.0°</span>
              </button>
              <button
                onClick={() => jogMotorX5('forward')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-sm text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-600" />
                <span>JOG +5°</span>
              </button>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Ist-Drehmoment: <strong className="text-slate-800 font-mono">{liveTorque.toFixed(2)} Nm</strong></span>
            <button
              onClick={() => onNavigateToSettings?.('motor')}
              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 cursor-pointer"
            >
              <span>Motor Setup</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* CARD 3: Temp, Feuchtigkeit und Werte Power (Kommt als dritte) */}
        <div className="bg-white border border-slate-300 rounded-sm p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-sm bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Klima & Power-Werte
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-sm">
                Normalbereich
              </span>
            </div>

            {/* 4-Metric Grid: Temp, Feuchte, Spannung, Power */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                <div className="flex items-center space-x-1 text-slate-500 mb-0.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-semibold uppercase">Temperatur</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">
                  {temperature.toFixed(1)} °C
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                <div className="flex items-center space-x-1 text-slate-500 mb-0.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] font-semibold uppercase">Feuchte</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">
                  {humidity.toFixed(1)} %
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                <div className="flex items-center space-x-1 text-slate-500 mb-0.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[10px] font-semibold uppercase">Spannung</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">
                  24.2 V
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                <div className="flex items-center space-x-1 text-slate-500 mb-0.5">
                  <Power className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[10px] font-semibold uppercase">Leistung</span>
                </div>
                <div className="text-base font-extrabold text-indigo-700 font-mono">
                  {totalPower.toFixed(1)} W
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Lüfter X7: <strong className={sequenceState.fanX7Active ? 'text-emerald-700' : 'text-slate-600'}>{sequenceState.fanX7Active ? 'EIN' : 'STANDBY'}</strong>
            </span>
            <button
              onClick={() => onNavigateToSettings?.('klima')}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
            >
              <span>Details & Ports</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* =========================================================================
          MAIN INTERACTIVE BODY:
          Left: Huge Live Torsion Curve (Drehmoment & Winkel über Zeit)
          Right: Sequencer Controls (X5 Hold, DI X6 Simulator, Start/Stopp, Steps 0-6)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (8 cols): Live Curve Graph */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Torsionskurve (Baumer CC50 Drehmoment & Ist-Winkel)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Echtzeit-Messung mit Vorlast-Schwelle und automatischer Brucherkennung
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-1 border border-slate-200 rounded-sm">
                  Peak: <strong className="text-blue-700">{sequenceState.maxMeasuredTorque > 0 ? `${sequenceState.maxMeasuredTorque.toFixed(2)} Nm` : `${liveTorque.toFixed(2)} Nm`}</strong>
                </span>
                <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-1 border border-slate-200 rounded-sm">
                  Aktuell: <strong className="text-slate-900">{liveTorque.toFixed(2)} Nm</strong>
                </span>
              </div>
            </div>

            {/* Big Chart Container */}
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={torqueData}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={{ stroke: '#cbd5e1' }} 
                    tickFormatter={(val) => `${(val * 0.15).toFixed(1)}s`}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#1d4ed8" 
                    fontSize={10} 
                    domain={[0, 20]} 
                    tickLine={false} 
                    axisLine={{ stroke: '#cbd5e1' }} 
                    label={{ value: 'Drehmoment (Nm)', angle: -90, position: 'insideLeft', fill: '#1d4ed8', fontSize: 10 }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#0f766e" 
                    fontSize={10} 
                    domain={['auto', 'auto']} 
                    tickLine={false} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    label={{ value: 'Winkel (°)', angle: 90, position: 'insideRight', fill: '#0f766e', fontSize: 10 }}
                  />
                  <ReferenceLine yAxisId="left" y={sequenceConfig.step1_targetNm} stroke="#0ea5e9" strokeDasharray="3 3" label={{ value: `Vorlast ${sequenceConfig.step1_targetNm}Nm`, fill: '#0ea5e9', fontSize: 9 }} />
                  <ReferenceLine yAxisId="left" y={15.0} stroke="#e11d48" strokeDasharray="3 3" label={{ value: 'Min Bruch 15.0Nm', fill: '#e11d48', fontSize: 9 }} />
                  <Tooltip 
                    formatter={(val: any, name: any) => {
                      if (name === 'torque') return [`${Number(val || 0).toFixed(2)} Nm`, 'Drehmoment'];
                      if (name === 'position') return [`${Number(val || 0).toFixed(1)}°`, 'Winkel'];
                      return [val, name];
                    }}
                    labelFormatter={(label: any) => `Zeit: ${(Number(label) * 0.15).toFixed(1)}s`}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '2px', border: '1px solid #cbd5e1', fontSize: '11px', boxShadow: 'none' }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="torque" 
                    stroke="#1d4ed8" 
                    strokeWidth={2.5} 
                    dot={false}
                    isAnimationActive={false}
                    name="torque"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="position" 
                    stroke="#0f766e" 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={false}
                    name="position"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 bg-blue-600 inline-block mr-1.5 rounded-xs" />
                Blau: Drehmoment (Nm)
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 bg-teal-600 inline-block mr-1.5 rounded-xs" />
                Grün: Ist-Winkel (°)
              </span>
              <span>Abtastung: 20ms (OPC UA)</span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Sequence Steuerung & Timeline */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          
          {/* Main Control Card */}
          <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block border-b border-slate-200 pb-1.5">
              Ablauf-Bedienung
            </span>

            {/* Step 1 Interactive Touch Hold Target (X5) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">
                  1. Vorlast X5 Taster
                </span>
                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                  Ziel: {sequenceConfig.step1_targetNm.toFixed(1)} Nm
                </span>
              </div>
              <button
                type="button"
                onMouseDown={() => setX5Hold(true)}
                onMouseUp={() => setX5Hold(false)}
                onMouseLeave={() => setX5Hold(false)}
                onTouchStart={(e) => { e.preventDefault(); setX5Hold(true); }}
                onTouchEnd={(e) => { e.preventDefault(); setX5Hold(false); }}
                disabled={!isRunning || currentStep !== 1}
                className={`w-full py-3.5 rounded-sm font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer select-none border ${
                  currentStep === 1 && sequenceState.isX5Held
                    ? 'bg-blue-700 text-white border-blue-900 shadow-inner'
                    : currentStep === 1
                    ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-800 animate-pulse'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-300'
                }`}
              >
                <span>
                  {currentStep === 1 
                    ? (sequenceState.isX5Held ? 'X5 AKTIV (Dreht)' : 'X5 TASTER GEDRÜCKT HALTEN')
                    : 'X5 Taster (Nur in Schritt 1)'}
                </span>
              </button>
            </div>

            {/* Step 6 Interactive DI X6 Simulator */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 flex items-center justify-between rounded-sm">
              <div>
                <span className="text-xs font-bold text-slate-800 block">DI X6 Signal (Home)</span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {sequenceState.diX6Input ? 'SENSOR: HIGH (Aktiv)' : 'SENSOR: LOW (Wartet)'}
                </span>
              </div>
              <button
                onClick={toggleDIX6Input}
                className={`px-3 py-1 text-[10px] font-bold uppercase transition-colors cursor-pointer border rounded-sm ${
                  sequenceState.diX6Input
                    ? 'bg-emerald-700 text-white border-emerald-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {sequenceState.diX6Input ? 'Reset X6' : 'Set X6'}
              </button>
            </div>

            {/* Master Control Buttons (Start / Stopp / Reset) */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={startSequence}
                disabled={isRunning}
                className={`py-2.5 rounded-sm font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border ${
                  isRunning 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-sm'
                }`}
              >
                Start
              </button>
              <button
                onClick={stopSequence}
                disabled={!isRunning}
                className={`py-2.5 rounded-sm font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border ${
                  !isRunning 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                    : 'bg-red-700 hover:bg-red-800 text-white border-red-900 shadow-sm'
                }`}
              >
                Stopp
              </button>
              <button
                onClick={resetSequence}
                className="py-2.5 rounded-sm font-bold text-xs uppercase tracking-wider bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 transition-colors cursor-pointer shadow-sm"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Step Timeline Card */}
          <div className="bg-white border border-slate-300 p-3 flex-1 flex flex-col rounded-sm shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Ablauf-Sequenz (Schritte 0-6)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Klick = Sprung
              </span>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[220px]">
              {stepList.map((step) => {
                const isActive = isRunning && currentStep === step.id;
                const isPast = (isRunning && currentStep > step.id) || isCompleted;

                return (
                  <div
                    key={step.id}
                    onClick={() => jumpToStep(step.id)}
                    className={`p-1.5 px-2 rounded-sm border transition-colors cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-blue-50 border-blue-400 shadow-sm'
                        : isPast
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className={`w-5 h-5 rounded-sm flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        isPast
                          ? 'bg-slate-300 text-slate-700'
                          : isActive
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isPast ? <Check className="w-3 h-3" /> : step.id}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <h4 className={`text-[11px] font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                          {step.title}
                        </h4>
                        {isActive && (
                          <p className="text-[9px] text-slate-500 truncate mt-0.5 font-mono">
                            {step.sub}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 pl-1">
                      <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-mono font-bold uppercase ${
                        isActive
                          ? 'bg-blue-700 text-white'
                          : isPast
                          ? 'bg-slate-200 text-slate-600 border border-slate-300'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {step.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
