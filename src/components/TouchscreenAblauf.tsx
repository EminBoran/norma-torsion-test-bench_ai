import React, { useState, useEffect } from 'react';
import { useTestBench } from '../context/TestBenchContext';
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
  ChevronRight, 
  AlertTriangle, 
  Check, 
  Settings2, 
  Terminal, 
  ArrowRight, 
  Save, 
  Flame, 
  Database,
  Layers,
  Power
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

export default function TouchscreenAblauf() {
  const {
    sequenceConfig,
    sequenceState,
    startSequence,
    stopSequence,
    resetSequence,
    setX5Hold,
    toggleDIX6Input,
    updateSequenceConfig,
    jumpToStep,
    liveTorque,
    motorPosition,
    motorSpeedRpm,
    torqueData,
    records,
    ports,
    opcUaConnected
  } = useTestBench();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRPiModal, setShowRPiModal] = useState(false);

  // Local config edit buffer
  const [editCfg, setEditCfg] = useState(sequenceConfig);

  useEffect(() => {
    setEditCfg(sequenceConfig);
  }, [sequenceConfig]);

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
    <div className="flex flex-col space-y-6 max-w-6xl mx-auto select-none">
      {/* Top Banner: Strict Enterprise Header */}
      <div className="bg-white border border-slate-300 rounded-sm p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
            Test Bench Sequenzsteuerung (CC50)
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Standardablauf (Schritte 0 - 6) | V.2026.8 | RPi5-Kiosk
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer rounded-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Parameter</span>
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors cursor-pointer rounded-sm flex items-center space-x-1"
            title="Vollbild"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-slate-500" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-500" />}
            <span className="text-xs font-medium">Kiosk</span>
          </button>
        </div>
      </div>

      {/* Main Touchscreen Layout: 2-Column Responsive Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Gauges & Big Touch Interactive Control */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white border border-slate-300 p-5 space-y-5 rounded-sm relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Live Telemetrie
              </span>
              <div className="flex items-center gap-2">
                {/* Hardware Status Icons */}
                <div className="flex items-center justify-center w-8 h-8 bg-white border border-slate-200 rounded-sm shadow-sm" title="LED Status: OK">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-white border border-slate-200 rounded-sm shadow-sm" title="Antrieb: Enabled">
                  <Settings2 className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                
                <span className={`px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center ${
                  opcUaConnected 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {opcUaConnected ? 'OPC UA: OK' : 'OPC UA: Getrennt'}
                </span>
                <span className={`px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center ${
                  isRunning 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : isCompleted 
                    ? 'bg-slate-100 text-slate-800 border border-slate-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {isRunning ? `Seq. Aktiv (S${currentStep})` : isCompleted ? 'Prüfung Beendet' : 'System Bereit'}
                </span>
              </div>
            </div>

            {/* Primary Touch Gauges: Torque & Angle */}
            <div className="grid grid-cols-2 gap-6">
              {/* Torque */}
              <div className="bg-slate-50 p-6 border border-slate-200 rounded-sm flex flex-col justify-between relative overflow-hidden">
                <span className="text-sm text-slate-600 font-bold uppercase tracking-wider">Drehmoment (M)</span>
                <div className="my-4 z-10">
                  <div className="text-7xl font-extrabold text-blue-700 font-mono tracking-tighter">
                    {liveTorque.toFixed(2)}
                  </div>
                  <span className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-2 block">Nm (Baumer CC50)</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 mt-2 overflow-hidden rounded-none z-10">
                  <div 
                    className="bg-blue-600 h-2.5 transition-all duration-100" 
                    style={{ width: `${Math.min(100, (liveTorque / (sequenceConfig.step1_targetNm * 3)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Angle / Position */}
              <div className="bg-slate-50 p-6 border border-slate-200 rounded-sm flex flex-col justify-between">
                <span className="text-sm text-slate-600 font-bold uppercase tracking-wider">Ist-Winkel (Pos)</span>
                <div className="my-4">
                  <div className="text-7xl font-extrabold text-slate-900 font-mono tracking-tighter">
                    {motorPosition.toFixed(1)}°
                  </div>
                  <span className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-2 block">{motorSpeedRpm} RPM</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 mt-2 overflow-hidden rounded-none">
                  <div 
                    className="bg-slate-800 h-2.5 transition-all duration-100" 
                    style={{ width: `${Math.min(100, (motorPosition / 360) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Huge Live Torsion Curve Graph */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Torsionskurve
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 border border-slate-200">
                  Peak: {sequenceState.maxMeasuredTorque > 0 ? `${sequenceState.maxMeasuredTorque.toFixed(1)} Nm` : `${liveTorque.toFixed(1)} Nm`}
                </span>
              </div>

              <div className="h-[400px] w-full mt-4">
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
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#0f766e" 
                      fontSize={10} 
                      domain={['auto', 'auto']} 
                      tickLine={false} 
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <ReferenceLine yAxisId="left" y={sequenceConfig.step1_targetNm} stroke="#0ea5e9" strokeDasharray="3 3" label={{ value: `Vorlast ${sequenceConfig.step1_targetNm}Nm`, fill: '#0ea5e9', fontSize: 9 }} />
                    <ReferenceLine yAxisId="left" y={5.0} stroke="#e11d48" strokeDasharray="3 3" label={{ value: 'Min 5.0Nm', fill: '#e11d48', fontSize: 9 }} />
                    <Tooltip 
                      formatter={(val: any, name: any, props: any) => {
                        if (name === 'torque') return [`${Number(val || 0).toFixed(2)} Nm`, 'Drehmoment'];
                        if (name === 'position') return [`${Number(val || 0).toFixed(1)}°`, 'Winkel'];
                        return [val, name];
                      }}
                      labelFormatter={(label: any) => `Zeit: ${(Number(label) * 0.15).toFixed(1)}s`}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '2px', border: '1px solid #cbd5e1', fontSize: '10px', boxShadow: 'none' }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="torque" 
                      stroke="#1d4ed8" 
                      strokeWidth={2} 
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
            </div>
          </div>
        </div>

        {/* Right Column: Sequence & Master Controls */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          
          {/* Main Controls Card */}
          <div className="bg-white border border-slate-300 p-4 rounded-sm flex flex-col shadow-sm">
            
            {/* Step 1 Interactive Touch Hold Target (X5) */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase">
                  1. Vorlast X5
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
                className={`w-full py-4 rounded-sm font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer select-none border ${
                  currentStep === 1 && sequenceState.isX5Held
                    ? 'bg-blue-700 text-white border-blue-900 shadow-inner'
                    : currentStep === 1
                    ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-800'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-300'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-0.5">
                  <span>
                    {currentStep === 1 
                      ? (sequenceState.isX5Held ? 'X5 AKTIV (Dreht)' : 'X5 TASTER HALTEN')
                      : 'X5 (Nur Schritt 1)'}
                  </span>
                </div>
              </button>
            </div>

            {/* Step 6 Interactive DI X6 Simulator */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 flex items-center justify-between mb-4 rounded-sm">
              <div>
                <span className="text-xs font-bold text-slate-800 block">DI X6 Signal (Home)</span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                  {sequenceState.diX6Input ? 'SENSOR: HIGH' : 'SENSOR: LOW'}
                </span>
              </div>
              <button
                onClick={toggleDIX6Input}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-colors cursor-pointer border rounded-sm ${
                  sequenceState.diX6Input
                    ? 'bg-green-700 text-white border-green-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {sequenceState.diX6Input ? 'Reset X6' : 'Set X6'}
              </button>
            </div>

            {/* Master Control Buttons (Start / Stopp / Reset) */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={startSequence}
                disabled={isRunning}
                className={`py-2.5 rounded-sm font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer border ${
                  isRunning 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                    : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-900 shadow-sm'
                }`}
              >
                Start
              </button>
              <button
                onClick={stopSequence}
                disabled={!isRunning}
                className={`py-2.5 rounded-sm font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer border ${
                  !isRunning 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                    : 'bg-red-700 hover:bg-red-800 text-white border-red-900 shadow-sm'
                }`}
              >
                Stopp
              </button>
              <button
                onClick={resetSequence}
                className="py-2.5 rounded-sm font-bold text-[11px] uppercase tracking-wider bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 transition-colors cursor-pointer shadow-sm"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Step Timeline Card */}
          <div className="bg-white border border-slate-300 p-3 flex-1 flex flex-col rounded-sm shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                Ablauf-Sequenz (0-6)
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                Manuell anwählen
              </span>
            </div>

            <div className="space-y-1 overflow-y-auto flex-1">
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
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-[10px] font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                            {step.title}
                          </h4>
                        </div>
                        {isActive && (
                          <p className="text-[9px] text-slate-500 truncate mt-0.5">
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

      {/* Parameter Settings Modal / Drawer */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-sm p-6 max-w-xl w-full border border-slate-300 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-base">Ablauf-Parameter</h3>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Step 1: v1 and M1 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">1. Voranzug v1 (RPM)</label>
                <input 
                  type="number"
                  value={editCfg.step1_speedRpm}
                  onChange={(e) => setEditCfg({ ...editCfg, step1_speedRpm: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">1. Vorlast M1 (Nm)</label>
                <input 
                  type="number"
                  step="0.5"
                  value={editCfg.step1_targetNm}
                  onChange={(e) => setEditCfg({ ...editCfg, step1_targetNm: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Step 2: Dwell 1 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">2. Beruhigungszeit t1 (s)</label>
                <input 
                  type="number"
                  step="0.5"
                  value={editCfg.step2_dwellSeconds}
                  onChange={(e) => setEditCfg({ ...editCfg, step2_dwellSeconds: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Step 3: v2 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">3. Prüfgeschwindigkeit v2 (RPM)</label>
                <input 
                  type="number"
                  value={editCfg.step3_speedRpm}
                  onChange={(e) => setEditCfg({ ...editCfg, step3_speedRpm: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Step 5: Dwell 2 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">5. Entlastungszeit t2 (s)</label>
                <input 
                  type="number"
                  step="0.5"
                  value={editCfg.step5_dwellSeconds}
                  onChange={(e) => setEditCfg({ ...editCfg, step5_dwellSeconds: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Step 6: Home Speed */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">6. Home-Rücklauf v_home (RPM)</label>
                <input 
                  type="number"
                  value={editCfg.step6_homeSpeedRpm}
                  onChange={(e) => setEditCfg({ ...editCfg, step6_homeSpeedRpm: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Part Number & Serial */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Prüfling Sachnummer</label>
                <input 
                  type="text"
                  value={editCfg.partNumber}
                  onChange={(e) => setEditCfg({ ...editCfg, partNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Seriennummer (Prüflauf)</label>
                <input 
                  type="text"
                  value={editCfg.serialNumber}
                  onChange={(e) => setEditCfg({ ...editCfg, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Checkbox for DI X6 */}
            <div className="flex items-center space-x-2.5 p-3 bg-slate-50 border border-slate-300 rounded-sm">
              <input 
                type="checkbox"
                id="diX6Req"
                checked={editCfg.step6_requireDIX6}
                onChange={(e) => setEditCfg({ ...editCfg, step6_requireDIX6: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
              <label htmlFor="diX6Req" className="text-xs font-bold text-slate-700 cursor-pointer">
                Schritt 6 erfordert Hardware-Eingang DI X6 (Home-Fahrt)
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-sm text-xs font-bold cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  updateSequenceConfig(editCfg);
                  setShowConfigModal(false);
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-sm text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Parameter Übernehmen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raspberry Pi 5 & Waveshare 10.1" Hardware Daemon Modal */}
      {showRPiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-sm p-6 max-w-2xl w-full border border-slate-300 shadow-sm space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-base">Raspberry Pi 5 Setup</h3>
              </div>
              <button 
                onClick={() => setShowRPiModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <p className="font-medium text-slate-800">
                Diese Benutzeroberfläche ist nativ für die Auflösung <strong>1280x800 (16:10 IPS)</strong> des Waveshare Touchscreens am Raspberry Pi 5 optimiert.
              </p>

              <div className="bg-slate-900 p-4 rounded-sm font-mono text-[11px] space-y-2 overflow-x-auto text-slate-300">
                <p className="text-slate-500"># 1. Kiosk-Modus Autostart in /etc/xdg/labwc/autostart oder ~/.config/wayfire.ini:</p>
                <p className="text-emerald-400">chromium-browser --kiosk --app=http://localhost:3000 --noerrdialogs --disable-infobars</p>
                <p className="text-slate-500 pt-2"># 2. Waveshare 10.1" Display & Touch Overlay in /boot/firmware/config.txt:</p>
                <p>dtoverlay=vc4-kms-v3d</p>
                <p>max_framebuffers=2</p>
                <p>hdmi_group=2</p>
                <p>hdmi_mode=87</p>
                <p>hdmi_cvt 1280 800 60 6 0 0 0</p>
              </div>

              <div className="border border-slate-300 rounded-sm p-4 bg-slate-50 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-2">GPIO Pinbelegung (Norma Ablauf):</h4>
                <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-slate-700">
                  <div><strong>GPIO 17 (Pin 11):</strong> Eingang X5 Start-Taster</div>
                  <div><strong>GPIO 27 (Pin 13):</strong> Eingang DI X6 Referenz-Sensor</div>
                  <div><strong>GPIO 22 (Pin 15):</strong> Ausgang X7 Lüfter-Relais (24V)</div>
                  <div><strong>GPIO 23 (Pin 16):</strong> Ausgang X3 Status-LED (Grün)</div>
                  <div className="pt-2 border-t border-slate-200 mt-1 col-span-2 grid grid-cols-2 gap-3">
                    <div><strong>Ethernet / USB:</strong> Baumer CC50 (192.168.1.10:4840)</div>
                    <div><strong>RS485 / CAN:</strong> PSE Motor-Antriebssteuerung</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowRPiModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-sm text-xs font-bold cursor-pointer transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
