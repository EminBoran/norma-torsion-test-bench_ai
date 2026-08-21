import React, { useState } from 'react';
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
  Database
} from 'lucide-react';
import ServiceMenu from './ServiceMenu';
import Diagnostics from './Diagnostics';

export default function DeviceSettings() {
  const { ports, togglePortState, x3Status, x5Status } = useTestBench();
  const [activeSubTab, setActiveSubTab] = useState<'service' | 'diagnose' | 'ports' | 'opcua' | 'pse' | 'rpi' | 'ai'>('service');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const totalPower = ports.reduce((acc, p) => acc + (p.status === 'active' ? p.power : 0), 0);
  const activeCount = ports.filter(p => p.status === 'active').length;

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header with Sub-tabs for Einstellungen (Service & Diagnose integriert) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            System-Einstellungen & Wartung
            <Settings className="w-5 h-5 ml-2 text-indigo-600" />
          </h3>
          <p className="text-xs text-slate-500">
            Zentraler Bereich für Service-Menü, Diagnoseprotokoll, Hardware-Ports (X0-X7) und Bus-Konfiguration
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center space-x-1 bg-slate-200/70 p-1 rounded-sm overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('service')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'service'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Service & SQL-Variablen</span>
          </button>

          <button
            onClick={() => setActiveSubTab('diagnose')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'diagnose'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Diagnose & Logs</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'ports'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Hardware Ports (X0 - X7)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('opcua')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'opcua'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Baumer & OPC UA</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pse')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'pse'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>PSE-Parameter</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rpi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'rpi'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Raspberry Pi & GPIO</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('ai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'ai'
                ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-200'
                : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Google AI Studio</span>
          </button>
        </div>
      </div>

      {/* SubTab 1: Service Menu with Variables, IO-Link, Motor parameters & Actuators */}
      {activeSubTab === 'service' && (
        <ServiceMenu />
      )}

      {/* SubTab 2: Diagnostics with live logs */}
      {activeSubTab === 'diagnose' && (
        <Diagnostics />
      )}

      {/* SubTab: Raspberry Pi GPIO info */}
      {activeSubTab === 'rpi' && (
        <div className="bg-white rounded-sm p-6 max-w-3xl w-full border border-slate-300 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-base">Raspberry Pi 5 Setup</h3>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600">
            <p className="font-medium text-slate-800">
              Diese Benutzeroberfläche ist nativ für die Auflösung <strong>1280x800 (16:10 IPS)</strong> des Waveshare Touchscreens am Raspberry Pi 5 optimiert.
            </p>

            <div className="bg-slate-900 p-4 rounded-sm font-mono text-[11px] sm:text-xs space-y-2 overflow-x-auto text-slate-300">
              <p className="text-slate-500"># 1. Kiosk-Modus Autostart in /etc/xdg/labwc/autostart oder ~/.config/wayfire.ini:</p>
              <p className="text-emerald-400">chromium-browser --kiosk --app=http://localhost:3000 --noerrdialogs --disable-infobars</p>
              <p className="text-slate-500 pt-2"># 2. Waveshare 10.1" Display & Touch Overlay in /boot/firmware/config.txt:</p>
              <p>dtoverlay=vc4-kms-v3d</p>
              <p>max_framebuffers=2</p>
              <p>hdmi_group=2</p>
              <p>hdmi_mode=87</p>
              <p>hdmi_cvt 1280 800 60 6 0 0 0</p>
            </div>

            <div className="border border-slate-300 rounded-sm p-4 bg-slate-50 space-y-3 mt-4">
              <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">GPIO Pinbelegung (Norma Ablauf):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-700">
                <div><strong>GPIO 17 (Pin 11):</strong> Eingang X5 Start-Taster</div>
                <div><strong>GPIO 27 (Pin 13):</strong> Eingang DI X6 Referenz-Sensor</div>
                <div><strong>GPIO 22 (Pin 15):</strong> Ausgang X7 Lüfter-Relais (24V)</div>
                <div><strong>GPIO 23 (Pin 16):</strong> Ausgang LED Status (Grün)</div>
                <div><strong>GPIO 24 (Pin 18):</strong> Ausgang Antrieb Enable (24V)</div>
                <div><strong>GPIO 25 (Pin 22):</strong> Eingang Antrieb Ready</div>
                
                <div className="pt-2 border-t border-slate-200 mt-1 col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><strong>Ethernet / USB:</strong> Baumer CC50 (192.168.1.10:4840)</div>
                  <div><strong>RS485 / CAN:</strong> PSE Motor-Antriebssteuerung</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 3: Hardware Ports X0 to X7 Overview */}
      {activeSubTab === 'ports' && (
        <div className="space-y-6">
          {/* Summary Strip */}
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
                  {x3Status === 'running' ? 'Aktiv (Grün #16a34a)' : x3Status === 'starting' ? 'Startet (Gelb #d97706)' : 'Bereit (Grau #64748b)'}
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

          {/* Detailed Ports Grid */}
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

                  {/* Electrical Telemetry */}
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

      {/* SubTab 4: OPC UA & Baumer Settings */}
      {activeSubTab === 'opcua' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm">Baumer CC50 & OPC UA Server-Konfiguration</h4>
              <p className="text-xs text-slate-500">Knotenadressen, Endpoints und Abtastintervalle</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">OPC UA Endpoint URL</label>
                <input 
                  type="text" 
                  defaultValue="opc.tcp://192.168.1.10:4840" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Namespace Index</label>
                <input 
                  type="number" 
                  defaultValue={2} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Baumer Sensor Node-ID (Drehmoment)</label>
                <input 
                  type="text" 
                  defaultValue="ns=2;i=120" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Abtastrate (ms)</label>
                <input 
                  type="number" 
                  defaultValue={20} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Konfiguration an OPC UA Server senden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 5: PSE Motor Drive Settings */}
      {activeSubTab === 'pse' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm">PSE Antriebs-Regelung & Grenzwerte</h4>
              <p className="text-xs text-slate-500">Sicherheitsabschaltungen, Rampenzeiten und PID-Parameter</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Nennstrom (A)</label>
                <input 
                  type="number" 
                  defaultValue={4.8} 
                  step="0.1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-mono text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Spitzenstrom Limit (A)</label>
                <input 
                  type="number" 
                  defaultValue={12.5} 
                  step="0.5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-mono text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Abschaltgrenze Drehmoment (Nm)</label>
                <input 
                  type="number" 
                  defaultValue={100.0} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm font-mono text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                In PSE-EEPROM schreiben
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'ai' && (
        <div className="bg-white border border-slate-300 p-6 rounded-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
              <Cloud className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Google AI Studio API Integration</h3>
              <p className="text-sm text-slate-500">Verbindung zur Cloud-KI für smarte Datenanalyse und Mustererkennung (Gemini)</p>
            </div>
          </div>

          <div className="bg-slate-50 p-5 border border-slate-200 rounded-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-800">Cloud API ist verfügbar</span>
                </div>
                <p className="text-xs text-slate-500 max-w-xl">
                  Mit einem Klick verbinden Sie das Testsystem mit der Google AI Studio Cloud. 
                  Die KI analysiert anschließend Torsionskurven automatisch auf versteckte Anomalien, 
                  die mit herkömmlichen Grenzwerten schwer zu erkennen sind.
                </p>
              </div>
              <button 
                onClick={() => {
                  alert('Verbindung zur Google AI Studio Cloud wird initiiert...');
                }}
                className="whitespace-nowrap px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-bold shadow-md transition-colors cursor-pointer flex items-center gap-2"
              >
                <Cloud className="w-4 h-4" />
                Mit einem Klick verbinden
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-sm">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Features</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automatischer Prüfbericht (KI-generiert)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Erkennung von Materialermüdung</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Prädiktive Wartungsempfehlungen</li>
              </ul>
            </div>
            <div className="p-4 border border-slate-200 rounded-sm">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">API-Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Endpunkt</span>
                  <span className="font-mono text-slate-800">gemini-pro-latest</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Latenz</span>
                  <span className="font-mono text-emerald-600">~120ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sicherer Tunnel</span>
                  <span className="font-mono text-emerald-600">Aktiv (TLS 1.3)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
