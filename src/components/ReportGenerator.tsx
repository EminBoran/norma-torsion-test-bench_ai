import React, { useRef, useState, useEffect } from 'react';
import { useTestBench, TestRecord, ReportTemplate } from '../context/TestBenchContext';
import { 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  ShieldCheck, 
  Calendar, 
  Clock, 
  User, 
  Cpu, 
  Activity, 
  Share2, 
  Sparkles,
  Edit3,
  Save,
  Sliders,
  Bookmark,
  Layers,
  Check,
  RotateCcw,
  Copy,
  Plus
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function ReportGenerator() {
  const { 
    records, 
    selectedRecordId, 
    setSelectedRecordId, 
    updateRecord, 
    templates, 
    addTemplate,
    updateTemplate 
  } = useTestBench();
  
  const reportRef = useRef<HTMLDivElement>(null);
  const activeRecord = records.find(r => r.id === selectedRecordId) || records[0];

  // Editable local state for report
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inspectorName, setInspectorName] = useState<string>('');
  const [partNumber, setPartNumber] = useState<string>('');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [materialCharge, setMaterialCharge] = useState<string>('');
  const [normStandard, setNormStandard] = useState<string>('');
  const [minBruchdrehmoment, setMinBruchdrehmoment] = useState<number>(5.0);
  const [maxAllowedTorque, setMaxAllowedTorque] = useState<number>(75.0);
  const [manualStatusOverride, setManualStatusOverride] = useState<'AUTO' | 'PASSED' | 'FAILED' | 'CONDITIONAL'>('AUTO');
  const [engineerRemarks, setEngineerRemarks] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl_norma_5nm');
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // Sync state whenever activeRecord changes
  useEffect(() => {
    if (activeRecord) {
      setInspectorName(activeRecord.inspector || 'Emin Boran, M.Sc.');
      setPartNumber(activeRecord.partNumber || 'NT-8840-CR');
      setSerialNumber(activeRecord.serialNumber || 'SN-2026-9941');
      setMaterialCharge(activeRecord.materialCharge || '1.4301 / Charge 26');
      setNormStandard(activeRecord.normStandard || 'Norma NT-SPEC-5NM / DIN EN ISO 7500');
      setMinBruchdrehmoment(activeRecord.minBruchdrehmoment ?? 5.0);
      setMaxAllowedTorque(activeRecord.maxAllowedTorque ?? 75.0);
      setManualStatusOverride(activeRecord.manualStatusOverride || 'AUTO');
      setEngineerRemarks(activeRecord.engineerRemarks || '');
      setNotes(activeRecord.notes || '');
    }
  }, [activeRecord?.id]);

  const handleApplyTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find(t => t.id === tplId);
    if (!tpl) return;

    setMinBruchdrehmoment(tpl.minBruchdrehmoment);
    setMaxAllowedTorque(tpl.maxAllowedTorque);
    setNormStandard(tpl.normStandard);
    if (!engineerRemarks.trim() || engineerRemarks === activeRecord?.engineerRemarks) {
      setEngineerRemarks(tpl.defaultNotes);
    }
    setSaveBanner(`Vorlage „${tpl.name}“ angewendet (Min. Bruchgrenze: ${tpl.minBruchdrehmoment.toFixed(1)} Nm)`);
    setTimeout(() => setSaveBanner(null), 3500);
  };

  const handleSaveChanges = () => {
    if (!activeRecord) return;
    updateRecord(activeRecord.id, {
      inspector: inspectorName,
      partNumber,
      serialNumber,
      materialCharge,
      normStandard,
      minBruchdrehmoment: Number(minBruchdrehmoment),
      maxAllowedTorque: Number(maxAllowedTorque),
      manualStatusOverride,
      engineerRemarks,
      notes
    });
    setIsEditing(false);
    setSaveBanner('Prüfbericht erfolgreich gespeichert & Qualitätsbewertung aktualisiert!');
    setTimeout(() => setSaveBanner(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!activeRecord) return;
    const exportData = {
      ...activeRecord,
      inspector: inspectorName,
      partNumber,
      serialNumber,
      materialCharge,
      normStandard,
      minBruchdrehmoment,
      maxAllowedTorque,
      manualStatusOverride,
      engineerRemarks,
      notes,
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pruefbericht_${activeRecord.testId}_${activeRecord.date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!activeRecord) {
    return (
      <div className="p-8 text-center bg-white rounded-sm border border-slate-200 text-xs text-slate-500">
        Keine Prüfdatensätze für die Berichterstellung vorhanden. Führen Sie zuerst einen Prüflauf über X3/X5 durch.
      </div>
    );
  }

  // Calculate actual status based on setpoints
  const measuredTorque = activeRecord.maxTorque;
  const isTorqueAboveMinBruch = measuredTorque >= minBruchdrehmoment;
  const isTorqueBelowMax = measuredTorque <= maxAllowedTorque;

  const evaluatedStatus = manualStatusOverride === 'AUTO'
    ? (isTorqueAboveMinBruch && isTorqueBelowMax ? 'PASSED' : 'FAILED')
    : (manualStatusOverride === 'PASSED' ? 'PASSED' : manualStatusOverride === 'FAILED' ? 'FAILED' : 'WARNING');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            Prüfbericht & Qualitätszertifikat
            <FileText className="w-5 h-5 ml-2 text-indigo-600" />
          </h3>
          <p className="text-xs text-slate-500">
            Prüfbericht-Vorlagen, Sollwert-Grenzwerte (Min. Bruchdrehmoment $\ge$ {minBruchdrehmoment.toFixed(1)} Nm) & Ingenieurgutachten
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Record Selector */}
          <select
            value={activeRecord.id}
            onChange={(e) => setSelectedRecordId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-xs"
          >
            {records.map(rec => (
              <option key={rec.id} value={rec.id}>
                {rec.testId} - {rec.partNumber} ({rec.maxTorque.toFixed(1)} Nm)
              </option>
            ))}
          </select>

          {/* Edit Toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center px-3.5 py-1.5 rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer ${
              isEditing 
                ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
            {isEditing ? 'Editor schließen' : 'Bericht bearbeiten'}
          </button>

          {/* Save Button */}
          {isEditing && (
            <button
              onClick={handleSaveChanges}
              className="flex items-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Speichern
            </button>
          )}

          <button
            onClick={handleDownloadJSON}
            className="flex items-center px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="JSON Export"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            JSON
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Drucken / PDF
          </button>
        </div>
      </div>

      {saveBanner && (
        <div className="flex items-center px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-sm animate-fade-in print:hidden">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
          {saveBanner}
        </div>
      )}

      {/* Vorlagen- und Sollwert-Panel (Editierbar & Auswählbar) */}
      <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-slate-900 text-sm">
              Prüfbericht-Vorlagen & Norm-Sollwerte
            </h4>
          </div>

          {/* Quick Template Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Norm-Vorlage:</span>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleApplyTemplate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-sm text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Setpoint & Criteria Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Min Bruchdrehmoment (Mindestgrenze 5.0 Nm) */}
          <div className="p-3 bg-slate-50 rounded-sm border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700">Min. Bruchdrehmoment:</span>
              <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                Sollwert
              </span>
            </div>
            {isEditing ? (
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={minBruchdrehmoment}
                onChange={(e) => setMinBruchdrehmoment(Number(e.target.value))}
                className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-600 text-sm"
              />
            ) : (
              <div className="text-base font-bold font-mono text-slate-900">
                {minBruchdrehmoment.toFixed(2)} Nm
              </div>
            )}
            <p className="text-[10px] text-slate-500">
              Alles unter <strong>{minBruchdrehmoment.toFixed(1)} Nm</strong> gilt als nicht bestanden!
            </p>
          </div>

          {/* Max. zulässiges Drehmoment */}
          <div className="p-3 bg-slate-50 rounded-sm border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700">Max. Drehmoment:</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                Grenzwert
              </span>
            </div>
            {isEditing ? (
              <input
                type="number"
                step="5"
                min="1"
                value={maxAllowedTorque}
                onChange={(e) => setMaxAllowedTorque(Number(e.target.value))}
                className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 text-sm"
              />
            ) : (
              <div className="text-base font-bold font-mono text-slate-900">
                {maxAllowedTorque.toFixed(1)} Nm
              </div>
            )}
            <p className="text-[10px] text-slate-500">
              Oberer Abschaltgrenzwert für Prüfkörper.
            </p>
          </div>

          {/* Manuelle oder automatische Gesamtbewertung */}
          <div className="p-3 bg-slate-50 rounded-sm border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-700 block">Prüfentscheidung:</span>
            {isEditing ? (
              <select
                value={manualStatusOverride}
                onChange={(e: any) => setManualStatusOverride(e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-xs"
              >
                <option value="AUTO">AUTOMATISCH (nach Sollwert)</option>
                <option value="PASSED">BESTANDEN (Manuell)</option>
                <option value="FAILED">NICHT BESTANDEN (Manuell)</option>
                <option value="CONDITIONAL">BEDINGT BESTANDEN</option>
              </select>
            ) : (
              <div className="text-xs font-bold text-slate-800">
                {manualStatusOverride === 'AUTO' ? 'Automatisch (nach Kriterien)' : `Manuell: ${manualStatusOverride}`}
              </div>
            )}
            <p className="text-[10px] text-slate-500">
              {manualStatusOverride === 'AUTO' ? 'Bewertung gemäß 5.0 Nm Schwelle' : 'Durch Prüfingenieur überschrieben'}
            </p>
          </div>

          {/* Live Kriterien-Ergebnis */}
          <div className={`p-3 rounded-sm border flex flex-col justify-between ${
            evaluatedStatus === 'PASSED'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : evaluatedStatus === 'FAILED'
              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
                Kriterien-Status
              </span>
              <strong className="text-sm font-bold flex items-center mt-0.5">
                {evaluatedStatus === 'PASSED' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                    BESTANDEN
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1 text-rose-600" />
                    NICHT BESTANDEN
                  </>
                )}
              </strong>
            </div>
            <span className="text-[10px] font-mono mt-1">
              Ist: {measuredTorque.toFixed(2)} Nm {isTorqueAboveMinBruch ? '≥' : '<'} Min: {minBruchdrehmoment.toFixed(2)} Nm
            </span>
          </div>
        </div>
      </div>

      {/* Printable Report Document Sheet */}
      <div 
        ref={reportRef}
        className="bg-white p-8 sm:p-12 rounded-sm border border-slate-200 shadow-xs space-y-8 text-slate-800 print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                NT
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                NORMA TORSION PRÜFZENTRUM
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Prüfstand-ID: NT-CC50-OPC-UA • Labor-Akkreditierung DIN EN ISO/IEC 17025
            </p>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-block px-3 py-1 bg-slate-100 rounded-md text-xs font-mono font-bold text-slate-800">
              DOK-NR: {activeRecord.testId}
            </span>
            <p className="text-xs text-slate-500">
              Datum: {activeRecord.date} | {activeRecord.timestamp} Uhr
            </p>
          </div>
        </div>

        {/* Title & Final Result Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-6 rounded-sm border border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Offizieller Werks-Prüfbericht
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Torsions- & Bruchdrehmoment-Prüfung
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Prüfverfahren: <strong>{normStandard}</strong>
            </p>
          </div>

          <div className="flex items-center">
            {evaluatedStatus === 'PASSED' ? (
              <div className="flex items-center px-5 py-3 rounded-sm bg-emerald-50 border-2 border-emerald-500 text-emerald-800 shadow-xs">
                <CheckCircle2 className="w-6 h-6 mr-2.5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider block text-emerald-600">Gesamtergebnis</span>
                  <strong className="text-base font-black tracking-tight">PRÜFUNG BESTANDEN</strong>
                </div>
              </div>
            ) : (
              <div className="flex items-center px-5 py-3 rounded-sm bg-rose-50 border-2 border-rose-500 text-rose-800 shadow-xs">
                <XCircle className="w-6 h-6 mr-2.5 text-rose-600 shrink-0" />
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider block text-rose-600">Gesamtergebnis</span>
                  <strong className="text-base font-black tracking-tight">NICHT BESTANDEN</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Specs: Prüfling & Prüfparameter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          {/* Col 1: Prüflingsdaten */}
          <div className="border border-slate-200 rounded-sm p-5 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
              1. Prüflings- & Materialdaten
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Artikel- / Teilenummer:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    className="px-2 py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                ) : (
                  <strong className="text-slate-800 font-mono">{partNumber}</strong>
                )}
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Seriennummer (DUT):</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="px-2 py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                ) : (
                  <strong className="text-slate-800 font-mono">{serialNumber}</strong>
                )}
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Werkstoff / Schmelzcharge:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={materialCharge}
                    onChange={(e) => setMaterialCharge(e.target.value)}
                    className="px-2 py-0.5 border border-slate-300 rounded font-bold text-slate-900"
                  />
                ) : (
                  <strong className="text-slate-800">{materialCharge}</strong>
                )}
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500">Verantwortlicher Prüfingenieur:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="px-2 py-0.5 border border-slate-300 rounded font-bold text-indigo-700"
                  />
                ) : (
                  <strong className="text-indigo-700 font-bold">{inspectorName}</strong>
                )}
              </div>
            </div>
          </div>

          {/* Col 2: Messwerte & Soll-Grenzwerte */}
          <div className="border border-slate-200 rounded-sm p-5 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
              2. Messwerte vs. Soll-Grenzwerte
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Gemessenes Max-Drehmoment:</span>
                <strong className="text-slate-900 font-mono text-sm font-black">
                  {measuredTorque.toFixed(2)} Nm
                </strong>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Gefordertes Mindest-Bruchmoment:</span>
                <strong className="text-rose-600 font-mono font-bold">
                  ≥ {minBruchdrehmoment.toFixed(2)} Nm
                </strong>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Erreichter Drehwinkel:</span>
                <strong className="text-slate-800 font-mono">{activeRecord.finalAngle.toFixed(1)}°</strong>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500">Umgebungsklima (Labor):</span>
                <strong className="text-slate-800 font-mono">
                  {activeRecord.temperature.toFixed(1)} °C | {activeRecord.humidity.toFixed(1)} % r.F.
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Kennlinien-Diagramm */}
        <div className="border border-slate-200 rounded-sm p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              3. Torsionskennlinie (Drehmoment über Prüfzeit / Winkel)
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              Sensor: Baumer CC50 Precision
            </span>
          </div>

          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeRecord.samplePoints}>
                <defs>
                  <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  unit="s" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis 
                  unit=" Nm" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  domain={[0, Math.max(80, maxAllowedTorque)]} 
                  tickLine={false} 
                />
                <Tooltip 
                  formatter={(val: any) => [`${Number(val || 0).toFixed(2)} Nm`, 'Drehmoment']}
                  labelFormatter={(l) => `Zeit: ${l} s`}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="torque" 
                  stroke="#4f46e5" 
                  strokeWidth={2.5} 
                  fill="url(#reportGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Ausführliche Prüfingenieur-Bemerkungen / Gutachten */}
        <div className="border border-slate-200 rounded-sm p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              4. Prüfingenieur-Gutachten & Technische Bemerkungen
            </h4>
            {isEditing && (
              <div className="flex gap-1">
                <button
                  onClick={() => setEngineerRemarks(prev => `${prev} Mindestbruchmoment von >5.0 Nm vollständig nachgewiesen.`)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-medium text-slate-700 cursor-pointer"
                >
                  {'+ Baustein: >5Nm Nachweis'}
                </button>
                <button
                  onClick={() => setEngineerRemarks(prev => `${prev} Freigabe für Serienproduktion erteilt.`)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-medium text-slate-700 cursor-pointer"
                >
                  + Baustein: Freigabe
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <textarea
              rows={4}
              value={engineerRemarks}
              onChange={(e) => setEngineerRemarks(e.target.value)}
              placeholder="Geben Sie hier das detaillierte Prüfgutachten, Auffälligkeiten oder Abweichungen ein..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-sm text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          ) : (
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-sm border border-slate-100">
              {engineerRemarks || 'Keine gesonderten Beanstandungen. Die Prüfung wurde ordnungsgemäß nach Prüfvorschrift durchgeführt.'}
            </p>
          )}
        </div>

        {/* Document Footer: Signatures */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-6">
            <p className="text-slate-400">Prüfstand-Operator:</p>
            <div className="border-b border-slate-300 pb-1 font-mono font-bold text-slate-800">
              {activeRecord.inspector}
            </div>
            <p className="text-[10px] text-slate-400">Unterschrift / Datumsstempel</p>
          </div>

          <div className="space-y-6">
            <p className="text-slate-400">Qualitätsmanagement / Freigabe:</p>
            <div className="border-b border-slate-300 pb-1 font-mono font-bold text-slate-800">
              Dr.-Ing. K. Weber (Leitung QS)
            </div>
            <p className="text-[10px] text-slate-400">Gegenzeichnung / Digitales Zertifikat</p>
          </div>
        </div>
      </div>
    </div>
  );
}
