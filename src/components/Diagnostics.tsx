import React from 'react';
import { useTestBench } from '../context/TestBenchContext';
import { CheckCircle2, AlertCircle, Zap, Play, Trash2 } from 'lucide-react';

export default function Diagnostics() {
  const { logs, clearLogs } = useTestBench();

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            Ereignis- & Diagnoseprotokoll
            <span className="ml-2.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {logs.length} Einträge
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Echtzeit-Aufzeichnung aller Steuerbefehle (X3 Main Start, X5 Trigger, OPC UA Bus-Status und Fehler)
          </p>
        </div>

        <button
          onClick={clearLogs}
          className="flex items-center px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-sm text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
          Protokoll leeren
        </button>
      </div>

      {/* Main Log Table */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[560px]">
        {/* Table Header */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-5 py-3 flex items-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="w-24">Zeit</div>
          <div className="w-28">Kategorie</div>
          <div className="w-28">Status</div>
          <div className="flex-1">Meldung / Parameter</div>
        </div>

        {/* Log Entries List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 font-sans">
              <CheckCircle2 className="w-8 h-8 mb-2 text-slate-300" />
              <p>Keine Diagnose-Ereignisse protokolliert.</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="px-5 py-2.5 flex items-center hover:bg-slate-50/80 transition-colors">
                <div className="w-24 text-slate-400 font-sans">{log.timestamp}</div>
                
                {/* Category Tag */}
                <div className="w-28">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 font-sans">
                    {log.tag || 'SYSTEM'}
                  </span>
                </div>

                {/* Level / Status Badge */}
                <div className="w-28 flex items-center font-sans">
                  {log.level === 'x3' && (
                    <span className="flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                      <Play className="w-2.5 h-2.5 mr-1 fill-current" /> X3 Main
                    </span>
                  )}
                  {log.level === 'x5' && (
                    <span className="flex items-center text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                      <Zap className="w-2.5 h-2.5 mr-1 fill-current" /> X5 Trigger
                    </span>
                  )}
                  {log.level === 'info' && (
                    <span className="flex items-center text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[11px] font-medium">
                      Info
                    </span>
                  )}
                  {log.level === 'warning' && (
                    <span className="flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                      <AlertCircle className="w-3 h-3 mr-1" /> Warnung
                    </span>
                  )}
                  {log.level === 'error' && (
                    <span className="flex items-center text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                      <AlertCircle className="w-3 h-3 mr-1" /> Fehler
                    </span>
                  )}
                </div>

                {/* Message */}
                <div className="flex-1 text-slate-700 font-sans">
                  {log.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
