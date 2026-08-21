import React from 'react';
import { useTestBench, ProgramType } from '../context/TestBenchContext';
import { 
  Play, 
  Square, 
  RotateCw, 
  RotateCcw, 
  Home, 
  Zap, 
  Activity, 
  Gauge, 
  ShieldCheck, 
  Settings2, 
  CheckCircle2, 
  Compass
} from 'lucide-react';

export default function MotorControl() {
  const {
    x3Status,
    x5Status,
    activeProgram,
    motorPosition,
    motorRevolutions,
    motorSpeedRpm,
    homeStatus,
    toggleX3,
    triggerX5,
    selectProgram,
    moveToHome,
    jogMotorX5,
  } = useTestBench();

  const isX3Running = x3Status === 'running';
  const isX5Recording = x5Status === 'recording' || x5Status === 'triggering';

  const programs: { id: ProgramType; name: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'verdrehmoment',
      name: 'Verdrehmoment',
      desc: 'Standard-Prüfung der Torsionsfestigkeit mit kontinuierlichem Lastanstieg.',
      icon: <Activity className="w-5 h-5 text-indigo-600" />,
    },
    {
      id: 'anfahren',
      name: 'Anfahren',
      desc: 'Sanftes Anfahrprogramm mit Drehzahlrampe und Positionssynchronisation.',
      icon: <Play className="w-5 h-5 text-cyan-600" />,
    },
    {
      id: 'kalibrierung',
      name: 'Kalibrierung',
      desc: 'Referenzkalibrierung des Baumer CC50 Drehmomentaufnehmers.',
      icon: <Settings2 className="w-5 h-5 text-amber-600" />,
    },
    {
      id: 'service',
      name: 'Service-Programm',
      desc: 'Niedriggeschwindigkeits-Prüfung für Wartungs- und Inspektionsarbeiten.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Clean Motor Position & Homing Panel */}
      <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Motorposition & Antriebs-Achse</h4>
              <p className="text-xs text-slate-500">Live-Winkelüberwachung, Umdrehungszähler und Nullpunktfahrt (Homepos)</p>
            </div>
          </div>

          <button
            onClick={moveToHome}
            disabled={homeStatus === 'moving'}
            className="flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-sm text-xs font-bold transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
            {homeStatus === 'moving' ? 'Fährt Homepos an...' : 'Home-Position anfahren (0.0°)'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          {/* Position Dial */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-sm border border-slate-200/70">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
              <div 
                className="absolute inset-1.5 rounded-full border-2 border-indigo-600 border-t-transparent transition-transform duration-200"
                style={{ transform: `rotate(${motorPosition}deg)` }}
              />
              <div className="text-center z-10">
                <span className="text-2xl font-bold text-slate-900 tracking-tight block font-mono">
                  {motorPosition.toFixed(1)}°
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Winkel</span>
              </div>
            </div>
          </div>

          {/* Telemetry Numbers */}
          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 rounded-sm border border-slate-200/60 flex items-center justify-between">
              <span className="text-xs text-slate-500">Umdrehungen:</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{motorRevolutions} U</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-sm border border-slate-200/60 flex items-center justify-between">
              <span className="text-xs text-slate-500">Drehzahl:</span>
              <span className="text-sm font-bold text-indigo-600 font-mono">{isX3Running ? motorSpeedRpm : 0} RPM</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-sm border border-slate-200/60 flex items-center justify-between">
              <span className="text-xs text-slate-500">Status:</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {homeStatus === 'homed' ? 'Referenziert' : 'Fahrt aktiv'}
              </span>
            </div>
          </div>

          {/* Jog Buttons */}
          <div className="p-4 bg-slate-50 rounded-sm border border-slate-200/60 flex flex-col justify-between h-full">
            <div>
              <h5 className="text-xs font-bold text-slate-900 mb-0.5">X5 Manueller Schritt (Jog)</h5>
              <p className="text-[11px] text-slate-500">Impulsweises Drehen in 15°-Schritten</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => jogMotorX5('backward')}
                className="flex items-center justify-center px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-400" />
                -15°
              </button>
              <button
                onClick={() => jogMotorX5('forward')}
                className="flex items-center justify-center px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 mr-1 text-slate-400" />
                +15°
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Program Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Prüfprogramm auswählen</h4>
            <p className="text-xs text-slate-500">Wählen Sie den gewünschten Ablauf für den Testlauf</p>
          </div>
          <span className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            Aktiv: {activeProgram.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {programs.map(prog => {
            const isSelected = activeProgram === prog.id;
            return (
              <div
                key={prog.id}
                onClick={() => selectProgram(prog.id)}
                className={`p-4 rounded-sm border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-slate-50">
                      {prog.icon}
                    </div>
                    {isSelected && (
                      <span className="flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Aktiv
                      </span>
                    )}
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm mb-0.5">{prog.name}</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{prog.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">{prog.id}</span>
                  <span className={`font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {isSelected ? 'Ausgewählt' : 'Wählen →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
