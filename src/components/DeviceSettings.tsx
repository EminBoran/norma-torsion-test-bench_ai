import React, { useState, useEffect } from 'react';
import { useTestBench } from '../context/TestBenchContext';
import { 
  Zap, 
  Cpu, 
  ShieldCheck, 
  Radio, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Settings, 
  RotateCw,
  Power,
  Layers,
  Wrench,
  FileCode,
  Terminal,
  Cloud,
  Database,
  Thermometer,
  Compass,
  Save,
  Check,
  RotateCcw
} from 'lucide-react';
import ServiceMenu from './ServiceMenu';
import Diagnostics from './Diagnostics';
import MotorControl from './MotorControl';
import TorqueCalibration from './TorqueCalibration';
import EnvironmentHistory from './EnvironmentHistory';

export type SettingsSubTab = 'ablauf' | 'motor' | 'torque' | 'klima' | 'ports' | 'service' | 'diagnose' | 'rpi' | 'opcua';

interface DeviceSettingsProps {
  initialSubTab?: SettingsSubTab;
}

export default function DeviceSettings({ initialSubTab = 'ablauf' }: DeviceSettingsProps) {
  const { 
    ports, 
    togglePortState, 
    x3Status, 
    x5Status,
    sequenceConfig,
    updateSequenceConfig
  } = useTestBench();
  
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialSubTab);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editCfg, setEditCfg] = useState(sequenceConfig);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    setEditCfg(sequenceConfig);
  }, [sequenceConfig]);

  const totalPower = ports.reduce((acc, p) => acc + (p.status === 'active' ? p.power : 0), 0);
  const activeCount = ports.filter(p => p.status === 'active').length;

  const handleSaveConfig = () => {
    updateSequenceConfig(editCfg);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleApplyPreset = (type: 'standard' | 'fast' | 'heavy' | 'gentle') => {
    let preset: Partial<typeof sequenceConfig> = {};
    if (type === 'standard') {
      preset = {
        step1_speedRpm: 2.0,
        step1_targetNm: 2.0,
        step2_dwellSeconds: 2.0,
        step3_speedRpm: 5.0,
        step3_breakDropPercent: 30,
        step3_maxAngle: 360,
        step5_dwellSeconds: 2.0,
        step6_homeSpeedRpm: 10.0,
        step6_requireDIX6: true,
        partNumber: 'NT-50-A2',
        serialNumber: 'SN-' + Math.floor(1000 + Math.random() * 9000)
      };
    } else if (type === 'fast') {
      preset = {
        step1_speedRpm: 4.0,
        step1_targetNm: 2.0,
        step2_dwellSeconds: 1.0,
        step3_speedRpm: 10.0,
        step3_breakDropPercent: 25,
        step3_maxAngle: 360,
        step5_dwellSeconds: 1.0,
        step6_homeSpeedRpm: 15.0,
        step6_requireDIX6: false,
        partNumber: 'NT-50-FAST',
        serialNumber: 'SN-F' + Math.floor(1000 + Math.random() * 9000)
      };
    } else if (type === 'heavy') {
      preset = {
        step1_speedRpm: 1.5,
        step1_targetNm: 5.0,
        step2_dwellSeconds: 3.0,
        step3_speedRpm: 3.0,
        step3_breakDropPercent: 35,
        step3_maxAngle: 450,
        step5_dwellSeconds: 3.0,
        step6_homeSpeedRpm: 8.0,
        step6_requireDIX6: true,
        partNumber: 'NT-75-HD',
        serialNumber: 'SN-H' + Math.floor(1000 + Math.random() * 9000)
      };
    } else if (type === 'gentle') {
      preset = {
        step1_speedRpm: 1.0,
        step1_targetNm: 1.0,
        step2_dwellSeconds: 2.5,
        step3_speedRpm: 2.0,
        step3_breakDropPercent: 20,
        step3_maxAngle: 270,
        step5_dwellSeconds: 2.5,
        step6_homeSpeedRpm: 5.0,
        step6_requireDIX6: true,
        partNumber: 'NT-30-FINE',
        serialNumber: 'SN-G' + Math.floor(1000 + Math.random() * 9000)
      };
    }
    const updated = { ...editCfg, ...preset };
    setEditCfg(updated);
    updateSequenceConfig(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with Categorized Sub-tabs */}
      <div className="bg-white border border-slate-300 rounded-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center">
              Erweiterte Systemeinstellungen & Konfiguration
              <Settings className="w-4 h-4 ml-2 text-indigo-600" />
            </h3>
            <p className="text-xs text-slate-500">
              Alle Detailparameter, Achskonfigurationen, Kalibrierwerte und Hardware-Schnittstellen an einem zentralen Ort
            </p>
          </div>
          {saveSuccess && (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-sm animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Einstellungen gespeichert!</span>
            </div>
          )}
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-sm overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('ablauf')}
            className={`px-3 py-2 rounded-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'ablauf'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Ablauf- & Sequenz-Parameter</span>
          </button>

          <button
            onClick={() => setActiveSubTab('motor')}
            className={`px-3 py-2 rounded-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'motor'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Motor & Achse (PSE)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('torque')}
            className={`px-3 py-2 rounded-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'torque'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-600" />
            <span>Drehmoment & CC50 Sensor</span>
          </button>

          <button
            onClick={() => setActiveSubTab('klima')}
            className={`px-3 py-2 rounded-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'klima'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-amber-600" />
            <span>Klima & Umgebungsverlauf</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ports')}
            className={`px-3 py-2 rounded-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'ports'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hardware Ports (X0-X7)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('service')}
            className={`px-3 py-2 rounded-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'service'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-slate-700" />
            <span>Service & SQL-Variablen</span>
          </button>

          <button
            onClick={() => setActiveSubTab('diagnose')}
            className={`px-3 py-2 rounded-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'diagnose'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-slate-700" />
            <span>Diagnose & Logs</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rpi')}
            className={`px-3 py-2 rounded-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'rpi'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-slate-700" />
            <span>RPi 5 & Kiosk</span>
          </button>
        </div>
      </div>

      {/* SubTab 1: Ablauf- & Sequenz-Parameter */}
      {activeSubTab === 'ablauf' && (
        <div className="space-y-6">
          {/* Presets Bar */}
          <div className="bg-white border border-slate-300 p-4 rounded-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                  Prüfprogramm-Vorlagen (Presets)
                </span>
                <span className="text-xs text-slate-500">
                  Schnellkonfiguration für Standard- und Sonderprüfungen laden
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleApplyPreset('standard')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-sm text-xs font-bold cursor-pointer"
                >
                  Standard Torsion (2.0 Nm / 5 RPM)
                </button>
                <button
                  onClick={() => handleApplyPreset('fast')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-sm text-xs font-bold cursor-pointer"
                >
                  Schnelltest (10 RPM)
                </button>
                <button
                  onClick={() => handleApplyPreset('heavy')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-sm text-xs font-bold cursor-pointer"
                >
                  Heavy Duty (5.0 Nm Vorlast)
                </button>
                <button
                  onClick={() => handleApplyPreset('gentle')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-sm text-xs font-bold cursor-pointer"
                >
                  Feinprüfung (1.0 Nm / 2 RPM)
                </button>
              </div>
            </div>
          </div>

          {/* Form Settings Grid */}
          <div className="bg-white border border-slate-300 p-6 rounded-sm space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Sequenzer Schritt-Parameter (Schritte 0 - 6)</h4>
                <p className="text-xs text-slate-500">Präzise Vorgaben für Drehzahlen, Vorlast, Haltezeiten und Abbruchkriterien</p>
              </div>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Parameter Speichern</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1: Voranzug */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-bold text-slate-800">Schritt 1: X5 Voranzug</span>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 border border-blue-200">Hold</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">Voranzug-Drehzahl v1 (RPM)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editCfg.step1_speedRpm}
                    onChange={(e) => setEditCfg({ ...editCfg, step1_speedRpm: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">Vorlast-Ziel M1 (Nm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editCfg.step1_targetNm}
                    onChange={(e) => setEditCfg({ ...editCfg, step1_targetNm: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Step 2: Beruhigungszeit */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-bold text-slate-800">Schritt 2: Beruhigungszeit</span>
                  <span className="text-[10px] font-mono text-slate-700 bg-slate-200 px-1.5 py-0.5">Dwell 1</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">Wartezeit t1 (Sekunden)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editCfg.step2_dwellSeconds}
                    onChange={(e) => setEditCfg({ ...editCfg, step2_dwellSeconds: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 pt-2">
                  Ermöglicht mechanische Relaxation des Prüflings vor dem eigentlichen Hauptlast-Anstieg.
                </p>
              </div>

              {/* Step 3: Prüfdrehzahl & Bruch */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-bold text-slate-800">Schritt 3: Torsion bis Bruch</span>
                  <span className="text-[10px] font-mono text-red-700 bg-red-50 px-1.5 py-0.5 border border-red-200">Main Test</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">Prüfgeschwindigkeit v2 (RPM)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editCfg.step3_speedRpm}
                    onChange={(e) => setEditCfg({ ...editCfg, step3_speedRpm: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">Bruchabfall-Schwelle (%)</label>
                  <input
                    type="number"
                    value={editCfg.step3_breakDropPercent}
                    onChange={(e) => setEditCfg({ ...editCfg, step3_breakDropPercent: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Step 5: Entlastungszeit */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-bold text-slate-800">Schritt 5: Entlastungszeit</span>
                  <span className="text-[10px] font-mono text-slate-700 bg-slate-200 px-1.5 py-0.5">Dwell 2</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">Wartezeit t2 (Sekunden)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editCfg.step5_dwellSeconds}
                    onChange={(e) => setEditCfg({ ...editCfg, step5_dwellSeconds: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 pt-2">
                  Dauer vor dem automatischen Rücklauf zur Vermeidung von Rückschlagkräften.
                </p>
              </div>

              {/* Step 6: Home Speed & DI X6 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-bold text-slate-800">Schritt 6: Referenzfahrt (Home)</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">0.0°</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">Rücklauf-Drehzahl v_home (RPM)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editCfg.step6_homeSpeedRpm}
                    onChange={(e) => setEditCfg({ ...editCfg, step6_homeSpeedRpm: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="pt-2 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dix6Check"
                    checked={editCfg.step6_requireDIX6}
                    onChange={(e) => setEditCfg({ ...editCfg, step6_requireDIX6: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="dix6Check" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Erfordert Hardware-Signal DI X6
                  </label>
                </div>
              </div>

              {/* Prüflings-Stammdaten */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-bold text-slate-800">Prüflings-Stammdaten</span>
                  <span className="text-[10px] font-mono text-slate-700 bg-slate-200 px-1.5 py-0.5">Part / Charge</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">Sachnummer (Part Number)</label>
                  <input
                    type="text"
                    value={editCfg.partNumber}
                    onChange={(e) => setEditCfg({ ...editCfg, partNumber: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 block">Seriennummer (Prüflauf)</label>
                  <input
                    type="text"
                    value={editCfg.serialNumber}
                    onChange={(e) => setEditCfg({ ...editCfg, serialNumber: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={handleSaveConfig}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold flex items-center space-x-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Konfiguration in Steuerung übernehmen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Motor & Achse PSE */}
      {activeSubTab === 'motor' && (
        <div className="space-y-6">
          <MotorControl />
        </div>
      )}

      {/* SubTab 3: Drehmoment & Sensorik (CC50) */}
      {activeSubTab === 'torque' && (
        <div className="space-y-6">
          <TorqueCalibration />
        </div>
      )}

      {/* SubTab 4: Klima & Umgebungsverlauf */}
      {activeSubTab === 'klima' && (
        <div className="space-y-6">
          <EnvironmentHistory />
        </div>
      )}

      {/* SubTab 5: Hardware Ports X0 to X7 Overview */}
      {activeSubTab === 'ports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block">Aktive Schnittstellen</span>
                <span className="text-2xl font-bold text-slate-900">{activeCount} / 8 Ports</span>
              </div>
              <div className="w-10 h-10 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block">Gesamt-Leistungsaufnahme</span>
                <span className="text-2xl font-bold text-indigo-600">{totalPower.toFixed(1)} W</span>
              </div>
              <div className="w-10 h-10 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block">X3 Start-Button Zustand</span>
                <span className="text-sm font-bold text-slate-900 capitalize">
                  {x3Status === 'running' ? 'Aktiv (Grün)' : x3Status === 'starting' ? 'Startet (Gelb)' : 'Bereit (Grau)'}
                </span>
              </div>
              <div className={`w-10 h-10 rounded-sm flex items-center justify-center font-bold text-xs ${
                x3Status === 'running' 
                  ? 'bg-emerald-500 text-white' 
                  : x3Status === 'starting' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-slate-500 text-white'
              }`}>
                X3
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ports.map((port) => {
              const isActive = port.status === 'active';
              return (
                <div 
                  key={port.id}
                  className={`p-4 rounded-sm border transition-all flex flex-col justify-between ${
                    isActive 
                      ? 'bg-white border-slate-200 shadow-xs' 
                      : 'bg-slate-50/70 border-slate-200/60 opacity-75'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 rounded-md text-slate-700">
                        {port.id}
                      </span>
                      <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isActive ? 'Aktiv' : 'Standby'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {port.device}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {port.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Spannung:</span>
                      <span className="font-bold text-slate-800">{port.voltage.toFixed(2)} V</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Strom:</span>
                      <span className="font-bold text-indigo-600">{port.current.toFixed(2)} A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Leistung:</span>
                      <span className="font-bold text-slate-800">{port.power.toFixed(1)} W</span>
                    </div>

                    <button
                      onClick={() => togglePortState(port.id)}
                      className={`w-full mt-2 py-1.5 rounded-sm text-[11px] font-bold cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {isActive ? 'Port deaktivieren' : 'Port aktivieren'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 6: Service Menu with Variables */}
      {activeSubTab === 'service' && (
        <ServiceMenu />
      )}

      {/* SubTab 7: Diagnostics with live logs */}
      {activeSubTab === 'diagnose' && (
        <Diagnostics />
      )}

      {/* SubTab 8: Raspberry Pi GPIO & Kiosk info */}
      {activeSubTab === 'rpi' && (
        <div className="space-y-6 max-w-4xl">
          {/* Main Card: Automated 1-Script Installer */}
          <div className="bg-white rounded-sm p-6 border border-slate-300 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Raspberry Pi 5 Schnell-Installation (1-Befehl Setup)</h3>
              </div>
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold rounded-sm">
                Debian 12 / Raspberry Pi OS
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Führen Sie auf Ihrem frisch installierten Raspberry Pi 5 im Terminal einfach den folgenden Installationsbefehl aus. 
              Das Skript installiert <strong>Node.js LTS</strong>, alle Build-Tools, richtet die Datenbank ein, kompiliert die Anwendung, 
              erstellt einen <strong>systemd Autostart-Hintergrunddienst</strong> und konfiguriert den <strong>Chromium Kiosk-Modus</strong> für den Waveshare 10.1" Touchscreen.
            </p>

            <div className="bg-slate-900 rounded-sm p-4 text-slate-200 font-mono text-xs space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5 text-[11px]">
                <span>Option A: Automatisches 1-Befehl Installationsskript (im Terminal ausführen):</span>
              </div>
              <div className="text-emerald-400 select-all p-2 bg-slate-950 rounded-sm border border-slate-800 font-bold overflow-x-auto">
                curl -fsSL https://raw.githubusercontent.com/norma-torsion/applet/main/install_pi5.sh -o install_pi5.sh || chmod +x install_pi5.sh && bash install_pi5.sh
              </div>
            </div>

            {/* Manual Step-by-Step commands */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Option B: Schritt-für-Schritt Terminal-Befehle
              </h4>
              <div className="bg-slate-900 p-4 rounded-sm font-mono text-xs space-y-2.5 text-slate-300">
                <div>
                  <span className="text-slate-500 block"># 1. System updaten und Node.js 20 LTS installieren:</span>
                  <span className="text-emerald-400">sudo apt update && sudo apt install -y curl git build-essential sqlite3 chromium-browser</span>
                  <br />
                  <span className="text-emerald-400">curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -</span>
                  <br />
                  <span className="text-emerald-400">sudo apt install -y nodejs</span>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-500 block"># 2. Projektverzeichnis anlegen und Dateien einspielen (oder ZIP entpacken):</span>
                  <span className="text-emerald-400">mkdir -p ~/norma-pruefstand && cd ~/norma-pruefstand</span>
                  <br />
                  <span className="text-slate-400"># (Entpacken Sie hier die heruntergeladene Projekt-ZIP oder klonen Sie Ihr Repo)</span>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-500 block"># 3. NPM Abhängigkeiten installieren und Build erstellen:</span>
                  <span className="text-emerald-400">npm install</span>
                  <br />
                  <span className="text-emerald-400">npm run build</span>
                  <br />
                  <span className="text-emerald-400">npm start</span>
                </div>
              </div>
            </div>
          </div>

          {/* Autostart & Service Management */}
          <div className="bg-white rounded-sm p-6 border border-slate-300 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
              Autostart & Dienst-Steuerung (systemd)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
                <span className="font-bold text-slate-700 block">Status prüfen:</span>
                <span className="text-indigo-700 select-all font-bold">sudo systemctl status norma-pruefstand</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
                <span className="font-bold text-slate-700 block">Live-Logs (OPC UA / SQL):</span>
                <span className="text-indigo-700 select-all font-bold">journalctl -u norma-pruefstand -f</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
                <span className="font-bold text-slate-700 block">Dienst neustarten:</span>
                <span className="text-indigo-700 select-all font-bold">sudo systemctl restart norma-pruefstand</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
                <span className="font-bold text-slate-700 block">Dienst stoppen:</span>
                <span className="text-indigo-700 select-all font-bold">sudo systemctl stop norma-pruefstand</span>
              </div>
            </div>
          </div>

          {/* Waveshare Display & GPIO Pinout */}
          <div className="bg-white rounded-sm p-6 border border-slate-300 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
              Waveshare 10.1" IPS Touchscreen & GPIO Belegung
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-700">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm">
                <strong>GPIO 17 (Pin 11):</strong> Eingang X5 Start-Taster (Pull-Down)
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm">
                <strong>GPIO 27 (Pin 13):</strong> Eingang DI X6 Referenz-Sensor (0.0°)
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm">
                <strong>GPIO 22 (Pin 15):</strong> Ausgang X7 Lüfter-Relais (24V)
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm">
                <strong>GPIO 23 (Pin 16):</strong> Ausgang LED Status (Grün)
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm">
                <strong>Ethernet (RJ45):</strong> Baumer CC50 (192.168.1.10:4840)
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm">
                <strong>RS485 / CAN / USB:</strong> PSE Motor-Antriebssteuerung
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
