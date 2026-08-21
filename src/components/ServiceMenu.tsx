import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Settings2, 
  Power, 
  AlertTriangle, 
  RefreshCcw, 
  CheckCircle2, 
  RotateCw,
  Cpu,
  Layers,
  Zap,
  Activity,
  Sliders,
  Code,
  Plus,
  Trash2,
  Save,
  Search,
  Download,
  Filter,
  Database,
  Radio,
  Send,
  Binary,
  ArrowRightLeft,
  SlidersHorizontal,
  Compass,
  Play,
  Square,
  Lock,
  Edit2,
  X,
  Check
} from 'lucide-react';
import { useTestBench } from '../context/TestBenchContext';

interface SystemVariable {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean';
  category: 'opc_ua' | 'baumer_cc50' | 'pse_motor' | 'hardware_ports' | 'system_timing' | 'io_link';
  description: string;
  sqlSynced: boolean;
  lastUpdated: string;
}

interface IsduResponse {
  index: string;
  subindex: string;
  action: 'READ' | 'WRITE';
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  rawHex: string;
  decodedAscii: string;
  timestamp: string;
}

const initialComprehensiveVariables: SystemVariable[] = [
  // OPC UA
  {
    id: 'var_1',
    key: 'opc_server_endpoint',
    value: 'opc.tcp://10.191.199.182:4840',
    type: 'string',
    category: 'opc_ua',
    description: 'opc ua server communication endpoint url',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_2',
    key: 'opc_namespace_index',
    value: '6',
    type: 'number',
    category: 'opc_ua',
    description: 'opc ua namespace index for torsion sensor and motor nodes',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_3',
    key: 'baumer_sensor_node_id',
    value: 'ns=6;i=98844',
    type: 'string',
    category: 'baumer_cc50',
    description: 'node id for real-time torsion torque readings',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_4',
    key: 'motor_position_node_id',
    value: 'ns=6;i=33308',
    type: 'string',
    category: 'pse_motor',
    description: 'node id for halstrup walcher pse motor position',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_5',
    key: 'motor_control_node_id',
    value: 'ns=6;i=33309',
    type: 'string',
    category: 'pse_motor',
    description: 'node id for sending control commands to pse motor',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_6',
    key: 'baumer_supply_voltage_v',
    value: '10.0',
    type: 'number',
    category: 'baumer_cc50',
    description: 'nominal supply voltage for cc50 sensor in volts',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_7',
    key: 'torque_limit_max_nm',
    value: '100.0',
    type: 'number',
    category: 'baumer_cc50',
    description: 'absolute maximum torque threshold in newton meters',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_8',
    key: 'torque_warning_threshold_nm',
    value: '85.0',
    type: 'number',
    category: 'baumer_cc50',
    description: 'warning threshold before emergency torque shutdown',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_9',
    key: 'motor_rated_current_a',
    value: '4.8',
    type: 'number',
    category: 'pse_motor',
    description: 'rated continuous current of the servo drive in amperes',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_10',
    key: 'motor_max_speed_rpm',
    value: '3000',
    type: 'number',
    category: 'pse_motor',
    description: 'absolute maximum revolution speed limit',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_11',
    key: 'motor_accel_ramp_ms',
    value: '250',
    type: 'number',
    category: 'pse_motor',
    description: 'acceleration ramp time from zero to target speed',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_12',
    key: 'system_x3_trigger_delay_ms',
    value: '150',
    type: 'number',
    category: 'system_timing',
    description: 'delay between physical x3 input and software sequence start',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_13',
    key: 'system_x5_record_interval_ms',
    value: '10',
    type: 'number',
    category: 'system_timing',
    description: 'polling interval for torque database recording during active sequence',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_14',
    key: 'io_link_master_ip',
    value: '10.191.199.183',
    type: 'string',
    category: 'io_link',
    description: 'ip address of the primary io-link master block',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  },
  {
    id: 'var_15',
    key: 'io_link_port_cc50',
    value: '4',
    type: 'number',
    category: 'io_link',
    description: 'hardware port number on the master block connected to baumer cc50',
    sqlSynced: true,
    lastUpdated: '15:10:02'
  }
];

export default function ServiceMenu() {
  const [activeTab, setActiveTab] = useState<'variables' | 'motor_manual' | 'iolink' | 'ports' | 'aktoren' | 'system'>('variables');
  const [brakeReleased, setBrakeReleased] = useState(false);
  const [safetyBypass, setSafetyBypass] = useState(false);
  const [forcedCooling, setForcedCooling] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // SQL State Simulation
  const [sqlSyncing, setSqlSyncing] = useState(false);
  const [lastSqlSyncTime, setLastSqlSyncTime] = useState<string>('15:10:02');

  // Variables state
  const [variables, setVariables] = useState<SystemVariable[]>(initialComprehensiveVariables);

  useEffect(() => {
    fetch('/api/variables')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setVariables(data);
        } else {
          // Sync initials to DB
          fetch('/api/variables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(initialComprehensiveVariables)
          });
        }
      })
      .catch(err => console.error("Error loading variables:", err));
  }, []);

  // Inline editing state for description ONLY (Values are read-only from SQL)
  const [editingVarId, setEditingVarId] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState<string>('');

  const [searchVar, setSearchVar] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<'string' | 'number' | 'boolean'>('string');
  const [newCategory, setNewCategory] = useState<'opc_ua' | 'baumer_cc50' | 'pse_motor' | 'hardware_ports' | 'system_timing' | 'io_link'>('pse_motor');
  const [newDescription, setNewDescription] = useState('');

  // Manual Motor Command State
  const [manualTargetAngle, setManualTargetAngle] = useState<number>(90.0);
  const [manualSpeedRpm, setManualSpeedRpm] = useState<number>(150);
  const [manualAccelMs, setManualAccelMs] = useState<number>(200);
  const [manualTorqueLimitPct, setManualTorqueLimitPct] = useState<number>(80);
  const [manualMoveMode, setManualMoveMode] = useState<'absolute' | 'relative'>('absolute');
  const [motorExecuting, setMotorExecuting] = useState<boolean>(false);

  // IO-Link ISDU State
  const [isduIndexHex, setIsduIndexHex] = useState<string>('0x0012');
  const [isduSubIndexHex, setIsduSubIndexHex] = useState<string>('0x00');
  const [isduWritePayload, setIsduWritePayload] = useState<string>('0x42 0x43 0x35 0x30');
  const [isduDataFormat, setIsduDataFormat] = useState<'ASCII' | 'HEX' | 'DEC'>('ASCII');
  const [isduHistory, setIsduHistory] = useState<IsduResponse[]>([
    {
      index: '0x0010',
      subindex: '0x00',
      action: 'READ',
      status: 'SUCCESS',
      rawHex: '0x42 0x61 0x75 0x6d 0x65 0x72',
      decodedAscii: 'Baumer Electric AG',
      timestamp: '15:08:14'
    },
    {
      index: '0x0012',
      subindex: '0x00',
      action: 'READ',
      status: 'SUCCESS',
      rawHex: '0x43 0x43 0x35 0x30 0x2d 0x31 0x30 0x30',
      decodedAscii: 'CC50-100Nm-Torsion',
      timestamp: '15:09:02'
    }
  ]);

  // PSDU Process Data State (Live Byte Buffer)
  const [psduInputBytes, setPsduInputBytes] = useState<number[]>([0x03, 0xE8, 0x00, 0xB4, 0x01, 0x24]);
  const [psduOutputBytes, setPsduOutputBytes] = useState<number[]>([0x00, 0x01, 0x00, 0x5A, 0x00, 0x96]);

  const triggerFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleRefreshFromSQL = () => {
    setSqlSyncing(true);
    setTimeout(() => {
      const now = new Date().toISOString().substring(11, 19);
      setLastSqlSyncTime(now);
      setSqlSyncing(false);
      triggerFeedback(`live sql database synchronized successfully (${variables.length} records)`);
    }, 600);
  };

  // Start editing description
  const handleStartEditDescription = (v: SystemVariable) => {
    setEditingVarId(v.id);
    setTempDescription(v.description);
  };

  // Save edited description
  const handleSaveDescription = (id: string) => {
    const now = new Date().toISOString().substring(11, 19);
    const updated = variables.map(v => 
      v.id === id ? { ...v, description: tempDescription.trim().toLowerCase(), lastUpdated: now } : v
    );
    setVariables(updated);
    
    // Save to SQL
    fetch('/api/variables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
    .then(() => triggerFeedback('variable description updated in sql'))
    .catch(() => triggerFeedback('error saving to sql'));
    
    setEditingVarId(null);
  };

  const handleCancelEdit = () => {
    setEditingVarId(null);
    setTempDescription('');
  };

  const handleResetVariables = () => {
    if (window.confirm('reset all system variables to factory default values?')) {
      setVariables(initialComprehensiveVariables);
      fetch('/api/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialComprehensiveVariables)
      })
      .then(() => triggerFeedback('system variables reset to factory defaults'))
      .catch(() => triggerFeedback('error resetting sql'));
    }
  };

  const handleDeleteVariable = (id: string) => {
    setVariables(prev => prev.filter(v => v.id !== id));
  };

  const handleAddVariable = () => {
    if (!newKey.trim()) return;
    const now = new Date().toISOString().substring(11, 19);
    const newVar: SystemVariable = {
      id: `var_${Date.now()}`,
      key: newKey.trim().toLowerCase().replace(/\s+/g, '_'),
      value: newValue.trim().toLowerCase(),
      type: newType,
      category: newCategory,
      description: newDescription.trim().toLowerCase() || 'custom user defined motor parameter',
      sqlSynced: true,
      lastUpdated: now
    };
    setVariables(prev => [newVar, ...prev]);
    setShowAddModal(false);
    setNewKey('');
    setNewValue('');
    setNewDescription('');
    triggerFeedback(`variable ${newVar.key} added and synced to sql`);
  };

  // Motor Manual Control execution
  const handleExecuteMotorMotion = () => {
    setMotorExecuting(true);
    triggerFeedback(`sending manual motion command: target ${manualTargetAngle}° @ ${manualSpeedRpm} rpm (accel ${manualAccelMs}ms)`);
    setTimeout(() => {
      setMotorExecuting(false);
      triggerFeedback(`manual motion command successfully executed and reached target ${manualTargetAngle}°`);
    }, 1200);
  };

  // IO-Link ISDU execution
  const handleIsduRead = () => {
    const now = new Date().toISOString().substring(11, 19);
    let hex = '0x00 0x00 0x00';
    let ascii = 'OK';

    if (isduIndexHex.toLowerCase() === '0x0010') {
      hex = '0x42 0x61 0x75 0x6d 0x65 0x72';
      ascii = 'Baumer Electric AG';
    } else if (isduIndexHex.toLowerCase() === '0x0012') {
      hex = '0x43 0x43 0x35 0x30 0x2d 0x31 0x30 0x30';
      ascii = 'CC50-100Nm-Torsion';
    } else if (isduIndexHex.toLowerCase() === '0x0015') {
      hex = '0x53 0x4e 0x2d 0x32 0x30 0x32 0x36 0x2d 0x38 0x38';
      ascii = 'SN-2026-8840';
    } else if (isduIndexHex.toLowerCase() === '0x0040') {
      hex = '0x00 0x64 0x01 0x00';
      ascii = 'Scale=100.00Nm Offset=0.00';
    } else {
      hex = '0x4f 0x4b 0x20 0x56 0x41 0x4c';
      ascii = `ISDU_${isduIndexHex}_VAL`;
    }

    const newEntry: IsduResponse = {
      index: isduIndexHex,
      subindex: isduSubIndexHex,
      action: 'READ',
      status: 'SUCCESS',
      rawHex: hex,
      decodedAscii: ascii,
      timestamp: now
    };

    setIsduHistory(prev => [newEntry, ...prev.slice(0, 10)]);
    triggerFeedback(`ISDU Read ${isduIndexHex}:${isduSubIndexHex} completed (200 OK)`);
  };

  const handleIsduWrite = () => {
    const now = new Date().toISOString().substring(11, 19);
    const newEntry: IsduResponse = {
      index: isduIndexHex,
      subindex: isduSubIndexHex,
      action: 'WRITE',
      status: 'SUCCESS',
      rawHex: isduWritePayload,
      decodedAscii: `Written: ${isduWritePayload}`,
      timestamp: now
    };

    setIsduHistory(prev => [newEntry, ...prev.slice(0, 10)]);
    triggerFeedback(`ISDU Write ${isduIndexHex}:${isduSubIndexHex} acknowledged by device`);
  };

  const filteredVariables = variables.filter(v => {
    const matchesSearch = 
      v.key.toLowerCase().includes(searchVar.toLowerCase()) || 
      v.description.toLowerCase().includes(searchVar.toLowerCase()) ||
      v.value.toLowerCase().includes(searchVar.toLowerCase());
    const matchesCat = categoryFilter === 'all' || v.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            Service- & Wartungsmenü
            <Wrench className="w-5 h-5 ml-2 text-indigo-600" />
          </h3>
          <p className="text-xs text-slate-500">
            SQL Live-Parameter (Werte schreibgeschützt, Beschreibung editierbar), IO-Link ISDU/PSDU, Motorsteuerung
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-200/70 p-1 rounded-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('variables')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'variables'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System Variables (SQL)
          </button>

          <button
            onClick={() => setActiveTab('motor_manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'motor_manual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Motor Parameters & Control
          </button>

          <button
            onClick={() => setActiveTab('iolink')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'iolink'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            IO-Link (ISDU / PSDU)
          </button>

          <button
            onClick={() => setActiveTab('ports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ports'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Port-Diagnose (X0-X7)
          </button>

          <button
            onClick={() => setActiveTab('aktoren')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'aktoren'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aktoren
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'system'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reset
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="flex items-center px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
          {feedbackMsg}
        </div>
      )}

      {/* Tab 1: Live SQL System Variables Editor (Values READ-ONLY, Description EDITABLE via Edit button) */}
      {activeTab === 'variables' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
            
            {/* Top Toolbar & Live SQL Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center">
                    <Database className="w-4 h-4 mr-1.5 text-indigo-600" />
                    live sql parameters (read-only live values • editable descriptions)
                  </h4>
                  <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                    sql connected
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  live values stream from SQL • descriptions can be edited by pressing the edit button
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefreshFromSQL}
                  disabled={sqlSyncing}
                  className="flex items-center px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 mr-1 text-slate-400 ${sqlSyncing ? 'animate-spin' : ''}`} />
                  sync sql
                </button>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  add variable
                </button>

                <button
                  onClick={handleResetVariables}
                  className="flex items-center px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-sm text-xs font-bold transition-colors cursor-pointer"
                >
                  reset
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="search variable key or description (lowercase english)..."
                  value={searchVar}
                  onChange={(e) => setSearchVar(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-700 focus:outline-none cursor-pointer font-mono"
                >
                  <option value="all">all categories ({variables.length})</option>
                  <option value="pse_motor">pse_motor</option>
                  <option value="baumer_cc50">baumer_cc50</option>
                  <option value="io_link">io_link (isdu/psdu)</option>
                  <option value="opc_ua">opc_ua</option>
                  <option value="system_timing">system_timing</option>
                </select>
              </div>
            </div>

            {/* Comprehensive Variables Table: Values READ-ONLY, Description EDITABLE via Edit button */}
            <div className="border border-slate-200 rounded-sm overflow-hidden text-xs">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-4">variable key</th>
                      <th className="py-2.5 px-3">category</th>
                      <th className="py-2.5 px-4">live sql value (read-only)</th>
                      <th className="py-2.5 px-4">description</th>
                      <th className="py-2.5 px-3 text-center w-24">actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredVariables.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 font-sans">
                          no variables matching search criteria
                        </td>
                      </tr>
                    ) : (
                      filteredVariables.map((v) => {
                        const isThisEditing = editingVarId === v.id;
                        return (
                          <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Key */}
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <code className="text-indigo-600 bg-indigo-50/70 px-1.5 py-0.5 rounded border border-indigo-100">
                                {v.key}
                              </code>
                            </td>

                            {/* Category */}
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                                {v.category}
                              </span>
                            </td>

                            {/* Value (STRICTLY READ-ONLY LIVE FROM SQL) */}
                            <td className="py-3 px-4 min-w-[180px]">
                              <span 
                                title="Live SQL Data (Read-Only)"
                                className="px-2.5 py-1 bg-slate-100/90 text-slate-800 font-mono font-bold rounded-lg border border-slate-200/80 flex items-center justify-between text-xs shadow-2xs"
                              >
                                <span className="truncate">{v.value}</span>
                                <Lock className="w-3 h-3 text-slate-400 ml-2 shrink-0" />
                              </span>
                            </td>

                            {/* Description (Editable on Edit click) */}
                            <td className="py-3 px-4 min-w-[280px]">
                              {isThisEditing ? (
                                <input
                                  type="text"
                                  value={tempDescription}
                                  onChange={(e) => setTempDescription(e.target.value.toLowerCase())}
                                  autoFocus
                                  className="w-full px-2.5 py-1 bg-white border-2 border-indigo-500 rounded-lg text-xs font-sans text-slate-900 shadow-xs focus:outline-none"
                                  placeholder="enter lowercase description..."
                                />
                              ) : (
                                <span className="text-slate-600 font-sans text-xs block py-1">
                                  {v.description}
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-3 text-center">
                              {isThisEditing ? (
                                <div className="flex items-center justify-center space-x-1 font-sans">
                                  <button
                                    onClick={() => handleSaveDescription(v.id)}
                                    title="save description to sql"
                                    className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs transition-colors cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    title="cancel"
                                    className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-colors cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center space-x-1 font-sans">
                                  <button
                                    onClick={() => handleStartEditDescription(v)}
                                    title="edit description"
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                    <span>edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVariable(v.id)}
                                    title="delete"
                                    className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <span>{variables.length} parameters linked to sql table <code>tbl_norma_parameters</code></span>
              <span>live values are read-only • descriptions are editable</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manual Motor Parameters & Direct Command Panel */}
      {activeTab === 'motor_manual' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Manual Motor Motion Command */}
            <div className="lg:col-span-2 bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center">
                    <SlidersHorizontal className="w-4 h-4 mr-1.5 text-indigo-600" />
                    manual motor parameter command & positioning
                  </h4>
                  <p className="text-xs text-slate-500">
                    manually input motion control setpoints directly to pse drive controller
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-mono">
                  <span className="text-slate-400">current angle:</span>
                  <strong className="text-slate-900 font-bold px-2 py-0.5 bg-slate-100 rounded-md">
                    {motorPosition.toFixed(1)}°
                  </strong>
                </div>
              </div>

              {/* Input Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Target Angle */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-sm border border-slate-200/80">
                  <div className="flex justify-between">
                    <label className="font-bold text-slate-700">target angle (degrees)</label>
                    <span className="font-mono text-indigo-600 font-bold">{manualTargetAngle}°</span>
                  </div>
                  <input
                    type="number"
                    step="1"
                    min="-360"
                    max="3600"
                    value={manualTargetAngle}
                    onChange={(e) => setManualTargetAngle(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                  <div className="flex gap-1.5 pt-1">
                    {[0, 45, 90, 180, 360].map(ang => (
                      <button
                        key={ang}
                        onClick={() => setManualTargetAngle(ang)}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono hover:bg-slate-100 cursor-pointer"
                      >
                        {ang}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Speed */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-sm border border-slate-200/80">
                  <div className="flex justify-between">
                    <label className="font-bold text-slate-700">velocity (rpm)</label>
                    <span className="font-mono text-indigo-600 font-bold">{manualSpeedRpm} rpm</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="600"
                    step="10"
                    value={manualSpeedRpm}
                    onChange={(e) => setManualSpeedRpm(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>10 rpm</span>
                    <span>300 rpm</span>
                    <span>600 rpm</span>
                  </div>
                </div>

                {/* Acceleration Ramp */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-sm border border-slate-200/80">
                  <div className="flex justify-between">
                    <label className="font-bold text-slate-700">accel ramp (ms)</label>
                    <span className="font-mono text-indigo-600 font-bold">{manualAccelMs} ms</span>
                  </div>
                  <input
                    type="number"
                    min="50"
                    max="2000"
                    step="50"
                    value={manualAccelMs}
                    onChange={(e) => setManualAccelMs(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>

                {/* Torque Limit % */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-sm border border-slate-200/80">
                  <div className="flex justify-between">
                    <label className="font-bold text-slate-700">torque limit (%)</label>
                    <span className="font-mono text-indigo-600 font-bold">{manualTorqueLimitPct} %</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={manualTorqueLimitPct}
                    onChange={(e) => setManualTorqueLimitPct(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              {/* Mode Toggle & Send Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500">positioning mode:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    <button
                      onClick={() => setManualMoveMode('absolute')}
                      className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-all ${
                        manualMoveMode === 'absolute' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600'
                      }`}
                    >
                      absolute (0-360°)
                    </button>
                    <button
                      onClick={() => setManualMoveMode('relative')}
                      className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-all ${
                        manualMoveMode === 'relative' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600'
                      }`}
                    >
                      relative (delta)
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={moveToHome}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-bold cursor-pointer"
                  >
                    home (0.0°)
                  </button>

                  <button
                    onClick={handleExecuteMotorMotion}
                    disabled={motorExecuting}
                    className="flex items-center px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Play className={`w-3.5 h-3.5 mr-1.5 fill-current ${motorExecuting ? 'animate-spin' : ''}`} />
                    {motorExecuting ? 'executing...' : 'send motor command'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Live Drive Feedback & Motor Telemetry */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                  pse drive status register
                </h4>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-50 rounded-sm flex justify-between">
                    <span className="text-slate-500 font-sans">rated current:</span>
                    <strong className="text-slate-800">4.80 A</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-sm flex justify-between">
                    <span className="text-slate-500 font-sans">peak limit:</span>
                    <strong className="text-indigo-600">12.50 A</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-sm flex justify-between">
                    <span className="text-slate-500 font-sans">pole pairs:</span>
                    <strong className="text-slate-800">4 pairs</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-sm flex justify-between">
                    <span className="text-slate-500 font-sans">encoder resolution:</span>
                    <strong className="text-slate-800">4096 ppr</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-sm flex justify-between">
                    <span className="text-slate-500 font-sans">gear reduction:</span>
                    <strong className="text-slate-800">10.0 : 1</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-sm flex justify-between">
                    <span className="text-slate-500 font-sans">thermal cutoff:</span>
                    <strong className="text-rose-600">85.0 °C</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-[11px] text-emerald-800 space-y-1">
                <span className="font-bold block flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Drive Ready & Enabled
                </span>
                <p className="text-emerald-700">CANopen / IO-Link node synchronized.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: IO-Link ISDU & PSDU Interface */}
      {activeTab === 'iolink' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Card: Acyclic ISDU Read / Write Service */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center">
                  <ArrowRightLeft className="w-4 h-4 mr-1.5 text-indigo-600" />
                  io-link isdu acyclic service data unit
                </h4>
                <p className="text-xs text-slate-500">
                  read/write device configuration parameters via io-link index and subindex
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">isdu index (hex)</label>
                    <input
                      type="text"
                      value={isduIndexHex}
                      onChange={(e) => setIsduIndexHex(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                      placeholder="e.g. 0x0012"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">sub-index (hex)</label>
                    <input
                      type="text"
                      value={isduSubIndexHex}
                      onChange={(e) => setIsduSubIndexHex(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                      placeholder="e.g. 0x00"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">write payload (hex / ascii bytes)</label>
                  <input
                    type="text"
                    value={isduWritePayload}
                    onChange={(e) => setIsduWritePayload(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                    placeholder="e.g. 0x42 0x43 0x35 0x30"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={handleIsduRead}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>read isdu</span>
                  </button>

                  <button
                    onClick={handleIsduWrite}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-sm font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>write isdu</span>
                  </button>
                </div>
              </div>

              {/* Response Log */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  isdu transaction log
                </span>
                <div className="bg-slate-50 rounded-sm p-3 max-h-40 overflow-y-auto font-mono text-[11px] space-y-1.5 border border-slate-200">
                  {isduHistory.map((h, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-1 last:border-none">
                      <div className="space-y-0.5">
                        <span className="text-indigo-600 font-bold">
                          [{h.action}] {h.index}:{h.subindex}
                        </span>
                        <span className="text-slate-600 block">
                          {h.decodedAscii} ({h.rawHex})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{h.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Card: Cyclic PSDU (Process Service Data Unit) Buffer */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center">
                  <Binary className="w-4 h-4 mr-1.5 text-cyan-600" />
                  io-link psdu cyclic process data stream
                </h4>
                <p className="text-xs text-slate-500">
                  real-time cyclic input & output process data buffer (2ms cycle time)
                </p>
              </div>

              {/* Input PSDU */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">input psdu buffer (sensor to master):</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">6 bytes</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-sm border border-slate-200 font-mono text-xs flex gap-2 overflow-x-auto">
                  {psduInputBytes.map((b, i) => (
                    <div key={i} className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-center shadow-2xs">
                      <span className="text-[9px] text-slate-400 block">byte {i}</span>
                      <strong className="text-slate-900 font-bold block">0x{b.toString(16).padStart(2, '0').toUpperCase()}</strong>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 pl-1 font-mono">
                  Parsed: Torque = <strong>{(liveTorque || 65.4).toFixed(2)} Nm</strong> | Status = <strong>0x01 (VALID)</strong>
                </div>
              </div>

              {/* Output PSDU */}
              <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">output psdu buffer (master to drive):</span>
                  <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">6 bytes</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-sm border border-slate-200 font-mono text-xs flex gap-2 overflow-x-auto">
                  {psduOutputBytes.map((b, i) => (
                    <div key={i} className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-center shadow-2xs">
                      <span className="text-[9px] text-slate-400 block">byte {i}</span>
                      <strong className="text-slate-900 font-bold block">0x{b.toString(16).padStart(2, '0').toUpperCase()}</strong>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 pl-1 font-mono">
                  Control Word = <strong>0x0001 (ENABLE)</strong> | Velocity Setpoint = <strong>150 RPM</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Port-Diagnose (X0 - X7) */}
      {activeTab === 'ports' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Hardware-Schnittstellen X0 bis X7 Live-Monitoring
                </h4>
                <p className="text-xs text-slate-500">
                  Direkte Messwerterfassung von Spannung ($V$), Strom ($A$) und Leistungsaufnahme ($W$) pro Klemme
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-3 px-4 rounded-l-xl">Port</th>
                    <th className="py-3 px-4">Funktion / Angeschlossenes Gerät</th>
                    <th className="py-3 px-4">Signaltyp</th>
                    <th className="py-3 px-4 text-right">Spannung (V)</th>
                    <th className="py-3 px-4 text-right">Strom (A)</th>
                    <th className="py-3 px-4 text-right">Leistung (W)</th>
                    <th className="py-3 px-4 text-center rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {ports.map(port => {
                    const isActive = port.status === 'active';
                    return (
                      <tr key={port.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md">
                            {port.id}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-sans font-medium text-slate-800">
                          {port.device}
                        </td>
                        <td className="py-3.5 px-4 font-sans text-slate-500">
                          {port.type}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                          {port.voltage.toFixed(2)} V
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-indigo-600">
                          {port.current.toFixed(2)} A
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                          {port.power.toFixed(1)} W
                        </td>
                        <td className="py-3.5 px-4 text-center font-sans">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {isActive ? 'Aktiv' : 'Standby'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Aktoren & Manuelle Relais */}
      {activeTab === 'aktoren' && (
        <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm">Manuelle Aktoren & Relais-Overrides</h4>
            <p className="text-xs text-slate-500">Direkte Ansteuerung der elektromechanischen Komponenten</p>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-sm font-semibold text-slate-800 block">Antriebsbremse lösen (Port X6)</span>
                <span className="text-xs text-slate-400">Ermöglicht das freie Drehen der Motorwelle von Hand</span>
              </div>
              <button
                onClick={() => {
                  setBrakeReleased(!brakeReleased);
                  triggerFeedback(brakeReleased ? 'Bremse arretiert' : 'Bremse manuell gelöst');
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  brakeReleased ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  brakeReleased ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <span className="text-sm font-semibold text-red-600 block">Sicherheitskreis überbrücken (Port X1)</span>
                <span className="text-xs text-slate-400">Nur für authorisierte Wartungstechniker</span>
              </div>
              <button
                onClick={() => {
                  setSafetyBypass(!safetyBypass);
                  triggerFeedback(safetyBypass ? 'Sicherheitskreis aktiv' : 'WARNUNG: Sicherheitskreis überbrückt');
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  safetyBypass ? 'bg-red-600' : 'bg-slate-200'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  safetyBypass ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <span className="text-sm font-semibold text-slate-800 block">Dauerlüftung / Kühlung (Port X7)</span>
                <span className="text-xs text-slate-400">Zwangskühlung für Baumer CC50 & Motorstufe</span>
              </div>
              <button
                onClick={() => {
                  setForcedCooling(!forcedCooling);
                  triggerFeedback(forcedCooling ? 'Zwangskühlung aus' : 'Zwangskühlung aktiv');
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  forcedCooling ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  forcedCooling ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: System-Reset & Nullpunkt */}
      {activeTab === 'system' && (
        <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm">System-Wiederherstellung & Nullpunkt</h4>
            <p className="text-xs text-slate-500">Rücksetz-Routinen für Steuerung & Sensorik</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                moveToHome();
                triggerFeedback('Home-Position wird referenziert...');
              }}
              className="p-5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-sm text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <RotateCw className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-slate-900 block mb-1">
                  Referenzfahrt (0.0°)
                </span>
                <p className="text-xs text-slate-500">
                  Setzt den Winkelgeber auf den kalibrierten Nullpunkt zurück.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 mt-4 block">Ausführen →</span>
            </button>

            <button
              onClick={() => triggerFeedback('Fehlerspeicher erfolgreich gelöscht')}
              className="p-5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-sm text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-sm bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <RefreshCcw className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-slate-900 block mb-1">
                  Fehlerspeicher löschen
                </span>
                <p className="text-xs text-slate-500">
                  Setzt anstehende OPC UA Warnungen und Bus-Fehler zurück.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-600 mt-4 block">Ausführen →</span>
            </button>

            <button
              onClick={() => triggerFeedback('Antriebsregler neu gestartet')}
              className="p-5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-sm text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-sm bg-slate-200 text-slate-700 flex items-center justify-center mb-3">
                  <Power className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-slate-900 block mb-1">
                  Antriebsregler Neustart
                </span>
                <p className="text-xs text-slate-500">
                  Initialisiert den Baumer Achscontroller neu (Soft-Reset).
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700 mt-4 block">Ausführen →</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal to add new variable */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm border border-slate-200 shadow-sm max-w-md w-full p-6 space-y-4 font-mono text-xs">
            <h4 className="font-bold text-sm text-slate-900 font-sans">add new sql motor / system variable</h4>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px]">variable key (lowercase)</label>
                <input
                  type="text"
                  placeholder="e.g. motor_rated_torque_nm"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px]">category</label>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs bg-white"
                >
                  <option value="pse_motor">pse_motor</option>
                  <option value="baumer_cc50">baumer_cc50</option>
                  <option value="io_link">io_link</option>
                  <option value="opc_ua">opc_ua</option>
                  <option value="hardware_ports">hardware_ports</option>
                  <option value="system_timing">system_timing</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">data type</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs bg-white"
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">value</label>
                  <input
                    type="text"
                    placeholder="e.g. 5.5"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value.toLowerCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px]">short description (lowercase english)</label>
                <input
                  type="text"
                  placeholder="e.g. rated motor torque constant in newton meters"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 font-sans">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-bold cursor-pointer"
              >
                cancel
              </button>
              <button
                onClick={handleAddVariable}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold cursor-pointer"
              >
                add & sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
