export interface TestBenchSettings {
  start_nm: number;
  pause_ms: number;
  drop_val_pct: number;
  overrun_deg: number;
  standstill_s: number;
  max_time_s: number;
  start_tolerance_deg: number;
  home_pos: number;
  home_tol_inc: number;
  homing_timeout_ms: number;
  tester_name: string;
  article_id: string;
  serial_number: string;
  torque_offset: number;
}

export interface TestBenchStatus {
  connected: boolean;
  state: number;
  statusInfo: string;
  liveTorque: number;
  peakTorque: number;
  motorPositionDeg: number;
  motorPositionInc: number;
  breakPosDeg: number;
  ledColor: number;
  gpio?: {
    x5: boolean;
    x6: boolean;
    x7: boolean;
    led: boolean;
  };
  settings: TestBenchSettings;
  liveCurve?: { rel_ms: number; deg: number; nm: number; state: number }[];
  activeSecurityProfile?: string;
  lastOpcUaError?: string;
}

export interface TestRecord {
  id: string;
  timestamp: string;
  articleId: string;
  serialNumber: string;
  testerId: string;
  result: string;
  maxTorque: number;
  duration: number;
  torqueData: any;
  testParams: any;
}

export interface ChannelPortScanInfo {
  portIndex: number; // 0..7
  portLabel: string; // X0..X7
  channelType: 'IO-Link' | 'Digital Input (DI)' | 'Digital Output (DO)' | 'Deactivated' | 'Reserved';
  ioLinkVersion?: string; // e.g. 'V1.1', 'COM2 (38.4 kBaud)', 'COM3'
  status: 'OPERABLE' | 'PREOPERABLE' | 'DEACTIVATED' | 'NO_DEVICE' | 'PORT_DIAG' | 'ERROR';
  
  // Connected Device Details
  vendorIdHex: string; // e.g. '0x031E'
  vendorIdDec: number;
  vendorName: string; // e.g. 'Halstrup-Walcher GmbH'
  deviceIdHex: string; // e.g. '0x000101'
  deviceIdDec: number;
  productName: string; // e.g. 'PSE 3325-8-IO-0-0'
  productDescription: string; // e.g. 'Positioning System / Motor Drive'
  serialNumber: string;
  hardwareRev?: string;
  firmwareRev?: string;
  
  // OPC UA Nodes & Process Data
  inputNodeId: string; // e.g. 'ns=7;i=690'
  inputLengthBytes: number;
  inputRawHex: string;
  inputDecodedSummary: string;
  inputReadStatus: 'OK' | 'FAILED' | 'UNSUPPORTED' | 'NOT_TESTED';
  
  outputNodeId?: string; // e.g. 'ns=7;i=640'
  outputLengthBytes?: number;
  outputRawHex?: string;
  outputWriteStatus?: 'OK' | 'FAILED' | 'UNSUPPORTED' | 'NOT_TESTED';
  
  pin4Mode: string;
  pin2Mode: string;
  cycleTimeMs?: number;
}

export interface MasterSystemInfo {
  manufacturer: string;
  productName: string;
  model: string;
  serialNumber: string;
  hardwareVersion: string;
  firmwareVersion: string;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  macAddress: string;
  opcUaPort: number;
  temperatureCelsius: number;
  supplyVoltageUs: number; // Sensor supply
  supplyVoltageUp: number; // Actuator supply
  totalCurrentAmps: number;
  systemStatus: 'GOOD' | 'WARNING' | 'ERROR' | 'OFFLINE';
  deviceHealthText: string;
  namespaces: string[];
}

export interface SecurityStrategyResult {
  id: string;
  name: string;
  securityMode: string; // None, Sign, SignAndEncrypt
  securityPolicy: string; // None, Basic256Sha256, etc.
  authType: 'Anonymous' | 'Username/Password' | 'Certificate';
  username?: string;
  status: 'SUCCESS' | 'FAILED' | 'TIMED_OUT' | 'NOT_ATTEMPTED';
  latencyMs: number;
  errorMessage?: string;
  statusCode?: string;
}

export interface MotorMotionTrial {
  name: string;
  formatDescription: string;
  hexSent: string;
  dataType: string;
  opcStatusCode: string;
  positionAfter: number;
  deltaInc: number;
  deltaDeg: number;
  moved: boolean;
  timestamp: string;
}

export interface MotorMotionTestResult {
  timestamp: string;
  startPosInc: number;
  startDeg: number;
  endPosInc: number;
  endDeg: number;
  deltaInc: number;
  deltaDeg: number;
  hasMoved: boolean;
  targetIncCalculated: number;
  successfulFormat?: string;
  safetyStatus: {
    triggerInputX5: boolean;
    actuatorSupplyUpOk: boolean;
    rawInputX0Hex: string;
    driveFaultReported: boolean;
  };
  trials: MotorMotionTrial[];
  detailedAnalysis: string;
  recommendations: string[];
}

export interface LedTestResult {
  timestamp: string;
  testedPorts: {
    portLabel: string;
    nodeId: string;
    description: string;
    variants: {
      dataType: string;
      valueSent: string;
      statusCode: string;
      success: boolean;
    }[];
  }[];
  activeColor: string;
  summary: string;
}

export interface MasterDiagnosticReport {
  timestamp: string;
  targetEndpoint: string;
  isMasterReachable: boolean;
  activeSessionConnected: boolean;
  selectedStrategy: string;
  masterInfo: MasterSystemInfo;
  ports: ChannelPortScanInfo[];
  strategyMatrix: SecurityStrategyResult[];
  logs: { time: string; level: 'info' | 'warn' | 'error' | 'success'; message: string; data?: any }[];
  readTestResults: { nodeId: string; name: string; success: boolean; rawHex?: string; value?: any; error?: string }[];
  writeTestResults: { nodeId: string; name: string; success: boolean; dataTypeUsed: string; responseCode?: string; error?: string }[];
  lastMotorMotionTest?: MotorMotionTestResult;
  lastLedTest?: LedTestResult;
  aiSummaryReport: string;
}

export interface ProfinetDeviceState {
  stationName: string;
  ipAddress: string;
  macAddress: string;
  vendorId: string;
  deviceId: string;
  status: "OK" | "BUS_FAULT" | "SYS_FAULT" | "OFFLINE" | "CONFIG_MISMATCH";
  arState: "ESTABLISHED" | "CONNECTING" | "ABORTED" | "NO_CONNECTION";
  cycleTimeMs: number;
  jitterUs: number;
  missedPackets: number;
}

export interface CodesysPlcStatus {
  runtimeInstalled: boolean;
  runtimeRunning: boolean;
  plcState: "RUN" | "STOP" | "EXCEPTION" | "NOT_FOUND";
  runtimeVersion: string;
  uptimeSeconds: number;
  cycleTimeAvgMs: number;
  cycleTimeMaxMs: number;
  cpuLoadPercent: number;
  profinetStackRunning: boolean;
  activeAlarmsCount: number;
  lastDiagnosticCode?: string;
  lastDiagnosticText?: string;
}

export interface ProfinetSlotMapping {
  slot: number;
  subslot: number;
  portLabel: string;
  moduleName: string;
  configuredDevice: string;
  inputBytes: number;
  outputBytes: number;
  inputAddressPlc: string;
  outputAddressPlc: string;
  inputHexLive: string;
  outputHexLive: string;
  status: "OK" | "IO_DATA_VALID" | "MODULE_FAULT" | "NOT_CONFIGURED";
  description: string;
}

export interface ProfinetDiagnosticReport {
  timestamp: string;
  targetPiIp: string;
  masterIp: string;
  codesysStatus: CodesysPlcStatus;
  profinetDevice: ProfinetDeviceState;
  slots: ProfinetSlotMapping[];
  systemChecks: {
    checkName: string;
    category: "NETWORK" | "RUNTIME" | "PROFINET" | "DEVICE_IO" | "SAFETY";
    passed: boolean;
    severity: "CRITICAL" | "WARNING" | "INFO";
    message: string;
    remedy?: string;
  }[];
  activeErrorCode?: string;
  rootCauseAnalysis: string;
  actionableSteps: string[];
  offlineDriversAvailable: {
    gsdmlFile: string;
    codesysProjectSt: string;
    setupScript: string;
  };
}


