import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Edit3, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Wrench, 
  Network, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  FileText, 
  Layers,
  Search
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  category: 'User Bedingungen' | 'Service Anleitung' | 'Netzwerk Einstellungen' | 'Verdrahtung';
  iconName: 'shield' | 'wrench' | 'network' | 'cpu';
  lastModified: string;
  content: string;
}

const defaultDocs: DocSection[] = [
  {
    id: 'user_conditions',
    title: 'Betriebs- & Nutzerbedingungen (Sicherheit)',
    category: 'User Bedingungen',
    iconName: 'shield',
    lastModified: '2026-08-19 09:30',
    content: `### 1. Allgemeine Betriebs- & Sicherheitsvorschriften

1.1. Qualifikation des Bedienpersonals:
Der Norma Torsion Test Bench darf ausschließlich von geschultem und autorisiertem Fachpersonal (Prüfstandsbediener, Messtechniker) betrieben werden. Vor Erstinbetriebnahme ist das Handbuch vollständig zu lesen.

1.2. Not-Halt- und Schutzvorrichtungen:
- Vor jedem Prüfbeginn muss die Wirksamkeit der Not-Halt-Taster (Port X1) sowie die Schutztürverriegelung überprüft werden.
- Der Betrieb des Torsionsprüfstands bei überbrücktem Sicherheitskreis ist im Normalbetrieb strengstens untersagt.

1.3. Zulässige Prüfparameter:
- Maximales statisches Drehmoment: 25.0 Nm (Baumer CC50 Nennlast bis 100 Nm, limitiert durch Motor PSE 3325)
- Maximale Drehzahl der Prüfachse: 10 RPM (U/min)
- Prüfraumtemperatur: 18.0 °C bis 26.0 °C (gemäß DIN EN ISO 7500-1)
- Relative Luftfeuchtigkeit: 30 % bis 65 % r.F. (nicht kondensierend)

1.4. Persönliche Schutzausrüstung (PSA):
Beim Einspannen und Wechseln von Prüflingen sind Schutzbrille und eng anliegende Arbeitsschutzhandschuhe zu tragen.`
  },
  {
    id: 'service_guide',
    title: 'Service- & Wartungsanleitung',
    category: 'Service Anleitung',
    iconName: 'wrench',
    lastModified: '2026-08-19 09:30',
    content: `### 2. Wartungsplan & Inspektionsintervalle

2.1. Tägliche Prüfroutinen (vor Prüfbeginn):
- Sichtprüfung der Messwelle, Spannzangen und Kupplungen auf Risse oder Verformungen.
- Kontrolle der Nullpunkt-Referenz (Home-Position 0.0°) über das Service-Menü.
- Überprüfung der Sensor-Spannungsversorgung an Port X2 (Sollwert: 10.0 V DC ± 0.05 V).

2.2. Monatliche Wartung:
- Überprüfung und Nachziehen aller mechanischen Klemmschrauben an der Drehmomentstütze.
- Leichtgängigkeit der Linearführungen prüfen und bei Bedarf mit Spezialschmierstoff (ISO VG 68) nachschmieren.
- Reinigung der Schaltschranklüfter und Filtermatten an Port X7.

2.3. Jährliche Kalibrierung (Baumer CC50):
- Rekalibrierung des Drehmomentaufnehmers mit rückführbaren Prüfgewichten / Kalibriereinrichtung gemäß DIN EN ISO 7500.
- Aktualisierung der OPC UA Kalibriermatrix und Sicherung im Fehlerspeicher.`
  },
  {
    id: 'network_settings',
    title: 'Netzwerk- & OPC UA Konfiguration',
    category: 'Netzwerk Einstellungen',
    iconName: 'network',
    lastModified: '2026-08-19 09:30',
    content: `### 3. Netzwerkarchitektur & Bus-Parameter

3.1. TCP/IP & OPC UA Konfiguration:
- Standard-IP Prüfstandsrechner / Gateway: 192.168.1.10
- Subnetzmaske: 255.255.255.0
- Standard-Gateway: 192.168.1.1
- OPC UA Server Endpunkt: opc.tcp://192.168.1.10:4840
- Sicherheitsrichtlinie: Basic256Sha256 / Sign & Encrypt
- Authentifizierung: Benutzername/Passwort oder X.509-Zertifikat

3.2. Baumer CC50 Sensor-Knoten (OPC UA NodeIDs):
- Live-Drehmoment (Nm): ns=2;i=120 (Double, ReadOnly)
- Maximalwert (Peak Hold): ns=2;i=121 (Double, ReadOnly)
- Sensor-Status & Diagnose: ns=2;i=122 (UInt32, ReadOnly)
- Kalibrier-Nullpunkt Tara: ns=2;i=125 (Boolean, ReadWrite)

3.3. PSE Antriebsregler Watchdog:
- Watchdog-Timeout: 5000 ms (zyklisches Heartbeat-Signal)
- Abtast- und Zykluszeit: 20 ms (50 Hz Datenübertragungsrate)`
  },
  {
    id: 'wiring_diagram',
    title: 'Verdrahtung & Klemmenbelegungsplan (X0 - X7)',
    category: 'Verdrahtung',
    iconName: 'cpu',
    lastModified: '2026-08-19 09:30',
    content: `### 4. Hardware-Klemmenplan & Schnittstellen (X0 bis X7)

Übersicht der Steuerungsanschlüsse im Hauptschaltschrank:

- Klemme X0 (Systemversorgung):
  * Pin 1: +24V DC Versorgungsspannung (rot, 2.5 mm²)
  * Pin 2: 0V GND Bezugspotenzial (blau, 2.5 mm²)
  * Pin PE: Schutzerde (grün-gelb, 2.5 mm²)

- Klemme X1 (Sicherheitskreis):
  * Pin 1/2: Not-Halt Kanal 1 (Öffnerkontakt, grau/weiß)
  * Pin 3/4: Not-Halt Kanal 2 & Schutztürschalter (Öffnerkontakt, braun/schwarz)

- Klemme X2 (Baumer CC50 Drehmomentsensor):
  * Pin 1: +10V DC Sensor-Erregerspannung
  * Pin 2: Sensor GND
  * Pin 3: Signal + (Analog 0..10V / ±5V)
  * Pin 4: Signal -
  * Schirm: Beidseitig großflächig an EMV-Schirmbügel aufgelegt

- Klemme X3 (Main Start Taster & LED):
  * Pin 1: Eingang Start-Taster (Schließer, 24V)
  * Pin 2: Ausgang LED-Status Grün (24V, max. 50mA)
  * Pin 3: Ausgang LED-Status Rot/Fehler (24V, max. 50mA)

- Klemme X4 (Inkremental-Drehgeber A/B/Z):
  * Pin 1: +5V DC Geberversorgung
  * Pin 2: 0V GND
  * Pin 3/4: Spur A / /A (RS422 Differenzsignal)
  * Pin 5/6: Spur B / /B (RS422 90° phasenversetzt)
  * Pin 7/8: Referenzimpuls Z / /Z

- Klemme X5 (Trigger & Messwerterfassung):
  * Pin 1: High-Speed Triggereingang (24V DC Pegel, optoentkoppelt)
  * Pin 2: Trigger GND

- Klemme X6 (PSE Motor-Endstufe & Freigabe):
  * Pin 1: +48V DC Motor-Leistungsteil
  * Pin 2: Motor GND Power
  * Pin 3: Freigabe-Signal (Drive Enable, 24V)
  * Pin 4: Drehzahl-Sollwert (PWM / Analog)

- Klemme X7 (Hilfskühlung & Schaltschranklüfter):
  * Pin 1/2: Relais-Schaltausgang für Zwangskühlung (24V DC / 230V AC, max. 2A)`
  }
];

export default function DocumentationWiki() {
  const [docs, setDocs] = useState<DocSection[]>(() => {
    const saved = localStorage.getItem('norma_testbench_docs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultDocs;
      }
    }
    return defaultDocs;
  });

  const [activeSectionId, setActiveSectionId] = useState<string>('user_conditions');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const activeDoc = docs.find(d => d.id === activeSectionId) || docs[0];

  useEffect(() => {
    if (activeDoc) {
      setEditTitle(activeDoc.title);
      setEditContent(activeDoc.content);
    }
  }, [activeSectionId, activeDoc]);

  const handleSave = () => {
    const updated = docs.map(d => {
      if (d.id === activeSectionId) {
        return {
          ...d,
          title: editTitle,
          content: editContent,
          lastModified: new Date().toISOString().substring(0, 16).replace('T', ' ')
        };
      }
      return d;
    });

    setDocs(updated);
    localStorage.setItem('norma_testbench_docs', JSON.stringify(updated));
    setIsEditing(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Möchten Sie diesen Dokumentationsbereich wirklich auf die Standard-Texte zurücksetzen?')) {
      const updated = docs.map(d => {
        if (d.id === activeSectionId) {
          const defaultSection = defaultDocs.find(def => def.id === activeSectionId);
          return defaultSection || d;
        }
        return d;
      });
      setDocs(updated);
      localStorage.setItem('norma_testbench_docs', JSON.stringify(updated));
      setIsEditing(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(activeDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'User Bedingungen': return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'Service Anleitung': return <Wrench className="w-4 h-4 text-indigo-600" />;
      case 'Netzwerk Einstellungen': return <Network className="w-4 h-4 text-cyan-600" />;
      case 'Verdrahtung': return <Cpu className="w-4 h-4 text-amber-600" />;
      default: return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredDocs = docs.filter(d => 
    d.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    d.content.toLowerCase().includes(searchFilter.toLowerCase()) ||
    d.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header with Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            Prüfstands-Handbuch & Dokumentation
            <BookOpen className="w-5 h-5 ml-2 text-indigo-600" />
          </h3>
          <p className="text-xs text-slate-500">
            Betriebsanleitung, Wartungsvorschriften, OPC UA Netzwerk-Setup und Klemmenbelegung (X0 - X7)
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {saveToast && (
            <span className="flex items-center px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-sm text-xs font-bold animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Gespeichert!
            </span>
          )}

          {!isEditing ? (
            <>
              <button
                onClick={handleCopyText}
                className="flex items-center px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-400" />}
                {copied ? 'Kopiert' : 'Text kopieren'}
              </button>

              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                Dokument bearbeiten
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleResetToDefaults}
                className="flex items-center px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-sm text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Standard wiederherstellen
              </button>

              <button
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-bold cursor-pointer"
              >
                Abbrechen
              </button>

              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Änderungen speichern
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Layout: Left Navigation + Right Content/Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar (1 col) */}
        <div className="space-y-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Dokumente durchsuchen..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="bg-white rounded-sm border border-slate-200 p-2 shadow-xs space-y-1">
            {filteredDocs.map((doc) => {
              const isActive = activeSectionId === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    if (isEditing) {
                      if (window.confirm('Ungespeicherte Änderungen verwerfen?')) {
                        setIsEditing(false);
                        setActiveSectionId(doc.id);
                      }
                    } else {
                      setActiveSectionId(doc.id);
                    }
                  }}
                  className={`w-full flex items-start space-x-2.5 p-3 rounded-sm text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50/80 text-indigo-950 font-bold border border-indigo-200/60 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(doc.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs block truncate leading-tight font-medium">
                      {doc.title}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                      {doc.category}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Card */}
          <div className="p-4 bg-slate-100/70 rounded-sm border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <span className="font-bold text-slate-900 block flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Editor-Funktion aktiv
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Sie können alle Abschnitte anpassen, Schaltpläne ergänzen und eigene Richtlinien direkt im Browser speichern.
            </p>
          </div>
        </div>

        {/* Content / Editor Area (3 cols) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-sm border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[580px]">
            
            {/* Document Title Header */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/40">
              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 inline-block">
                  {activeDoc.category}
                </span>

                {!isEditing ? (
                  <h4 className="text-lg font-bold text-slate-900">
                    {activeDoc.title}
                  </h4>
                ) : (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>

              <span className="text-xs text-slate-400 font-mono">
                Stand: {activeDoc.lastModified}
              </span>
            </div>

            {/* Document Body */}
            <div className="p-6 flex-1 overflow-y-auto">
              {!isEditing ? (
                <div className="prose prose-slate max-w-none text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                  {activeDoc.content}
                </div>
              ) : (
                <div className="space-y-3 h-full flex flex-col">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Markdown- und Textbearbeitung:</span>
                    <span className="text-slate-400 font-mono">{editContent.length} Zeichen</span>
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={18}
                    className="w-full flex-1 p-4 bg-slate-50 border border-slate-300 rounded-sm text-xs font-mono text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Dokumentation hier bearbeiten..."
                  />
                </div>
              )}
            </div>

            {/* Document Footer */}
            <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Norma Torsion Test Bench Dokumentations-System</span>
              <span>Dokument-ID: <code>{activeDoc.id}</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
