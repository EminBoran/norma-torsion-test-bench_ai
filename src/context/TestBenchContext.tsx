import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ProgramType = 'service' | 'verdrehmoment' | 'anfahren' | 'kalibrierung';
export type X3Status = 'idle' | 'starting' | 'running' | 'stopping';
export type X5Status = 'idle' | 'armed' | 'triggering' | 'recording';
export type HomeStatus = 'homed' | 'moving' | 'uncalibrated';

export interface PortTelemetry {
  id: string;
  name: string;
  device: string;
  type: 'Power' | 'Safety' | 'Sensor' | 'Digital I/O' | 'Encoder' | 'Trigger' | 'Motor Drive' | 'Aux';
  voltageNominal: number;
  voltage: number;
  current: number;
  power: number;
  status: 'active' | 'standby' | 'warning' | 'offline';
  description: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'x3' | 'x5';
  message: string;
  tag?: string;
}

export interface TorquePoint {
  time: number;
  torque: number;
  position: number;
  triggerActive: boolean;
}

export interface SequenceConfig {
  step1_speedRpm: number;
  step1_targetNm: number;
  step2_dwellSeconds: number;
  step3_speedRpm: number;
  step3_breakDropPercent: number;
  step3_maxAngle: number;
  step5_dwellSeconds: number;
  step6_homeSpeedRpm: number;
  step6_requireDIX6: boolean;
  partNumber: string;
  serialNumber: string;
}

export interface SequenceStepInfo {
  id: number;
  title: string;
  subtitle: string;
  status: 'pending' | 'active' | 'waiting_action' | 'completed' | 'failed';
  detail: string;
}

export interface SequenceState {
  currentStep: number; // 0 to 6
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  isX5Held: boolean;
  diX6Input: boolean;
  fanX7Active: boolean;
  motorReady: boolean;
  baumerConnected: boolean;
  stepTimerRemaining: number;
  maxMeasuredTorque: number;
  breakPositionAngle: number;
  step1AchievedNm: number;
  errorMsg?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  normStandard: string;
  description: string;
  minBruchdrehmoment: number;
  maxAllowedTorque: number;
  targetAngle: number;
  angleTolerance: number;
  durationLimitSeconds: number;
  defaultNotes: string;
}

export interface TestRecord {
  id: string;
  testId: string;
  partNumber: string;
  serialNumber: string;
  materialCharge: string;
  timestamp: string;
  date: string;
  program: ProgramType;
  maxTorque: number;
  targetTorque: number;
  minBruchdrehmoment: number;
  maxAllowedTorque: number;
  finalAngle: number;
  temperature: number;
  humidity: number;
  durationSeconds: number;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  manualStatusOverride: 'AUTO' | 'PASSED' | 'FAILED' | 'CONDITIONAL';
  inspector: string;
  normStandard: string;
  samplePoints: TorquePoint[];
  notes: string;
  engineerRemarks: string;
}

interface TestBenchContextType {
  x3Status: X3Status;
  x5Status: X5Status;
  activeProgram: ProgramType;
  motorPosition: number;
  motorRevolutions: number;
  motorSpeedRpm: number;
  homeStatus: HomeStatus;
  liveTorque: number;
  maxTorque: number;
  targetTorque: number;
  sampleCount: number;
  torqueData: TorquePoint[];
  temperature: number;
  humidity: number;
  ports: PortTelemetry[];
  logs: LogEntry[];
  records: TestRecord[];
  opcUaConnected: boolean;
  templates: ReportTemplate[];
  selectedRecordId: string | null;
  // Actions
  toggleX3: () => void;
  triggerX5: () => void;
  selectProgram: (program: ProgramType) => void;
  moveToHome: () => void;
  jogMotorX5: (direction?: 'forward' | 'backward') => void;
  clearLogs: () => void;
  togglePortState: (portId: string) => void;
  setSelectedRecordId: (id: string | null) => void;
  addRecord: (record: Partial<TestRecord>) => void;
  updateRecord: (id: string, fields: Partial<TestRecord>) => void;
  deleteRecord: (id: string) => void;
  addTemplate: (tpl: ReportTemplate) => void;
  updateTemplate: (id: string, tpl: Partial<ReportTemplate>) => void;
  // Sequence Engine (RPi 5 & Waveshare 10.1" Touch Ablauf)
  sequenceConfig: SequenceConfig;
  sequenceState: SequenceState;
  startSequence: () => void;
  stopSequence: () => void;
  resetSequence: () => void;
  setX5Hold: (held: boolean) => void;
  toggleDIX6Input: () => void;
  updateSequenceConfig: (updates: Partial<SequenceConfig>) => void;
  jumpToStep: (stepIndex: number) => void;
}

const initialTemplates: ReportTemplate[] = [
  {
    id: 'tpl_norma_5nm',
    name: 'Norma Werksnorm NT-5NM (Min. 5.0 Nm Bruchgrenze)',
    normStandard: 'Norma NT-SPEC-5NM / DIN EN ISO 7500',
    description: 'Voraussetzung: Mindest-Bruchmoment von 5.00 Nm. Alles unter 5 Nm gilt als nicht bestanden.',
    minBruchdrehmoment: 5.0,
    maxAllowedTorque: 75.0,
    targetAngle: 180.0,
    angleTolerance: 5.0,
    durationLimitSeconds: 15.0,
    defaultNotes: 'Geprüft nach Werksnorm NT-SPEC-5NM. Bruchdrehmoment muss mindestens 5.00 Nm betragen.'
  },
  {
    id: 'tpl_din_iso_7500',
    name: 'DIN EN ISO 7500-1 Torsionsstandard (Allgemein)',
    normStandard: 'DIN EN ISO 7500-1 Klasse 1.0',
    description: 'Statische Torsionsprüfung an metallischen Rohr- und Klemmenkörpern.',
    minBruchdrehmoment: 5.0,
    maxAllowedTorque: 100.0,
    targetAngle: 180.0,
    angleTolerance: 3.0,
    durationLimitSeconds: 20.0,
    defaultNotes: 'Torsionskennlinie normgerecht nach DIN EN ISO 7500-1 aufgenommen. Keine unzulässige Fließhysterese.'
  },
  {
    id: 'tpl_iso_6789',
    name: 'ISO 6789 Drehmoment-Schraubverbindung',
    normStandard: 'ISO 6789-2:2017',
    description: 'Prüfung von Drehmomentwerkzeugen und mechanischen Kraftübertragern.',
    minBruchdrehmoment: 15.0,
    maxAllowedTorque: 80.0,
    targetAngle: 90.0,
    angleTolerance: 2.0,
    durationLimitSeconds: 12.0,
    defaultNotes: 'Drehmomentgrenzen und Auslösewiederholgenauigkeit gemäß ISO 6789-2 verifiziert.'
  },
  {
    id: 'tpl_high_torque',
    name: 'Baumer CC50 Volllastprüfung (Hochlast > 50 Nm)',
    normStandard: 'Baumer CC50-HL-100',
    description: 'Hochlast-Torsionsprüfung bis 100 Nm Nennkapazität.',
    minBruchdrehmoment: 50.0,
    maxAllowedTorque: 100.0,
    targetAngle: 360.0,
    angleTolerance: 5.0,
    durationLimitSeconds: 30.0,
    defaultNotes: 'Volllast-Referenzierung am Baumer CC50 100Nm Kalibriernormal.'
  }
];

const initialPorts: PortTelemetry[] = [
  {
    id: 'X0',
    name: 'Port X0',
    device: '24V DC Hauptspannungsversorgung',
    type: 'Power',
    voltageNominal: 24.0,
    voltage: 24.18,
    current: 3.45,
    power: 83.4,
    status: 'active',
    description: 'Zentrale Systemversorgung für Steuerlogik und Sensorik'
  },
  {
    id: 'X1',
    name: 'Port X1',
    device: 'Sicherheitskreis & Not-Halt-Kette',
    type: 'Safety',
    voltageNominal: 24.0,
    voltage: 23.95,
    current: 0.14,
    power: 3.3,
    status: 'active',
    description: 'Zweikanalige Überwachung von Not-Halt & Schutzhaube'
  },
  {
    id: 'X2',
    name: 'Port X2',
    device: 'Baumer CC50 Drehmomentsensor',
    type: 'Sensor',
    voltageNominal: 10.0,
    voltage: 10.02,
    current: 0.48,
    power: 4.8,
    status: 'active',
    description: 'Präzisions-Messkanal für Torsionsmessung (OPC UA / Analog)'
  },
  {
    id: 'X3',
    name: 'Port X3',
    device: 'Main Start Taster & Status-LED',
    type: 'Digital I/O',
    voltageNominal: 24.0,
    voltage: 24.05,
    current: 0.09,
    power: 2.1,
    status: 'standby',
    description: 'Hauptbefehlsstelle für Sequenz-Start mit LED-Farbrückmeldung'
  },
  {
    id: 'X4',
    name: 'Port X4',
    device: 'Inkremental-Drehgeber A/B/Z',
    type: 'Encoder',
    voltageNominal: 5.0,
    voltage: 5.01,
    current: 0.22,
    power: 1.1,
    status: 'active',
    description: 'Winkelpositions- und Drehzahlmessung der Hauptachse'
  },
  {
    id: 'X5',
    name: 'Port X5',
    device: 'Trigger-Eingang & Messaufnahme',
    type: 'Trigger',
    voltageNominal: 24.0,
    voltage: 24.12,
    current: 0.16,
    power: 3.8,
    status: 'standby',
    description: 'Intelligente Trigger-Erfassung für High-Speed Datenerfassung'
  },
  {
    id: 'X6',
    name: 'Port X6',
    device: 'Servoverstärker / Motor-Endstufe',
    type: 'Motor Drive',
    voltageNominal: 48.0,
    voltage: 48.25,
    current: 1.85,
    power: 89.2,
    status: 'standby',
    description: 'PSE-Leistungsstufe für Torsionsantrieb mit Drehmomentbegrenzung'
  },
  {
    id: 'X7',
    name: 'Port X7',
    device: 'Hilfskühlung & Schaltschranklüfter',
    type: 'Aux',
    voltageNominal: 24.0,
    voltage: 23.90,
    current: 0.65,
    power: 15.5,
    status: 'active',
    description: 'Aktive Kühlung für Sensorik und Motortreiberstufe'
  }
];

const initialRecords: TestRecord[] = [
  {
    id: 'REC-2026-001',
    testId: 'PRUEF-0842-A',
    partNumber: 'NT-8840-CR',
    serialNumber: 'SN-2026-9941',
    materialCharge: '1.4301 / Ch. 26B-09',
    timestamp: '09:12:44',
    date: '2026-08-19',
    program: 'verdrehmoment',
    maxTorque: 65.42,
    targetTorque: 65.0,
    minBruchdrehmoment: 5.0,
    maxAllowedTorque: 75.0,
    finalAngle: 180.0,
    temperature: 22.3,
    humidity: 44.1,
    durationSeconds: 12.4,
    status: 'PASSED',
    manualStatusOverride: 'AUTO',
    inspector: 'Emin Boran, M.Sc.',
    normStandard: 'Norma NT-SPEC-5NM / DIN EN ISO 7500',
    notes: 'Torsionskennlinie normgerecht nach DIN EN ISO 7500. Mindestbruchgrenze 5.0 Nm weit übertroffen.',
    engineerRemarks: 'Prüfling zeigt gleichmäßiges elastisch-plastisches Verformungsverhalten ohne Mikrorissbildung.',
    samplePoints: [
      { time: 0, torque: 0.0, position: 0, triggerActive: true },
      { time: 2, torque: 18.2, position: 35, triggerActive: true },
      { time: 4, torque: 34.5, position: 75, triggerActive: true },
      { time: 6, torque: 51.1, position: 120, triggerActive: true },
      { time: 8, torque: 65.42, position: 165, triggerActive: true },
      { time: 10, torque: 64.8, position: 180, triggerActive: true },
    ]
  },
  {
    id: 'REC-2026-002',
    testId: 'PRUEF-0843-B',
    partNumber: 'NT-8840-CR',
    serialNumber: 'SN-2026-9942',
    materialCharge: '1.4301 / Ch. 26B-09',
    timestamp: '09:18:20',
    date: '2026-08-19',
    program: 'verdrehmoment',
    maxTorque: 64.88,
    targetTorque: 65.0,
    minBruchdrehmoment: 5.0,
    maxAllowedTorque: 75.0,
    finalAngle: 180.0,
    temperature: 22.4,
    humidity: 44.0,
    durationSeconds: 12.1,
    status: 'PASSED',
    manualStatusOverride: 'AUTO',
    inspector: 'Emin Boran, M.Sc.',
    normStandard: 'Norma NT-SPEC-5NM / DIN EN ISO 7500',
    notes: 'Freigegeben für Serienfertigung. Grenzabweichung < 0.2%.',
    engineerRemarks: 'Prüfung erfüllt alle Kriterien. Freigabe erteilt.',
    samplePoints: [
      { time: 0, torque: 0.0, position: 0, triggerActive: true },
      { time: 2, torque: 17.9, position: 35, triggerActive: true },
      { time: 4, torque: 33.8, position: 75, triggerActive: true },
      { time: 6, torque: 50.2, position: 120, triggerActive: true },
      { time: 8, torque: 64.88, position: 165, triggerActive: true },
      { time: 10, torque: 64.5, position: 180, triggerActive: true },
    ]
  },
  {
    id: 'REC-2026-003',
    testId: 'PRUEF-0844-C',
    partNumber: 'NT-7210-HD',
    serialNumber: 'SN-2026-9943',
    materialCharge: 'C45E / Ch. 12X',
    timestamp: '09:24:10',
    date: '2026-08-19',
    program: 'kalibrierung',
    maxTorque: 99.85,
    targetTorque: 100.0,
    minBruchdrehmoment: 50.0,
    maxAllowedTorque: 105.0,
    finalAngle: 360.0,
    temperature: 22.5,
    humidity: 43.8,
    durationSeconds: 18.5,
    status: 'PASSED',
    manualStatusOverride: 'AUTO',
    inspector: 'Emin Boran, M.Sc.',
    normStandard: 'Baumer CC50-HL-100',
    notes: 'Baumer CC50 100Nm Kalibriernormal erfolgreich referenziert.',
    engineerRemarks: 'Kalibrierkurve linearisiert im Bereich 0-100 Nm.',
    samplePoints: [
      { time: 0, torque: 0.0, position: 0, triggerActive: true },
      { time: 3, torque: 25.0, position: 90, triggerActive: true },
      { time: 6, torque: 50.1, position: 180, triggerActive: true },
      { time: 9, torque: 75.3, position: 270, triggerActive: true },
      { time: 12, torque: 99.85, position: 360, triggerActive: true },
    ]
  }
];

const TestBenchContext = createContext<TestBenchContextType | undefined>(undefined);

export function TestBenchProvider({ children }: { children: ReactNode }) {
  const [x3Status, setX3Status] = useState<X3Status>('idle');
  const [x5Status, setX5Status] = useState<X5Status>('idle');
  const [activeProgram, setActiveProgram] = useState<ProgramType>('verdrehmoment');
  const [motorPosition, _setMotorPosition] = useState<number>(0.0);
  const motorPosRef = React.useRef(0.0);
  const setMotorPosition = React.useCallback((val: any) => {
    _setMotorPosition((prev: number) => {
      const next = typeof val === "function" ? val(prev) : val;
      motorPosRef.current = next;
      return next;
    });
  }, []);
  const [motorRevolutions, setMotorRevolutions] = useState<number>(0);
  const [motorSpeedRpm, setMotorSpeedRpm] = useState<number>(0);
  const [homeStatus, setHomeStatus] = useState<HomeStatus>('homed');
  const [liveTorque, _setLiveTorque] = useState<number>(0.0);
  const liveTorqueRef = React.useRef(0.0);
  const setLiveTorque = React.useCallback((val: any) => {
    _setLiveTorque(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      liveTorqueRef.current = next;
      return next;
    });
  }, []);
  const [maxTorque, setMaxTorque] = useState<number>(0.0);
  const [targetTorque, setTargetTorque] = useState<number>(45.0);
  const [sampleCount, setSampleCount] = useState<number>(0);
  const [torqueData, setTorqueData] = useState<TorquePoint[]>([]);
  const [temperature, setTemperature] = useState<number>(22.4);
  const [humidity, setHumidity] = useState<number>(44.2);
  const [ports, setPorts] = useState<PortTelemetry[]>(initialPorts);
  const [records, setRecords] = useState<TestRecord[]>([]);

  useEffect(() => {
    fetch('/api/records')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          // Parse JSON fields like torqueData
          const parsed = data.map(r => ({
            ...r,
            torqueData: r.torqueData ? JSON.parse(r.torqueData) : [],
            testParams: r.testParams ? JSON.parse(r.testParams) : {}
          }));
          setRecords(parsed);
        } else {
          setRecords(initialRecords);
        }
      })
      .catch(err => {
        console.error("Failed to load records from DB:", err);
        setRecords(initialRecords);
      });
  }, []);
  const [templates, setTemplates] = useState<ReportTemplate[]>(initialTemplates);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>('REC-2026-001');

  // Sequence Configuration (RPi 5 & Waveshare 10.1" Sequencer)
  const [sequenceConfig, setSequenceConfig] = useState<SequenceConfig>({
    step1_speedRpm: 60,
    step1_targetNm: 15.0,
    step2_dwellSeconds: 1.5,
    step3_speedRpm: 120,
    step3_breakDropPercent: 30,
    step3_maxAngle: 220.0,
    step5_dwellSeconds: 5.0,
    step6_homeSpeedRpm: 90,
    step6_requireDIX6: true,
    partNumber: 'NT-8840-CR',
    serialNumber: 'SN-2026-9945'
  });

  // Sequence Live State
  const sequenceStateRef = React.useRef<SequenceState | null>(null);
  const [sequenceState, setSequenceState] = useState<SequenceState>({
    currentStep: 0,
    isRunning: false,
    isPaused: false,
    isCompleted: false,
    isX5Held: false,
    diX6Input: false,
    fanX7Active: true,
    motorReady: true,
    baumerConnected: true,
    stepTimerRemaining: 0,
    maxMeasuredTorque: 0.0,
    breakPositionAngle: 0.0,
    step1AchievedNm: 0.0,
  });

  useEffect(() => { sequenceStateRef.current = sequenceState; }, [sequenceState]);

  const step3TorsionRef = React.useRef({ peakTorque: 0, hasBroken: false, peakAngle: 0 });
  const [step3TorsionProgress, _setStep3TorsionProgress] = useState<{
    peakTorque: number;
    hasBroken: boolean;
    peakAngle: number;
  }>({ peakTorque: 0, hasBroken: false, peakAngle: 0 });
  const setStep3TorsionProgress = React.useCallback((val: any) => {
    _setStep3TorsionProgress(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      step3TorsionRef.current = next;
      return next;
    });
  }, []);

  const [opcUaConnected, setOpcUaConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 1, timestamp: new Date(Date.now() - 60000).toISOString().substring(11, 19), level: 'info', message: 'System initialisiert - Norma Torsion Test Bench (Baumer CC50 & OPC UA)', tag: 'SYSTEM' },
    { id: 2, timestamp: new Date(Date.now() - 45000).toISOString().substring(11, 19), level: 'x3', message: 'X3 Main-Start im Standby (Farbe: Neutral-Grau #64748b)', tag: 'X3-MAIN' },
    { id: 3, timestamp: new Date(Date.now() - 30000).toISOString().substring(11, 19), level: 'x5', message: 'X5 Trigger-System gekoppelt - Messwertarchiv & Datenbank aktiv', tag: 'X5-TRIG' },
  ]);

  const addLog = useCallback((message: string, level: 'info' | 'warning' | 'error' | 'x3' | 'x5', tag?: string) => {
    const timeStr = new Date().toISOString().substring(11, 19);
    setLogs(prev => [
      { id: Date.now() + Math.random(), timestamp: timeStr, level, message, tag },
      ...prev.slice(0, 70)
    ]);
  }, []);

  const addRecord = useCallback((newRecData: Partial<TestRecord>) => {
    const now = new Date();
    const idNum = Math.floor(1000 + Math.random() * 9000);
    const measuredTorque = newRecData.maxTorque || (maxTorque > 0 ? maxTorque : 65.2);
    const minBruch = newRecData.minBruchdrehmoment ?? 5.0;
    
    // Evaluation: If measured torque < minBruchdrehmoment -> FAILED!
    const autoStatus: 'PASSED' | 'FAILED' = measuredTorque >= minBruch ? 'PASSED' : 'FAILED';

    const newRecord: TestRecord = {
      id: `REC-${now.getFullYear()}-${idNum}`,
      testId: `PRUEF-${Math.floor(1000 + Math.random() * 9000)}`,
      partNumber: newRecData.partNumber || 'NT-8840-CR',
      serialNumber: newRecData.serialNumber || `SN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      materialCharge: newRecData.materialCharge || '1.4301 / Charge 26',
      timestamp: now.toISOString().substring(11, 19),
      date: now.toISOString().substring(0, 10),
      program: activeProgram,
      maxTorque: measuredTorque,
      targetTorque: targetTorque,
      minBruchdrehmoment: minBruch,
      maxAllowedTorque: newRecData.maxAllowedTorque || 75.0,
      finalAngle: motorPosition > 0 ? motorPosition : 180.0,
      temperature: temperature,
      humidity: humidity,
      durationSeconds: 10.5,
      status: autoStatus,
      manualStatusOverride: 'AUTO',
      inspector: newRecData.inspector || 'Emin Boran, M.Sc.',
      normStandard: newRecData.normStandard || 'Norma NT-SPEC-5NM / DIN EN ISO 7500',
      notes: newRecData.notes || 'Automatische Erfassung über X5 Trigger.',
      engineerRemarks: newRecData.engineerRemarks || (autoStatus === 'PASSED' ? 'Mindestanforderung erfüllt.' : 'Achtung: Bruchdrehmoment unter Mindestgrenze von 5.00 Nm!'),
      samplePoints: torqueData.length > 0 ? torqueData.slice(-15) : [
        { time: 0, torque: 0.0, position: 0, triggerActive: true },
        { time: 2, torque: 20.0, position: 45, triggerActive: true },
        { time: 4, torque: 42.5, position: 90, triggerActive: true },
        { time: 6, torque: measuredTorque, position: 180, triggerActive: true },
      ]
    };

    setRecords(prev => [newRecord, ...prev]);
    setSelectedRecordId(newRecord.id);
    
    // Save to SQL Database via API
    fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newRecord.id,
        timestamp: newRecord.timestamp,
        articleId: newRecord.programName,
        serialNumber: newRecord.testId,
        testerId: newRecord.tester,
        result: newRecord.status,
        maxTorque: newRecord.maxTorque,
        duration: newRecord.duration,
        torqueData: JSON.stringify(newRecord.torqueData),
        testParams: JSON.stringify(newRecord.testParams)
      })
    }).catch(console.error);
    addLog(`Neuer Messdatensatz [${newRecord.testId}] (${newRecord.status}) in Datenbank gespeichert!`, autoStatus === 'PASSED' ? 'info' : 'warning', 'DATENBANK');
  }, [activeProgram, maxTorque, targetTorque, motorPosition, temperature, humidity, torqueData, addLog]);

  const updateRecord = useCallback((id: string, fields: Partial<TestRecord>) => {
    setRecords(prev => prev.map(rec => {
      if (rec.id === id) {
        const updated = { ...rec, ...fields };
        
        // Recalculate auto status if needed
        if (updated.manualStatusOverride === 'AUTO') {
          const minBruch = updated.minBruchdrehmoment ?? 5.0;
          updated.status = updated.maxTorque >= minBruch ? 'PASSED' : 'FAILED';
        } else if (updated.manualStatusOverride === 'PASSED') {
          updated.status = 'PASSED';
        } else if (updated.manualStatusOverride === 'FAILED') {
          updated.status = 'FAILED';
        } else if (updated.manualStatusOverride === 'CONDITIONAL') {
          updated.status = 'WARNING';
        }
        return updated;
      }
      return rec;
    }));
    addLog(`Prüfbericht [${id}] vom Prüfingenieur aktualisiert.`, 'info', 'REPORT');
  }, [addLog]);

  const deleteRecord = useCallback((id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    addLog(`Messdatensatz [${id}] aus Datenbank entfernt.`, 'warning', 'DATENBANK');
  }, [addLog]);

  const addTemplate = useCallback((tpl: ReportTemplate) => {
    setTemplates(prev => [tpl, ...prev]);
    addLog(`Neue Prüfbericht-Vorlage [${tpl.name}] angelegt.`, 'info', 'VORLAGE');
  }, [addLog]);

  const updateTemplate = useCallback((id: string, tpl: Partial<ReportTemplate>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...tpl } : t));
    addLog(`Prüfbericht-Vorlage [${id}] aktualisiert.`, 'info', 'VORLAGE');
  }, [addLog]);

  const toggleX3 = useCallback(() => {
    if (x3Status === 'idle' || x3Status === 'stopping') {
      setX3Status('starting');
      addLog('X3 Main Start initiiert (Farbe: Gelb #d97706 - Anlaufphase)...', 'x3', 'X3-START');
      setTimeout(() => {
        setX3Status('running');
        setX5Status('armed');
        setMotorSpeedRpm(activeProgram === 'service' ? 120 : 250);
        addLog(`X3 Main Start AKTIV (Farbe: Grün #16a34a) - Programm [${activeProgram.toUpperCase()}] gestartet.`, 'x3', 'X3-RUNNING');
      }, 600);
    } else {
      setX3Status('stopping');
      addLog('X3 Stopp-Signal empfangen (Farbe: Rot #dc2626)...', 'x3', 'X3-STOP');
      setTimeout(() => {
        setX3Status('idle');
        setX5Status('idle');
        setMotorSpeedRpm(0);
        addLog('X3 Main Start DEAKTIVIERT (Farbe: Grau #64748b - Standby).', 'info', 'SYSTEM');
      }, 500);
    }
  }, [x3Status, activeProgram, addLog]);

  const triggerX5 = useCallback(() => {
    if (x3Status !== 'running') {
      addLog('X5 Trigger blockiert: X3 Main Start muss zuerst aktiv sein!', 'warning', 'X5-TRIGGER');
      return;
    }

    setX5Status('triggering');
    addLog('X5 Trigger-Impuls ausgelöst! Intelligente Messwert-Erfassung startet...', 'x5', 'X5-ACQ');

    setTimeout(() => {
      setX5Status('recording');
      addLog('X5 Messaufzeichnung läuft aktiv (50Hz High-Speed Sampling)', 'x5', 'X5-REC');

      setMotorPosition((prev: number) => {
        const next = (prev + 45.0) % 360.0;
        if (next < prev) setMotorRevolutions((r: number) => r + 1);
        return Number(next.toFixed(1));
      });

      setTimeout(() => {
        setX5Status('armed');
        addLog('X5 Trigger-Sequenz abgeschlossen. Datensatz wird in Datenbank archiviert...', 'x5', 'X5-DONE');
        
        // Auto-save test record to database with 5.0 Nm min breaking torque
        addRecord({
          maxTorque: Number((targetTorque * 1.006).toFixed(2)),
          minBruchdrehmoment: 5.0,
          notes: `Automatischer X5-Prüflauf im Programm [${activeProgram.toUpperCase()}].`
        });
      }, 3000);
    }, 350);
  }, [x3Status, targetTorque, activeProgram, addLog, addRecord]);

  const selectProgram = useCallback((program: ProgramType) => {
    setActiveProgram(program);
    const targetMap: Record<ProgramType, number> = {
      service: 15.0,
      verdrehmoment: 65.5,
      anfahren: 25.0,
      kalibrierung: 100.0,
    };
    setTargetTorque(targetMap[program]);
    addLog(`Prüfprogramm gewechselt zu: [${program.toUpperCase()}]. Ziel: ${targetMap[program]} Nm`, 'info', 'PROGRAM');
  }, [addLog]);

  const moveToHome = useCallback(() => {
    setHomeStatus('moving');
    addLog('Home-Position wird angefahren (Referenzfahrt 0.0°)...', 'info', 'HOME');
    setTimeout(() => {
      setMotorPosition(0.0);
      setMotorRevolutions(0);
      setHomeStatus('homed');
      addLog('Home-Position erreicht und kalibriert: 0.00°', 'x5', 'HOME-OK');
    }, 1000);
  }, [addLog]);

  const jogMotorX5 = useCallback((direction: 'forward' | 'backward' = 'forward') => {
    const delta = direction === 'forward' ? 15.0 : -15.0;
    setMotorPosition((prev: number) => {
      let next = prev + delta;
      if (next < 0) next = 360.0 + next;
      next = next % 360.0;
      return Number(next.toFixed(1));
    });
    addLog(`X5 Motor-Schritt: ${delta > 0 ? '+' : ''}${delta}°`, 'x5', 'X5-JOG');
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const togglePortState = useCallback((portId: string) => {
    setPorts(prev => prev.map(p => {
      if (p.id === portId) {
        const nextStatus = p.status === 'active' ? 'standby' : 'active';
        return { ...p, status: nextStatus };
      }
      return p;
    }));
    addLog(`Port ${portId} Status geändert`, 'info', 'PORT');
  }, [addLog]);

  // Sequence Config & Step Actions
  const updateSequenceConfig = useCallback((updates: Partial<SequenceConfig>) => {
    setSequenceConfig(prev => ({ ...prev, ...updates }));
    addLog('Ablauf-Parameter (Geschwindigkeiten/Zeiten/Grenzwerte) aktualisiert.', 'info', 'SEQ-CFG');
  }, [addLog]);

  const setX5Hold = useCallback((held: boolean) => {
    setSequenceState(prev => ({ ...prev, isX5Held: held }));
  }, []);

  const toggleDIX6Input = useCallback(() => {
    setSequenceState(prev => {
      const next = !prev.diX6Input;
      addLog(`Digitaler Eingang DI X6 (Endschalter / Home-Freigabe): ${next ? 'AKTIV (HIGH)' : 'INAKTIV (LOW)'}`, next ? 'x5' : 'info', 'DI-X6');
      return { ...prev, diX6Input: next };
    });
  }, [addLog]);

  const jumpToStep = useCallback((stepIndex: number) => {
    setSequenceState(prev => ({
      ...prev,
      currentStep: stepIndex,
      isRunning: true,
      isCompleted: false,
      stepTimerRemaining: stepIndex === 2 ? sequenceConfig.step2_dwellSeconds : stepIndex === 5 ? sequenceConfig.step5_dwellSeconds : 0
    }));
    addLog(`Manuell zu Schritt ${stepIndex} gesprungen.`, 'warning', 'SEQ-JUMP');
  }, [sequenceConfig, addLog]);

  const startSequence = useCallback(() => {
    setSequenceState({
      currentStep: 0,
      isRunning: true,
      isPaused: false,
      isCompleted: false,
      isX5Held: false,
      diX6Input: false,
      fanX7Active: true,
      motorReady: true,
      baumerConnected: true,
      stepTimerRemaining: 0,
      maxMeasuredTorque: 0,
      breakPositionAngle: 0,
      step1AchievedNm: 0,
    });
    setStep3TorsionProgress({ peakTorque: 0, hasBroken: false, peakAngle: 0 });
    setTorqueData([]);
    setMotorPosition(0);
    setMotorRevolutions(0);
    setMotorSpeedRpm(0);
    setX3Status('running');
    setPorts(prev => prev.map(p => {
      if (p.id === 'X7') return { ...p, status: 'active' };
      if (p.id === 'X3') return { ...p, status: 'active' };
      if (p.id === 'X6') return { ...p, status: 'active' };
      return p;
    }));
    addLog('0. FESTER ABLAUF GESTARTET: Baumer CC50 verbunden, Lüfter (Port X7) EIN, Status-LED GRÜN, Motor auf BEREITSCHAFT', 'info', 'SEQ-0');

    // Automatic transition to Step 1 after 800ms
    setTimeout(() => {
      setSequenceState(prev => prev.isRunning ? { ...prev, currentStep: 1 } : prev);
      addLog('1. SCHRITT: Warte auf X5 GEDRÜCKT HALTEN (Motor läuft mit v1 bis Vorlast M1 erreicht ist)...', 'x5', 'SEQ-1');
    }, 800);
  }, [addLog]);

  const stopSequence = useCallback(() => {
    setSequenceState(prev => ({ ...prev, isRunning: false, isPaused: false }));
    setMotorSpeedRpm(0);
    setX5Status('idle');
    addLog('Ablauf gestoppt / unterbrochen.', 'warning', 'SEQ-STOP');
  }, [addLog]);

  const resetSequence = useCallback(() => {
    setSequenceState({
      currentStep: 0,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      isX5Held: false,
      diX6Input: false,
      fanX7Active: true,
      motorReady: true,
      baumerConnected: true,
      stepTimerRemaining: 0,
      maxMeasuredTorque: 0,
      breakPositionAngle: 0,
      step1AchievedNm: 0,
    });
    setMotorSpeedRpm(0);
    setMotorPosition(0.0);
    setLiveTorque(0.0);
    setStep3TorsionProgress({ peakTorque: 0, hasBroken: false, peakAngle: 0 });
    addLog('Ablauf auf Ausgangszustand zurückgesetzt (Bereit).', 'info', 'SEQ-RESET');
  }, [addLog]);

  // Sequence Automated State Machine Engine
  useEffect(() => {
    if (!sequenceState.isRunning || sequenceState.isPaused || sequenceState.isCompleted) {
      return;
    }

    const timer = setInterval(() => {
      const step = sequenceState.currentStep;

      // STEP 1: X5 Hold & Pre-Torque run
      if (step === 1) {
        if (sequenceState.isX5Held) {
          const speed = sequenceConfig.step1_speedRpm;
          const targetNm = sequenceConfig.step1_targetNm;
          setMotorSpeedRpm(speed);

          setMotorPosition((prev: number) => {
            const next = prev + (speed / 60) * 360 * 0.1;
            return Number(next.toFixed(1));
          });

          setLiveTorque((prevTorque: number) => {
            const nextTorque = Math.min(targetNm, Number((prevTorque + 0.85 + Math.random() * 0.2).toFixed(2)));
            setSequenceState(s => ({ ...s, step1AchievedNm: nextTorque }));

            if (nextTorque >= targetNm) {
              // Reached Step 1 goal!
              setMotorSpeedRpm(0);
              setSequenceState(s => ({
                ...s,
                currentStep: 2,
                stepTimerRemaining: sequenceConfig.step2_dwellSeconds,
                step1AchievedNm: targetNm
              }));
              addLog(`1. SCHRITT BEENDET: Voranzug ${targetNm.toFixed(1)} Nm bei ${speed} RPM erreicht. Gehe zu Schritt 2 (Wartezeit ${sequenceConfig.step2_dwellSeconds} s)...`, 'x5', 'SEQ-1-OK');
            }
            return nextTorque;
          });
        } else {
          setMotorSpeedRpm(0);
        }
      }

      // STEP 2: Dwell / Settle Time
      else if (step === 2) {
        setMotorSpeedRpm(0);
        setSequenceState(s => {
          const remaining = Math.max(0, Number((s.stepTimerRemaining - 0.1).toFixed(1)));
          if (remaining <= 0) {
            setStep3TorsionProgress({ peakTorque: 0, hasBroken: false, peakAngle: 0 });
            addLog(`2. SCHRITT BEENDET: Beruhigungszeit beendet. Starte 3. SCHRITT (Torsionsprüfung bis Bruch mit ${sequenceConfig.step3_speedRpm} RPM)...`, 'x5', 'SEQ-2-OK');
            return {
              ...s,
              currentStep: 3,
              stepTimerRemaining: 0
            };
          }
          return { ...s, stepTimerRemaining: remaining };
        });
      }

      // STEP 3: Torsion Run to Break
      else if (step === 3) {
        const speed = sequenceConfig.step3_speedRpm;
        setMotorSpeedRpm(speed);
        setX5Status('recording');

        setMotorPosition((prevPos: number) => {
          const nextPos = prevPos + (speed / 60) * 360 * 0.1;

          setLiveTorque((prevTorque: number) => {
            let nextTorque = prevTorque;

            if (!step3TorsionRef.current.hasBroken) {
              // Elastic-plastic curve climbing to ~18 Nm
              if (prevTorque < 12) {
                nextTorque = prevTorque + 0.8 + Math.random() * 0.2;
              } else if (prevTorque < 18.5) {
                nextTorque = prevTorque + 0.3 + Math.random() * 0.15;
              } else {
                // Break threshold reached! Sudden drop!
                const peak = Number(prevTorque.toFixed(2));
                const breakPos = Number(nextPos.toFixed(1));
                setStep3TorsionProgress({ peakTorque: peak, hasBroken: true, peakAngle: breakPos });
                setSequenceState(s => ({
                  ...s,
                  maxMeasuredTorque: peak,
                  breakPositionAngle: breakPos
                }));
                addLog(`3. SCHRITT: BRUCHDREHMOMENT ERREICHT! Peak: ${peak} Nm bei ${breakPos}°. Bruchdetektion aktiv!`, 'warning', 'SEQ-3-BREAK');
                return 0.0; // steep drop to 0 after fracture
              }
              return Number(nextTorque.toFixed(2));
            } else {
              // Already broken -> let it rotate a bit more before stopping
              if (nextPos > step3TorsionRef.current.peakAngle + 15.0) {
                // Advance to Step 4 after rotating 15 degrees more
                setMotorSpeedRpm(0);
                setX5Status('armed');
                setSequenceState(s => ({
                  ...s,
                  currentStep: 4
                }));
                addLog(`3. SCHRITT BEENDET: Bruchdetektion abgeschlossen. Gehe zu Schritt 4 (Messdaten speichern)...`, 'x5', 'SEQ-3-OK');
              }
              return 0.0; // torque stays at 0
            }
          });

          return Number(nextPos.toFixed(1));
        });
      }

      // STEP 4: Write Max Torque & Ist-Pos to Database
      else if (step === 4) {
        setMotorSpeedRpm(0);
        const peak = sequenceState.maxMeasuredTorque > 0 ? sequenceState.maxMeasuredTorque : 65.42;
        const breakPos = sequenceState.breakPositionAngle > 0 ? sequenceState.breakPositionAngle : motorPosition;

        addRecord({
          maxTorque: peak,
          finalAngle: breakPos,
          partNumber: sequenceConfig.partNumber,
          serialNumber: sequenceConfig.serialNumber,
          minBruchdrehmoment: 5.0,
          notes: `Automatischer 10.1" Ablauf (Schritte 0-6). Bruch bei ${peak} Nm / ${breakPos}°.`,
          engineerRemarks: peak >= 5.0 ? 'Ablauf nach Spezifikation erfolgreich bestanden (≥ 5.0 Nm).' : 'Achtung: Mindestbruchmoment nicht erreicht.'
        });

        addLog(`4. SCHRITT BEENDET: Max-Drehmoment (${peak} Nm) & Ist-Position (${breakPos}°) in Messdatenbank geschrieben! Gehe zu Schritt 5 (Wartezeit ${sequenceConfig.step5_dwellSeconds} s)...`, 'info', 'SEQ-4-OK');

        setSequenceState(s => ({
          ...s,
          currentStep: 5,
          stepTimerRemaining: sequenceConfig.step5_dwellSeconds
        }));
      }

      // STEP 5: Post-Break Dwell Time
      else if (step === 5) {
        setMotorSpeedRpm(0);
        setSequenceState(s => {
          const remaining = Math.max(0, Number((s.stepTimerRemaining - 0.1).toFixed(1)));
          if (remaining <= 0) {
            addLog(`5. SCHRITT BEENDET: Entlastungszeit beendet. 6. SCHRITT: Fahre auf Home-Position (0.0°)${sequenceConfig.step6_requireDIX6 ? ' sobald Signal an DI X6 anliegt...' : '...'}`, 'x5', 'SEQ-5-OK');
            return {
              ...s,
              currentStep: 6,
              stepTimerRemaining: 0
            };
          }
          return { ...s, stepTimerRemaining: remaining };
        });
      }

      // STEP 6: Return to Home Position (when DI X6 is active)
      else if (step === 6) {
        const canMoveHome = !sequenceConfig.step6_requireDIX6 || sequenceState.diX6Input;

        if (canMoveHome) {
          const homeSpeed = sequenceConfig.step6_homeSpeedRpm;
          setMotorSpeedRpm(homeSpeed);

          setMotorPosition((prevPos: number) => {
            const stepDeg = (homeSpeed / 60) * 360 * 0.1;
            const nextPos = prevPos - stepDeg;

            if (nextPos <= 1.0) {
              // Arrived at home position!
              setMotorSpeedRpm(0);
              setHomeStatus('homed');
              setSequenceState(s => ({
                ...s,
                isCompleted: true,
                isRunning: false
              }));
              addLog('6. SCHRITT BEENDET: Home-Position 0.00° erreicht! GESAMTER PRÜFABLAUF ERFOLGREICH ABGESCHLOSSEN!', 'info', 'SEQ-COMPLETE');
              return 0.0;
            }
            return Number(nextPos.toFixed(1));
          });
        } else {
          setMotorSpeedRpm(0);
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [
    sequenceState.isRunning, 
    sequenceState.isPaused, 
    sequenceState.isCompleted, 
    sequenceState.currentStep, 
    sequenceState.isX5Held, 
    sequenceState.diX6Input, 
    sequenceState.maxMeasuredTorque, 
    sequenceState.breakPositionAngle,
    sequenceConfig, 
    step3TorsionProgress, 
    motorPosition, 
    addLog, 
    addRecord
  ]);

  // Telemetry loop
  useEffect(() => {
    const interval = setInterval(async () => {
      if (true) {
        try {
          const res = await fetch('/api/status');
          const data = await res.json();
          setOpcUaConnected(data.connected);
          if (data.connected) {
            setLiveTorque(Number(data.liveTorque.toFixed(2)));
            setMotorPosition(Number(data.motorPosition.toFixed(1)));
            // Could also sync X3/X5/Fan states if provided by API
          }
        } catch (e) {
          // Ignore network errors
        }
      }
      setTemperature(prev => Number((22.4 + Math.sin(Date.now() / 20000) * 0.6 + (Math.random() * 0.08 - 0.04)).toFixed(1)));
      setHumidity(prev => Number((44.2 + Math.cos(Date.now() / 25000) * 1.5 + (Math.random() * 0.15 - 0.07)).toFixed(1)));

      const isRunning = x3Status === 'running';
      const isRec = x5Status === 'recording' || x5Status === 'triggering';

      setPorts(prev => prev.map(port => {
        let vJitter = (Math.random() - 0.5) * 0.04;
        let cBase = port.current;

        if (port.id === 'X3') {
          port.status = isRunning ? 'active' : 'standby';
          cBase = isRunning ? 0.28 : 0.05;
        } else if (port.id === 'X5') {
          port.status = isRec ? 'active' : isRunning ? 'standby' : 'offline';
          cBase = isRec ? 0.42 : 0.08;
        } else if (port.id === 'X6') {
          port.status = isRunning ? 'active' : 'standby';
          cBase = isRunning ? (isRec ? 4.2 : 2.1) : 0.35;
        }

        const v = Number((port.voltageNominal + vJitter).toFixed(2));
        const c = Number((cBase + (Math.random() - 0.5) * 0.02).toFixed(2));
        const p = Number((v * c).toFixed(1));

        return { ...port, voltage: v, current: Math.max(0.01, c), power: p };
      }));

      if (isRunning) {
        const baseSin = Math.sin(Date.now() / 800) * (targetTorque * 0.45);
        const noise = (Math.random() - 0.5) * 2.0;
        const isSeqRunning = sequenceStateRef.current?.isRunning;
        const currentTorqueVal = Math.max(0.1, Number((targetTorque * 0.5 + baseSin + (isRec ? 12.0 : 0) + noise).toFixed(2)));

        if (!isSeqRunning) {
          setLiveTorque(currentTorqueVal);
          setMaxTorque((prev: number) => Math.max(prev, currentTorqueVal));

          setMotorPosition((prev: number) => {
            const step = (motorSpeedRpm / 60) * 360 * 0.15;
            const next = (prev + step) % 360.0;
            if (next < prev) setMotorRevolutions((r: number) => r + 1);
            return Number(next.toFixed(1));
          });
        }

        setTorqueData(prev => {
          // Freeze graph after step 5 dwell time is over (which means we reached step 6)
          if (isSeqRunning && sequenceStateRef.current?.currentStep && sequenceStateRef.current.currentStep >= 6) {
            return prev;
          }
          
          // Wait for X5 trigger to start recording
          if (isSeqRunning && prev.length === 0) {
            const step = sequenceStateRef.current?.currentStep;
            const isX5Held = sequenceStateRef.current?.isX5Held;
            if (step !== 1 || !isX5Held) {
              return prev; // Do not record until step 1 and X5 is pressed!
            }
          }
          
          const t = prev.length > 0 ? prev[prev.length - 1].time + 1 : 0;
          const newPoint: TorquePoint = {
            time: t,
            torque: isSeqRunning ? liveTorqueRef.current : currentTorqueVal,
            position: isSeqRunning ? motorPosRef.current : motorPosition,
            triggerActive: isRec
          };
          const updated = [...prev, newPoint];
          return isSeqRunning ? updated : (updated.length > 60 ? updated.slice(updated.length - 60) : updated);
        });

        if (isRec) {
          setSampleCount(c => c + 1);
        }
      } else {
        setLiveTorque(0.0);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [x3Status, x5Status, targetTorque, motorSpeedRpm, motorPosition]);

  return (
    <TestBenchContext.Provider
      value={{
        x3Status,
        x5Status,
        activeProgram,
        motorPosition,
        motorRevolutions,
        motorSpeedRpm,
        homeStatus,
        liveTorque,
        maxTorque,
        targetTorque,
        sampleCount,
        torqueData,
        temperature,
        humidity,
        ports,
        logs,
        opcUaConnected,
        records,
        templates,
        selectedRecordId,
        toggleX3,
        triggerX5,
        selectProgram,
        moveToHome,
        jogMotorX5,
        clearLogs,
        togglePortState,
        setSelectedRecordId,
        addRecord,
        updateRecord,
        deleteRecord,
        addTemplate,
        updateTemplate,
        sequenceConfig,
        sequenceState,
        startSequence,
        stopSequence,
        resetSequence,
        setX5Hold,
        toggleDIX6Input,
        updateSequenceConfig,
        jumpToStep,
      }}
    >
      {children}
    </TestBenchContext.Provider>
  );
}

export function useTestBench() {
  const context = useContext(TestBenchContext);
  if (!context) {
    throw new Error('useTestBench must be used within a TestBenchProvider');
  }
  return context;
}
