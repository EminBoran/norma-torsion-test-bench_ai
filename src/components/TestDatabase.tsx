import React, { useState } from 'react';
import { useTestBench, TestRecord } from '../context/TestBenchContext';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  FileText, 
  Activity, 
  Plus, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function TestDatabase({ onSelectForReport }: { onSelectForReport?: (id: string) => void }) {
  const { records, selectedRecordId, setSelectedRecordId, deleteRecord, addRecord } = useTestBench();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newPartNumber, setNewPartNumber] = useState('NT-8840-CR');
  const [newSerialNumber, setNewSerialNumber] = useState('SN-2026-');
  const [newNotes, setNewNotes] = useState('Manueller Prüfeintrag');

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.testId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.inspector.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProgram = filterProgram === 'all' || r.program === filterProgram;
    return matchesSearch && matchesProgram;
  });

  const activeRecord = records.find(r => r.id === selectedRecordId) || records[0];

  const handleExportCSV = () => {
    const headers = ['Prüf-ID', 'Teilenummer', 'Seriennummer', 'Datum', 'Uhrzeit', 'Programm', 'Max-Drehmoment (Nm)', 'Soll-Drehmoment (Nm)', 'Winkel (°)', 'Temperatur (°C)', 'Feuchte (%)', 'Status', 'Prüfer'];
    const rows = records.map(r => [
      r.testId,
      r.partNumber,
      r.serialNumber,
      r.date,
      r.timestamp,
      r.program,
      r.maxTorque,
      r.targetTorque,
      r.finalAngle,
      r.temperature,
      r.humidity,
      r.status,
      r.inspector
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Norma_Torsion_Messdaten_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateNewRecord = () => {
    addRecord({
      partNumber: newPartNumber,
      serialNumber: newSerialNumber,
      notes: newNotes,
    });
    setShowNewModal(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            Messdatenbank & Prüfarchiv
            <Database className="w-5 h-5 ml-2 text-indigo-600" />
          </h3>
          <p className="text-xs text-slate-500">
            Zentrale Speicherung aller Torsionsprüfläufe, Baumer CC50 Kennlinien und Qualitätsaufzeichnungen
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Neuer Prüfeintrag
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            CSV Export
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Suche nach Prüf-ID, Seriennummer, Teilenummer oder Prüfer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Alle Programme</option>
            <option value="verdrehmoment">Verdrehmoment</option>
            <option value="anfahren">Anfahren</option>
            <option value="kalibrierung">Kalibrierung</option>
            <option value="service">Service</option>
          </select>
        </div>
      </div>

      {/* Main Database Table & Selected Record Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table List (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-sm border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 text-xs font-semibold text-slate-500">
            <span>{filteredRecords.length} Datensätze gefunden</span>
            <span>Klick für Detailansicht</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[520px]">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Keine Datensätze gefunden.
              </div>
            ) : (
              filteredRecords.map((rec) => {
                const isSelected = activeRecord?.id === rec.id;
                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecordId(rec.id)}
                    className={`p-4 transition-colors cursor-pointer flex items-center justify-between ${
                      isSelected ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900 font-mono">
                          {rec.testId}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {rec.program}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {rec.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Teil: <strong className="text-slate-700">{rec.partNumber}</strong> | SN: <strong className="text-slate-700">{rec.serialNumber}</strong>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-3 font-mono">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" /> {rec.date}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> {rec.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-base font-black text-slate-900 font-mono block">
                        {rec.maxTorque.toFixed(2)} Nm
                      </span>
                      <span className="text-xs text-slate-400 font-mono block">
                        {rec.finalAngle.toFixed(1)}°
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Record Detail Panel (1 col) */}
        {activeRecord && (
          <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prüfbericht-Details</span>
                  <h4 className="text-base font-bold text-slate-900 font-mono">{activeRecord.testId}</h4>
                </div>
                <button
                  onClick={() => deleteRecord(activeRecord.id)}
                  title="Datensatz löschen"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2.5 py-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-sm">
                  <span className="text-[10px] text-slate-400 uppercase block">Max Drehmoment</span>
                  <strong className="text-sm font-bold text-indigo-600 font-mono">{activeRecord.maxTorque.toFixed(2)} Nm</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-sm">
                  <span className="text-[10px] text-slate-400 uppercase block">Drehwinkel</span>
                  <strong className="text-sm font-bold text-slate-800 font-mono">{activeRecord.finalAngle.toFixed(1)}°</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-sm">
                  <span className="text-[10px] text-slate-400 uppercase block">Temperatur</span>
                  <strong className="text-slate-800 font-mono">{activeRecord.temperature} °C</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-sm">
                  <span className="text-[10px] text-slate-400 uppercase block">Prüfer</span>
                  <strong className="text-slate-800">{activeRecord.inspector}</strong>
                </div>
              </div>

              {/* Mini Curve */}
              <div className="space-y-1 pt-2">
                <span className="text-xs font-semibold text-slate-600">Torsions-Verlauf</span>
                <div className="h-28 w-full bg-slate-50 rounded-sm p-1 border border-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeRecord.samplePoints} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                      <defs>
                        <linearGradient id="dbMiniGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={[0, 'auto']} />
                      <Area type="monotone" dataKey="torque" stroke="#4f46e5" strokeWidth={2} fill="url(#dbMiniGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span className="font-semibold block text-slate-700">Bemerkung:</span>
                <p className="mt-0.5 leading-relaxed text-slate-500">{activeRecord.notes}</p>
              </div>
            </div>

            {/* Link to Report View */}
            {onSelectForReport && (
              <button
                onClick={() => onSelectForReport(activeRecord.id)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer mt-3"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Prüfbericht / Zertifikat öffnen</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal for manual entry */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm border border-slate-200 shadow-sm max-w-md w-full p-6 space-y-4">
            <h4 className="font-bold text-base text-slate-900">Neuen Prüfeintrag anlegen</h4>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Teilenummer</label>
                <input
                  type="text"
                  value={newPartNumber}
                  onChange={(e) => setNewPartNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Seriennummer</label>
                <input
                  type="text"
                  value={newSerialNumber}
                  onChange={(e) => setNewSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Bemerkung</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-bold cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateNewRecord}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold cursor-pointer"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
