import React, { useState } from 'react';
import { TestBenchProvider, useTestBench } from './context/TestBenchContext';
import TouchscreenAblauf from './components/TouchscreenAblauf';
import DeviceSettings from './components/DeviceSettings';
import { Settings, X, Activity, Cpu, Compass } from 'lucide-react';
import { cn } from './lib/utils';

function DashboardLayout() {
  const [showSettings, setShowSettings] = useState(false);
  const { opcUaConnected, liveTorque, motorPosition, sequenceState } = useTestBench();

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-10 print:hidden">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center text-white font-bold text-xs">
            NT
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Norma Torsion Prüfstand</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">Live Dashboard</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-slate-100/70 p-1 rounded-sm text-xs">
            <div className="flex items-center px-2.5 py-1 rounded-lg bg-white shadow-xs border border-slate-200/60">
              <Compass className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span className="text-slate-500 mr-1">Winkel:</span>
              <strong className="text-slate-800 font-mono">{motorPosition.toFixed(1)}°</strong>
            </div>
            <div className="flex items-center px-2.5 py-1 rounded-lg bg-white shadow-xs border border-slate-200/60">
              <Activity className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              <span className="text-slate-500 mr-1">Drehmoment:</span>
              <strong className="text-slate-800 font-mono">{liveTorque.toFixed(1)} Nm</strong>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <div className={cn("w-2 h-2 rounded-full", opcUaConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
            <span className="font-semibold text-slate-700">
              {opcUaConnected ? 'OPC-UA LIVE' : 'OPC-UA OFFLINE'}
            </span>
          </div>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50">
        <TouchscreenAblauf />
        
        {/* Settings Overlay Modal */}
        {showSettings && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 overflow-y-auto flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-full flex flex-col overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Prüfstand Einstellungen</h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-0">
                <DeviceSettings />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <TestBenchProvider>
      <DashboardLayout />
    </TestBenchProvider>
  );
}
