import React, { useState } from 'react';
import { 
  Activity, 
  Thermometer, 
  Settings, 
  ShieldAlert, 
  Cpu, 
  Play, 
  Square, 
  Zap, 
  RotateCw, 
  Wrench,
  Radio,
  Gauge,
  Compass,
  Database,
  FileText,
  BookOpen,
  Layers,
  Touchpad,
  Menu
} from 'lucide-react';
import { cn } from './lib/utils';
import { TestBenchProvider, useTestBench } from './context/TestBenchContext';
import DeviceSettings from './components/DeviceSettings';
import TestDatabase from './components/TestDatabase';
import ReportGenerator from './components/ReportGenerator';
import DocumentationWiki from './components/DocumentationWiki';
import TouchscreenAblauf from './components/TouchscreenAblauf';

type Tab = 'dashboard' | 'datenbank' | 'report' | 'doku' | 'einstellungen';

const tabTitles: Record<Tab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Live-Monitoring & Sequenzsteuerung' },
  datenbank: { title: 'Messdatenbank', subtitle: 'Archivierte Prüfberichte und Rohdaten' },
  report: { title: 'Prüfbericht', subtitle: 'Berichtserstellung und PDF-Export' },
  doku: { title: 'Dokumentation', subtitle: 'Anlagen-Wiki und Schnittstellenbeschreibungen' },
  einstellungen: { title: 'Einstellungen', subtitle: 'Systemkonfiguration und Kalibrierung' }
};

function NavItem({ active, onClick, icon, label, badge, badgeColor }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: string, badgeColor?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors border-l-2 cursor-pointer",
        active 
          ? "bg-slate-100 text-slate-900 border-slate-900" 
          : "text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge && (
        <span className={cn("px-2 py-0.5 text-[10px] font-mono rounded-sm", badgeColor || "bg-slate-200 text-slate-700")}>
          {badge}
        </span>
      )}
    </button>
  );
}

function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [settingsSubTab, setSettingsSubTab] = useState<'ablauf' | 'motor' | 'torque' | 'klima' | 'ports' | 'service' | 'diagnose' | 'rpi'>('ablauf');
  const [isNavOpen, setIsNavOpen] = useState(true);
  const { 
    x3Status, 
    x5Status, 
    motorPosition, 
    liveTorque, 
    temperature, 
    records,
    sequenceState,
    setSelectedRecordId,
    toggleX3, 
    triggerX5,
    opcUaConnected
  } = useTestBench();

  const isX3Running = x3Status === 'running';
  const isX3Starting = x3Status === 'starting';
  const isX3Stopping = x3Status === 'stopping';
  const isX5Recording = x5Status === 'recording' || x5Status === 'triggering';

  // Navigate to report with specific record
  const handleSelectForReport = (id: string) => {
    setSelectedRecordId(id);
    setActiveTab('report');
  };

  // Predefined exact color classes for X3
  const getX3ButtonStyles = () => {
    if (isX3Starting) {
      return 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'; // Amber for starting
    }
    if (isX3Running) {
      return 'bg-rose-600 hover:bg-rose-700 text-white'; // Red for Stop action
    }
    if (isX3Stopping) {
      return 'bg-slate-700 text-white';
    }
    return 'bg-emerald-600 hover:bg-emerald-700 text-white'; // Green for Start action
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-slate-200">
      {/* Restrained, Clean Light Sidebar */}
      <aside className={cn(
        "bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300",
        isNavOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
      )}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
              NT
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-900 uppercase">Norma Torsion</h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Test Bench CC50</p>
            </div>
          </div>
        </div>
        
        {/* Navigation List */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<Layers className="w-4 h-4" />} 
            label="Dashboard" 
            badge={sequenceState.isRunning ? `RUN` : undefined}
            badgeColor={sequenceState.isRunning ? 'bg-blue-100 text-blue-800' : undefined}
          />
          <NavItem 
            active={activeTab === 'datenbank'} 
            onClick={() => setActiveTab('datenbank')} 
            icon={<Database className="w-4 h-4" />} 
            label="Messdatenbank" 
            badge={records.length.toString()}
            badgeColor="bg-slate-100 text-slate-700"
          />
          <NavItem 
            active={activeTab === 'report'} 
            onClick={() => setActiveTab('report')} 
            icon={<FileText className="w-4 h-4" />} 
            label="Prüfbericht" 
          />
          <NavItem 
            active={activeTab === 'doku'} 
            onClick={() => setActiveTab('doku')} 
            icon={<BookOpen className="w-4 h-4" />} 
            label="Dokumentation" 
          />
          <NavItem 
            active={activeTab === 'einstellungen'} 
            onClick={() => setActiveTab('einstellungen')} 
            icon={<Settings className="w-4 h-4" />} 
            label="Einstellungen" 
          />
        </nav>

        {/* Sidebar Footer: Hardware Status */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center">
              <Radio className={`w-3.5 h-3.5 mr-1.5 ${opcUaConnected ? 'text-emerald-600' : 'text-red-500'}`} />
              OPC UA Bus:
            </span>
            <span className={`${opcUaConnected ? 'text-emerald-700' : 'text-red-700'} font-semibold flex items-center`}>
              <span className={`w-2 h-2 rounded-full mr-1.5 ${opcUaConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {opcUaConnected ? 'Verbunden' : 'Getrennt'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center">
              <Cpu className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Baumer CC50:
            </span>
            <span className={`font-mono font-medium ${opcUaConnected ? 'text-slate-700' : 'text-slate-400'}`}>
              {opcUaConnected ? 'Bereit' : 'Wartet...'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Clean Light Header Bar with X3 & X5 predefined colors */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-10 print:hidden">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {tabTitles[activeTab].title}
              </h2>
              <p className="text-xs text-slate-500">
                {tabTitles[activeTab].subtitle}
              </p>
            </div>
          </div>

          {/* Quick-Action Command Hub in Header */}
          <div className="flex items-center space-x-3">
            {/* Live Telemetry Mini Pills */}
            <div className="hidden xl:flex items-center space-x-2 bg-slate-100/70 p-1 rounded-sm text-xs">
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

            {/* X5 Intelligent Trigger Button */}
            <button
              onClick={triggerX5}
              disabled={!isX3Running}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-sm text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isX5Recording
                  ? 'bg-cyan-600 text-white animate-pulse'
                  : isX3Running
                  ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isX5Recording ? 'fill-current' : ''}`} />
              <span>{isX5Recording ? 'X5 Läuft...' : 'X5 Trigger'}</span>
            </button>

            {/* X3 Main Start Button with explicit color states */}
            <button
              onClick={toggleX3}
              className={`flex items-center space-x-2 px-4 py-2 rounded-sm text-xs font-bold transition-all shadow-xs cursor-pointer ${getX3ButtonStyles()}`}
            >
              {isX3Running ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>X3 Stopp</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isX3Starting ? 'X3 Startet...' : 'X3 Start'}</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Clean Light Main Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
          {activeTab === 'dashboard' && (
            <TouchscreenAblauf 
              onNavigateToSettings={(subTab) => {
                if (subTab) setSettingsSubTab(subTab);
                setActiveTab('einstellungen');
              }} 
            />
          )}
          {activeTab === 'datenbank' && <TestDatabase onSelectForReport={handleSelectForReport} />}
          {activeTab === 'report' && <ReportGenerator />}
          {activeTab === 'doku' && <DocumentationWiki />}
          {activeTab === 'einstellungen' && (
            <DeviceSettings initialSubTab={settingsSubTab} />
          )}
        </main>
      </div>
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
