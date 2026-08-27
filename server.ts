import fs from "fs";
import http from "http";
import express from "express";
import path from "path";
import cors from "cors";
import { 
  OPCUAClient, 
  AttributeIds, 
  ClientSubscription, 
  ClientMonitoredItem, 
  TimestampsToReturn, 
  DataType, 
  VariantArrayType,
  MessageSecurityMode, 
  SecurityPolicy,
  StatusCodes 
} from "node-opcua";
import { OPCUACertificateManager } from "node-opcua-certificate-manager";
import { Server } from "socket.io";
import * as dotenv from "dotenv";
import { createRequire } from "module";
import { runComprehensiveMasterScan, runMotor1DegDiagnosticTest, runLedTestSuite } from "./server_diagnostics";
import { 
  runProfinetDiagnosticScan, 
  setSoftPlcState, 
  GSDML_BAUMER_CM50I_PN_XML, 
  CODESYS_STRUCTURED_TEXT_PLC_PRG, 
  PI5_OFFLINE_SETUP_SCRIPT 
} from "./server_profinet_codesys";

dotenv.config();

const _require = typeof require !== 'undefined' ? require : createRequire('file://' + process.cwd() + '/server.js');

// ----------------------------------------------------
// Database Setup
// ----------------------------------------------------
let db: any = null;
let isMockDb = false;
let mockData: any = { system_variables: [], test_records: [] };

async function setupDatabase() {
  try {
    const sqlite3 = _require('sqlite3');
    const { open } = _require('sqlite');
    
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    
    db = await open({
      filename: path.join(dataDir, 'norma_database.db'),
      driver: sqlite3.Database
    });

    console.log("Local SQLite database initialized.");

    await db.exec(`
      CREATE TABLE IF NOT EXISTS system_variables (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE,
        value TEXT,
        type TEXT,
        category TEXT,
        description TEXT,
        sqlSynced INTEGER,
        lastUpdated TEXT
      );
      
      CREATE TABLE IF NOT EXISTS test_records (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        articleId TEXT,
        serialNumber TEXT,
        testerId TEXT,
        result TEXT,
        maxTorque REAL,
        duration REAL,
        torqueData TEXT,
        testParams TEXT
      );
    `);
  } catch (err: any) {
    console.warn("SQLite using in-memory mock DB fallback. Note:", err.message);
    isMockDb = true;
    
    db = {
      all: async (query: string) => {
        if (query.includes("system_variables")) return mockData.system_variables;
        if (query.includes("test_records")) return mockData.test_records;
        return [];
      },
      run: async (query: string, params: any[]) => {
        if (query.includes("INSERT INTO test_records")) {
          mockData.test_records.unshift({
            id: params[0], timestamp: params[1], articleId: params[2], serialNumber: params[3],
            testerId: params[4], result: params[5], maxTorque: params[6], duration: params[7],
            torqueData: params[8], testParams: params[9]
          });
        }
      },
      exec: async () => {}
    };
  }
}

// ----------------------------------------------------
// Node-RED V31 Constants & Settings
// ----------------------------------------------------
const MOTOR_STOP  = "000000000000"; // 6 bytes 0x00
const MOTOR_RIGHT = "001100000000"; // 5 bytes 0x00, byte 5: 0x11
const MOTOR_LEFT  = "001200000000"; // 5 bytes 0x00, byte 5: 0x12

const LED_OFF    = 0x00;
const LED_GREEN  = 0x01;
const LED_YELLOW = 0x02;
const LED_ORANGE = 0x02; // Gelb / Orange (Standard für ifm IO-Link Farbanzeige)
const LED_AMBER  = 0x03; // Amber / Orange
const LED_RED    = 0x04;
const LED_BLUE   = 0x05;
const LED_WHITE  = 0x07;

// Active motor command and motion watchdog timer
let active_motor_command: string | null = null;
let motor_command_until: number = 0;

interface TestBenchSettings {
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

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

let settings: TestBenchSettings = {
  start_nm: 0.5,
  pause_ms: 1000,
  drop_val_pct: 5.0,
  overrun_deg: 15.0,
  standstill_s: 5.0,
  max_time_s: 60.0,
  start_tolerance_deg: 2.0,
  home_pos: 51200,
  home_tol_inc: 2,
  homing_timeout_ms: 20000,
  tester_name: "Prüfer 1",
  article_id: "NORMA-TORSION-01",
  serial_number: "SN-2026-001",
  torque_offset: 0.0
};

// Load persistent settings from disk if available
try {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (fs.existsSync(SETTINGS_FILE)) {
    const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    settings = { ...settings, ...saved };
    console.log("Real persistent settings loaded from data/settings.json");
  } else {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  }
} catch (e: any) {
  console.warn("Could not load settings.json:", e.message);
}

// ----------------------------------------------------
// State Machine Variables & Program Selection
// ----------------------------------------------------
export type TestProgramType = 'verdrehmoment' | 'vortrimmer' | 'dauerpruefung';

let selected_program: TestProgramType = 'vortrimmer';
let x3_mode: 'taster' | 'schalter' = 'taster';
let x3_active = true; // Default ready or toggleable via X3 button/switch
let x5_active = false; // Hold-to-run active state

let state = 0; // 0=IDLE, 1=PHASE1 (Anfahren), 2=PHASE2 (Pause), 3=PHASE3 (Prüfung), 4=PHASE4 (Nachlauf), 5=PHASE5 (Standstill), 10=HOMING, 20=PAUSED_X5
let cur_nm = 0.0;
let peak_nm = 0.0;
let cur_pos = 51200;
let cur_deg = 0.0;
let break_deg: number | null = null;
let break_pos = 0.0;
let start_time = 0;
let t_dwell = 0;
let standstill_start = 0;
let homing_until = 0;
let last_led_sent = LED_BLUE;
let status_info = "Vor-Trimmerprüfung aktiv: Motor in Bereitschaft (X3 aktiv). X5 halten zum Prüfen";
let total_test_count = 0;

interface CurvePoint {
  rel_ms: number;
  deg: number;
  nm: number;
  state: number;
}
let current_curve: CurvePoint[] = [];

// Helper to format Position Command (4 bytes Pos Big Endian + 00 14)
function getPosHexCmd(posDec: number): string {
  let p = Math.floor(posDec);
  if (p < 0) p = 0xFFFFFFFF + p + 1;
  const hex = (p >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return "0014" + hex; // Control Word first (0014), then 4 bytes Position
}

// Helper to convert hex string to 32-byte OPC UA Buffer
function hexTo32ByteBuffer(hexStr: string): Buffer {
  return Buffer.from(hexStr, 'hex'); // Sende genau die Länge des Befehls (für Motor 6 Bytes)
}

// ----------------------------------------------------
// OPC UA Configuration
// ----------------------------------------------------
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const endpointUrl = process.env.BAUMER_OPCUA_ENDPOINT || "opc.tcp://10.191.199.182:4840";
let opcClient: OPCUAClient | null = null;
let opcSession: any = null;
let isConnected = false;

// NodeIDs on Baumer IO-Link Master
const NODE_MOTOR_OUT = "ns=7;i=640"; // Port X0 Output (Motor command)
const NODE_MOTOR_IN  = "ns=7;i=690"; // Port X0 Input (Motor position feedback)
const NODE_TORQUE_IN = "ns=7;i=691"; // Port X1 Input (HBM T22 Torque Sensor)
const NODE_LED_X3_OUT= "ns=7;i=643"; // Port X3 Output (Taster / DO)
const NODE_X3_IN     = "ns=7;i=693"; // Port X3 Input (Freigabeschalter)
const NODE_X5_IN     = "ns=7;i=695"; // Port X5 Input (Physikalische Prüftaste Hold-to-Run)
const NODE_LED_OUT   = "ns=7;i=646"; // Port X6 Output (IFM Button LED)
const NODE_HOME_IN   = "ns=7;i=696"; // Port X6 Input (Home Button)
const NODE_DEADMAN_IN= "ns=7;i=697"; // Port X7 Input (Totmann Switch / Not-Aus)

async function writeOpcNode(nodeId: string, buffer: Buffer): Promise<boolean> {
  if (!opcSession || !isConnected) return false;
  try {
    const result = await opcSession.write({
      nodeId: nodeId,
      attributeId: AttributeIds.Value,
      value: {
        value: {
          dataType: DataType.ByteString,
          value: buffer
        }
      }
    });
    
    if (result.equals(StatusCodes.Good)) {
      return true;
    }

    // Fallback: ByteArray
    const result2 = await opcSession.write({
      nodeId: nodeId,
      attributeId: AttributeIds.Value,
      value: {
        value: {
          dataType: DataType.Byte,
          arrayType: VariantArrayType.Array,
          value: Array.from(buffer)
        }
      }
    });
    return result2.equals(StatusCodes.Good);
  } catch (err: any) {
    console.error(`[OPC UA] Error writing to ${nodeId}:`, err.message);
    return false;
  }
}

async function sendMotorCommand(hexCmd: string, durationMs: number = 0): Promise<boolean> {
  const rawBuf = Buffer.from(hexCmd, 'hex');
  const buf32 = Buffer.alloc(32);
  rawBuf.copy(buf32, 0);

  if (hexCmd === MOTOR_STOP) {
    active_motor_command = null;
    motor_command_until = 0;
  } else {
    active_motor_command = hexCmd;
    motor_command_until = durationMs > 0 ? Date.now() + durationMs : Date.now() + 60000;
  }

  console.log(`[MOTOR] Sende Hex: ${hexCmd} (Aktiv: ${active_motor_command !== null}) an ${NODE_MOTOR_OUT}`);
  
  // Try 32-byte padded ByteString first
  let ok = await writeOpcNode(NODE_MOTOR_OUT, buf32);
  if (!ok) {
    // Try unpadded buffer
    ok = await writeOpcNode(NODE_MOTOR_OUT, rawBuf);
  }
  return ok;
}

async function sendLedCommand(ledColorByte: number): Promise<boolean> {
  last_led_sent = ledColorByte;
  const buf1 = Buffer.from([ledColorByte]);
  const buf32 = Buffer.alloc(32);
  buf32[0] = ledColorByte;

  // Send to X3, X6 and X5
  const ledTargets = [NODE_LED_X3_OUT, NODE_LED_OUT, "ns=7;i=645"];
  for (const target of ledTargets) {
    try {
      await writeOpcNode(target, buf1);
      await writeOpcNode(target, buf32);
    } catch (e) {}
  }
  return true;
}

// ----------------------------------------------------
// OPC UA Connect & Monitored Items
// ----------------------------------------------------
async function setupOpcUa() {
  try {
    opcClient = OPCUAClient.create({
      endpointMustExist: false,
      securityMode: MessageSecurityMode.None,
      securityPolicy: SecurityPolicy.None,
      connectionStrategy: {
        maxRetry: 100,
        initialDelay: 500,
        maxDelay: 2000,
      },
      connectionTimeout: 5000
    });

    console.log(`[OPC UA] Verbinde mit Baumer Master an ${endpointUrl} (Mode: None/None)...`);
    await opcClient.connect(endpointUrl);
    isConnected = true;
    console.log("[OPC UA] ✅ Verbindung hergestellt!");

    // Baumer accepts Anonymous Session
    opcSession = await opcClient.createSession();
    console.log("[OPC UA] ✅ OPC UA Session erfolgreich autorisiert!");

    // Set initial LED to Blue
    await sendLedCommand(LED_BLUE);

    // Start fast polling & cyclic output loop (every 50ms, Node-RED style)
    setInterval(async () => {
      if (!opcSession || !isConnected) return;
      try {
        // 1. Read Motor Pos, Torque, X3 (Freigabe), X5 (Prüftaste) and X7 (Not-Aus / Totmann)
        const [motorVal, torqueVal, x3Val, x5Val, deadmanVal] = await Promise.all([
          opcSession.read({ nodeId: NODE_MOTOR_IN, attributeId: AttributeIds.Value }),
          opcSession.read({ nodeId: NODE_TORQUE_IN, attributeId: AttributeIds.Value }),
          opcSession.read({ nodeId: NODE_X3_IN, attributeId: AttributeIds.Value }).catch(() => null),
          opcSession.read({ nodeId: NODE_X5_IN, attributeId: AttributeIds.Value }).catch(() => null),
          opcSession.read({ nodeId: NODE_DEADMAN_IN, attributeId: AttributeIds.Value }).catch(() => null),
        ]);

        // Decode Motor Position (32 Byte Buffer from Baumer Master)
        if (motorVal?.value?.value) {
          const buf = motorVal.value.value;
          if (Buffer.isBuffer(buf) && buf.length >= 4) {
            const pos = buf.readInt32BE(0);
            cur_pos = pos;
            cur_deg = Number(((cur_pos - settings.home_pos) * 0.9).toFixed(1));
          }
        }

        // Decode Torque Sensor (32 Byte Buffer from Baumer Master)
        if (torqueVal?.value?.value) {
          const buf = torqueVal.value.value;
          if (Buffer.isBuffer(buf) && buf.length >= 2) {
            const raw = buf.readInt16BE(0);
            // Formula: -((((raw / 27648) * 20) - 10) * 2.5 - offset)
            const calculated = -((((raw / 27648.0) * 20.0) - 10.0) * 2.5 - settings.torque_offset);
            cur_nm = Number(calculated.toFixed(3));
          }
        }

        // Decode Physical Port X3 (Freigabeschalter)
        if (x3Val?.value?.value) {
          const buf = x3Val.value.value;
          const isHigh = Buffer.isBuffer(buf) ? (buf[0] & 0x01) === 1 : Boolean(buf);
          if (isHigh !== x3_active) {
            executeSetX3(isHigh);
          }
        }

        // Decode Physical Port X5 (Hold-to-Run Prüftaste)
        if (x5Val?.value?.value) {
          const buf = x5Val.value.value;
          const isPressed = Buffer.isBuffer(buf) ? (buf[0] & 0x01) === 1 : Boolean(buf);
          if (isPressed !== x5_active) {
            executeSetX5(isPressed);
          }
        }

        // Decode Port X7 (Hardware Not-Halt / Totmann)
        if (deadmanVal?.value?.value) {
          const buf = deadmanVal.value.value;
          const isStop = Buffer.isBuffer(buf) ? (buf[0] & 0x01) === 0 : !Boolean(buf);
          if (isStop && (state > 0 && state < 10)) {
            executeEmergencyStop();
          }
        }

        // 2. CYCLIC OUTPUT KEEP-ALIVE FOR LED (Port X3 / X6) - Prevents watchdog timeout
        const ledBuf = Buffer.from([last_led_sent]);
        try {
          await opcSession.write({
            nodeId: NODE_LED_X3_OUT,
            attributeId: AttributeIds.Value,
            value: { value: { dataType: DataType.ByteString, value: ledBuf } }
          });
        } catch (e) {}

        // 3. CYCLIC OUTPUT FOR MOTOR IF ACTIVELY RUNNING
        if (active_motor_command) {
          if (motor_command_until > 0 && Date.now() > motor_command_until) {
            active_motor_command = null;
            motor_command_until = 0;
            const stopBuf = Buffer.alloc(6);
            try {
              await opcSession.write({
                nodeId: NODE_MOTOR_OUT,
                attributeId: AttributeIds.Value,
                value: { value: { dataType: DataType.ByteString, value: stopBuf } }
              });
            } catch (e) {}
          } else {
            const cmdBuf = Buffer.from(active_motor_command, 'hex');
            try {
              await opcSession.write({
                nodeId: NODE_MOTOR_OUT,
                attributeId: AttributeIds.Value,
                value: { value: { dataType: DataType.ByteString, value: cmdBuf } }
              });
            } catch (e) {}
          }
        }
      } catch (err: any) {
        // Session might need reconnect if connection dropped
      }
    }, 50);

  } catch (err: any) {
    console.warn("[OPC UA] Verbindung fehlgeschlagen (Mock/Fallback aktiv):", err.message);
    isConnected = false;
    // Retry connection after 5 seconds
    setTimeout(() => setupOpcUa(), 5000);
  }
}

// ----------------------------------------------------
// State Machine Engine (Runs at 100ms)
// ----------------------------------------------------
function tickStateMachine() {
  const now = Date.now();
  const start_tol_inc = Math.max(1, Math.round(settings.start_tolerance_deg / 0.9));

  // Simulation engine when no OPC UA hardware is connected
  if (!isConnected) {
    // If running active test (states 1..4) without X5 active in simulation, pause
    if ((state === 1 || state === 3 || state === 4) && !x5_active) {
      state = 20;
      status_info = "X5 Losgelassen: Motor gestoppt. Taste X5 gedrückt halten zum Prüfen.";
    }

    if (state === 1 && x5_active) {
      cur_deg = Number((cur_deg + 0.6).toFixed(1));
      cur_pos = settings.home_pos + Math.round(cur_deg / 0.9);
      cur_nm = Number((cur_nm + 0.06).toFixed(3));
    } else if (state === 3 && x5_active) {
      cur_deg = Number((cur_deg + 1.2).toFixed(1));
      cur_pos = settings.home_pos + Math.round(cur_deg / 0.9);
      
      if (selected_program === 'vortrimmer') {
        // Vor-Trimmerprüfung: Sanfter Verlauf bis ~0.75 Nm
        cur_nm = Number((0.45 + (cur_deg * 0.01) + (Math.sin(cur_deg * 0.2) * 0.05)).toFixed(3));
        if (cur_deg >= 35.0) {
          state = 5;
          standstill_start = now;
          status_info = `Vor-Trimmerprüfung erreicht! Reibmoment: ${cur_nm.toFixed(2)} Nm bei ${cur_deg.toFixed(1)}°`;
        }
      } else if (selected_program === 'dauerpruefung') {
        cur_nm = Number((1.20 + (Math.sin(cur_deg * 0.1) * 0.08)).toFixed(3));
        if (cur_deg >= 90.0) {
          state = 5;
          standstill_start = now;
          status_info = `Dauerprüflauf beendet (${cur_deg.toFixed(1)}°, Moment: ${cur_nm.toFixed(2)} Nm)`;
        }
      } else {
        // Verdrehmoment / Torsionsbruch
        if (cur_deg < 42.0) {
          cur_nm = Number((cur_nm + 0.14).toFixed(3));
        } else {
          // Drop nach Bruch
          cur_nm = Number(Math.max(0.1, cur_nm * 0.82).toFixed(3));
        }
      }
    } else if (state === 4 && x5_active) {
      cur_deg = Number((cur_deg + 1.0).toFixed(1));
      cur_pos = settings.home_pos + Math.round(cur_deg / 0.9);
    } else if (state === 10) {
      const diff = settings.home_pos - cur_pos;
      if (Math.abs(diff) <= 250) {
        cur_pos = settings.home_pos;
        cur_deg = 0.0;
        cur_nm = 0.0;
      } else {
        cur_pos += Math.sign(diff) * 250;
        cur_deg = Number(((cur_pos - settings.home_pos) * 0.9).toFixed(1));
      }
    }
  }

  // Update Peak Torque during active test
  if (state > 0 && state < 10) {
    if (Math.abs(cur_nm) > peak_nm) {
      peak_nm = Math.abs(cur_nm);
    }

    if (start_time > 0) {
      current_curve.push({
        rel_ms: now - start_time,
        deg: cur_deg,
        nm: cur_nm,
        state: state
      });
      // Cap memory at 1500 points
      if (current_curve.length > 1500) current_curve.shift();
    }
  }

  // State 1: Phase 1 (Anfahren bis Start-Drehmoment)
  if (state === 1 && cur_nm >= settings.start_nm) {
    state = 2;
    t_dwell = now;
    sendMotorCommand(MOTOR_STOP);
    status_info = `PHASE 2: Pause (${settings.pause_ms} ms)`;
  }
  // State 2: Phase 2 (Pause)
  else if (state === 2 && now - t_dwell >= settings.pause_ms) {
    state = 3;
    sendMotorCommand(MOTOR_RIGHT);
    sendLedCommand(LED_RED);
    const progLabel = selected_program === 'vortrimmer' ? 'Vor-Trimmerprüfung' : selected_program === 'dauerpruefung' ? 'Dauerprüfung' : 'Verdrehmoment-Prüfung';
    status_info = `PHASE 3: ${progLabel} läuft (X5 aktiv)`;
  }
  // State 3: Phase 3 (Bruch erkennen via Peak Drop bei Verdrehmoment)
  else if (
    state === 3 &&
    selected_program === 'verdrehmoment' &&
    peak_nm > 0.5 &&
    cur_nm <= (peak_nm * (1.0 - (settings.drop_val_pct / 100.0)))
  ) {
    state = 4;
    break_deg = cur_deg;
    break_pos = cur_deg;
    status_info = `Bruch erkannt bei ${peak_nm.toFixed(2)} Nm! Nachlauf ${settings.overrun_deg}°...`;
  }
  // State 4: Phase 4 (Nachlauf)
  else if (
    state === 4 &&
    break_deg !== null &&
    Math.abs(cur_deg - break_deg) >= settings.overrun_deg
  ) {
    state = 5;
    standstill_start = now;
    sendMotorCommand(MOTOR_STOP);
    status_info = "Nachlauf beendet. Motor gestoppt.";
  }
  // State 5: Phase 5 (Standstill & Auto-Save)
  else if (
    state === 5 &&
    now - standstill_start >= settings.standstill_s * 1000
  ) {
    state = 0;
    sendLedCommand(LED_BLUE);
    const progName = selected_program === 'vortrimmer' ? 'Vor-Trimmerprüfung' : selected_program === 'dauerpruefung' ? 'Dauerprüfung' : 'Verdrehmoment-Prüfung';
    status_info = `${progName} erfolgreich abgeschlossen! Peak: ${peak_nm.toFixed(2)} Nm (Motor in Bereitschaft)`;

    // Save record to DB
    const recordId = "REC-" + Date.now();
    const duration = start_time > 0 ? (now - start_time) / 1000 : 0;
    if (db) {
      db.run(
        `INSERT INTO test_records (id, timestamp, articleId, serialNumber, testerId, result, maxTorque, duration, torqueData, testParams)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
         [
          recordId,
          new Date().toISOString(),
          settings.article_id,
          settings.serial_number,
          settings.tester_name,
          peak_nm >= settings.start_nm ? "PASSED" : "WARNING",
          peak_nm,
          duration,
          JSON.stringify(current_curve.filter((_, idx) => idx % 2 === 0)),
          JSON.stringify({ ...settings, program: selected_program })
        ]
      ).catch((e: any) => console.error("DB Save error:", e));
    }

    // AUTOMATIC HOMING: Move back to home position automatically without user action
    state = 10;
    x5_active = false;
    homing_until = now + settings.homing_timeout_ms;
    const posCmd = getPosHexCmd(settings.home_pos);
    sendMotorCommand(posCmd);
    sendLedCommand(LED_YELLOW);
    status_info = `Prüfung abgeschlossen! Fährt automatisch zurück auf Home (0.0°)...`;
  }
  // State 10: Homing Sequence
  else if (state === 10) {
    const atHome = Math.abs(cur_pos - settings.home_pos) <= settings.home_tol_inc;
    const isTimeout = now > homing_until;

    if (atHome) {
      state = 0;
      sendMotorCommand(MOTOR_STOP);
      sendLedCommand(LED_BLUE);
      status_info = "Home-Position (0.0°) erreicht. Motor in Bereitschaft.";
    } else if (isTimeout) {
      state = 0;
      sendMotorCommand(MOTOR_STOP);
      sendLedCommand(LED_RED);
      status_info = "Fehler: Homing Timeout!";
    }
  }
  // Safety Timeout for running test
  else if (state > 0 && state < 10 && start_time > 0 && (now - start_time) > settings.max_time_s * 1000) {
    state = 0;
    sendMotorCommand(MOTOR_STOP);
    sendLedCommand(LED_RED);
    status_info = "FEHLER: Prüfzeit-Timeout überschritten!";
  }
}

// ----------------------------------------------------
// Action Handlers
// ----------------------------------------------------
function executeSelectProgram(prog: TestProgramType) {
  selected_program = prog;
  const label = prog === 'vortrimmer' ? 'Vor-Trimmerprüfung' : prog === 'dauerpruefung' ? 'Dauerprüflauf' : 'Verdrehmoment-Prüfung';
  if (x3_active) {
    status_info = `Programm "${label}" aktiv. Motor in BEREITSCHAFT. X5 halten zum Prüfen.`;
  } else {
    status_info = `Programm "${label}" gewählt. Sperre aktiv: Bitte X3 einschalten für Bereitschaft.`;
  }
  return { success: true, program: selected_program, statusInfo: status_info, isReady: x3_active };
}

function executeSetX3(active?: boolean, mode?: 'taster' | 'schalter') {
  if (mode) {
    x3_mode = mode;
  }
  if (typeof active === 'boolean') {
    x3_active = active;
  } else {
    // Toggle
    x3_active = !x3_active;
  }

  const progLabel = selected_program === 'vortrimmer' ? 'Vor-Trimmerprüfung' : selected_program === 'dauerpruefung' ? 'Dauerprüfung' : 'Verdrehmoment-Prüfung';

  if (x3_active) {
    sendLedCommand(LED_YELLOW);
    status_info = `X3 AKTIV (${x3_mode.toUpperCase()}): Motor in BEREITSCHAFT (${progLabel}). X5 halten zum Start.`;
  } else {
    if (state > 0 && state < 10) {
      state = 0;
      sendMotorCommand(MOTOR_STOP);
    }
    sendLedCommand(LED_BLUE);
    status_info = `X3 AUS: Motor gesperrt (Freigabe über X3 erforderlich).`;
  }

  return { success: true, x3Active: x3_active, x3Mode: x3_mode, isReady: x3_active, statusInfo: status_info };
}

function executeStartSequence() {
  const now = Date.now();
  const progLabel = selected_program === 'vortrimmer' ? 'Vor-Trimmerprüfung' : selected_program === 'dauerpruefung' ? 'Dauerprüfung' : 'Verdrehmoment-Prüfung';

  if (!x3_active) {
    return { success: false, message: "Motor nicht in Bereitschaft! Bitte zuerst X3 Freigabe einschalten." };
  }

  // If in IDLE, start test
  if (state === 0) {
    state = 1;
    peak_nm = 0.0;
    break_pos = 0.0;
    break_deg = null;
    current_curve = [];
    start_time = now;
    t_dwell = 0;
    standstill_start = 0;
    total_test_count++;
    x5_active = true;

    sendMotorCommand(MOTOR_RIGHT);
    sendLedCommand(LED_YELLOW);
    status_info = `Prüfung gestartet: ${progLabel} läuft... (Fährt danach automatisch auf 0.0° Home)`;
    return { success: true, message: status_info };
  } else if (state === 20) {
    state = 3;
    x5_active = true;
    sendMotorCommand(MOTOR_RIGHT);
    sendLedCommand(LED_RED);
    status_info = `${progLabel} wird fortgesetzt...`;
    return { success: true, message: status_info };
  }

  return { success: true, message: status_info };
}

function executeSetX5(pressed: boolean) {
  x5_active = pressed;
  const now = Date.now();
  const progLabel = selected_program === 'vortrimmer' ? 'Vor-Trimmerprüfung' : selected_program === 'dauerpruefung' ? 'Dauerprüfung' : 'Verdrehmoment-Prüfung';

  if (pressed) {
    if (!x3_active) {
      status_info = "Taste X5 gedrückt, aber Freigabe X3 ist AUS! Bitte Freigabeschalter X3 aktivieren.";
      return { success: false, message: status_info, x5Active: true };
    }

    if (state === 0) {
      state = 1;
      peak_nm = 0.0;
      break_pos = 0.0;
      break_deg = null;
      current_curve = [];
      start_time = now;
      t_dwell = 0;
      standstill_start = 0;
      total_test_count++;

      sendMotorCommand(MOTOR_RIGHT);
      sendLedCommand(LED_YELLOW);
      status_info = `X5 GEDRÜCKT: ${progLabel} gestartet (Motor dreht)...`;
      return { success: true, message: status_info, x5Active: true };
    } else if (state === 20) {
      state = 3;
      sendMotorCommand(MOTOR_RIGHT);
      sendLedCommand(LED_RED);
      status_info = `X5 ERNEUT GEDRÜCKT: ${progLabel} wird fortgesetzt (Motor dreht)...`;
      return { success: true, message: status_info, x5Active: true };
    }
  } else {
    // X5 released -> Stop motor immediately during active test
    if (state > 0 && state < 5) {
      state = 20; // Paused due to deadman / X5 release
      sendMotorCommand(MOTOR_STOP);
      sendLedCommand(LED_YELLOW);
      status_info = `X5 LOSGELASSEN: Motor gestoppt (Totmann). Zum Fortsetzen Taste X5 erneut gedrückt halten.`;
      return { success: true, message: status_info, x5Active: false };
    }
  }

  return { success: true, x5Active: x5_active, statusInfo: status_info };
}

function executeEmergencyStop() {
  state = 0;
  x5_active = false;
  sendMotorCommand(MOTOR_STOP);
  sendLedCommand(LED_RED);
  status_info = "NOT-HALT ausgelöst! Motor gestoppt.";
  return { success: true, message: status_info };
}

function executeGoHome() {
  if (state !== 0 && state !== 20) {
    return { success: false, message: "Homing nur im Stillstand (Idle) möglich." };
  }

  state = 10;
  x5_active = false;
  homing_until = Date.now() + settings.homing_timeout_ms;
  
  const posCmd = getPosHexCmd(settings.home_pos);
  sendMotorCommand(posCmd);
  sendLedCommand(LED_YELLOW);
  status_info = `Homing gestartet: Ziel ${settings.home_pos} Inkremente (0.0°)`;

  return { success: true, message: status_info };
}

function executeJog(dir: 'left' | 'right' | 'stop') {
  if (state !== 0 && state !== 10 && state !== 20) {
    return { success: false, message: "Jog nur im Stillstand erlaubt." };
  }

  if (dir === 'right') {
    sendMotorCommand(MOTOR_RIGHT);
    status_info = "Jog: Rechtslauf";
  } else if (dir === 'left') {
    sendMotorCommand(MOTOR_LEFT);
    status_info = "Jog: Linkslauf";
  } else {
    sendMotorCommand(MOTOR_STOP);
    status_info = "Jog: Stopp";
  }
  return { success: true, message: status_info };
}

function executeReset() {
  state = 0;
  x5_active = false;
  peak_nm = 0.0;
  break_pos = 0.0;
  break_deg = null;
  t_dwell = 0;
  standstill_start = 0;
  start_time = 0;
  current_curve = [];
  sendMotorCommand(MOTOR_STOP);
  sendLedCommand(LED_BLUE);
  const progLabel = selected_program === 'vortrimmer' ? 'Vor-Trimmerprüfung' : selected_program === 'dauerpruefung' ? 'Dauerprüfung' : 'Verdrehmoment-Prüfung';
  status_info = `Reset ausgeführt. Programm "${progLabel}" in Bereitschaft (X3: ${x3_active ? 'AKTIV' : 'AUS'}).`;
  return { success: true, message: status_info };
}

function tareTorque() {
  // Sets the current raw torque as offset
  settings.torque_offset = cur_nm + settings.torque_offset;
  status_info = `Drehmoment tariert (Offset: ${settings.torque_offset.toFixed(3)} Nm)`;
  return { success: true, message: status_info, offset: settings.torque_offset };
}

// ----------------------------------------------------
// REST API Routes
// ----------------------------------------------------
app.get("/api/status", (req, res) => {
  res.json({
    connected: isConnected,
    state,
    statusInfo: status_info,
    liveTorque: cur_nm,
    peakTorque: peak_nm,
    motorPositionDeg: cur_deg,
    motorPositionInc: cur_pos,
    breakPosDeg: break_pos,
    ledColor: last_led_sent,
    totalTestCount: total_test_count,
    selectedProgram: selected_program,
    x3Mode: x3_mode,
    x3Active: x3_active,
    x5Active: x5_active,
    isReady: x3_active,
    settings
  });
});

app.post("/api/program/select", (req, res) => {
  const { program } = req.body;
  if (program && (program === 'verdrehmoment' || program === 'vortrimmer' || program === 'dauerpruefung')) {
    const result = executeSelectProgram(program);
    return res.json(result);
  }
  res.status(400).json({ success: false, message: "Ungültiges Programm" });
});

app.post("/api/x3/set", (req, res) => {
  const { active, mode } = req.body;
  const result = executeSetX3(active, mode);
  res.json(result);
});

app.post("/api/x3/toggle", (req, res) => {
  const result = executeSetX3();
  res.json(result);
});

app.post("/api/x5/state", (req, res) => {
  const { pressed } = req.body;
  const result = executeSetX5(Boolean(pressed));
  res.json(result);
});

app.post("/api/control", async (req, res) => {
  const { action, dir, program, x3Active, x3Mode, x5Pressed } = req.body;
  let result: any = { success: false, message: "Unbekannte Aktion" };

  switch (action) {
    case "select_program":
      if (program) result = executeSelectProgram(program);
      break;
    case "set_x3":
      result = executeSetX3(x3Active, x3Mode);
      break;
    case "toggle_x3":
      result = executeSetX3();
      break;
    case "set_x5":
      result = executeSetX5(Boolean(x5Pressed));
      break;
    case "start":
      result = executeStartSequence();
      break;
    case "stop":
      result = executeEmergencyStop();
      break;
    case "go_home":
      result = executeGoHome();
      break;
    case "jog":
      result = executeJog(dir || "stop");
      break;
    case "reset":
      result = executeReset();
      break;
    case "tare":
      result = tareTorque();
      break;
    case "set_led":
      const color = req.body.color || LED_BLUE;
      await sendLedCommand(color);
      result = { success: true, message: `LED auf 0x0${color.toString(16)} gesetzt` };
      break;
  }

  res.json(result);
});

app.get("/api/settings", (req, res) => {
  res.json(settings);
});

app.post("/api/settings", (req, res) => {
  settings = { ...settings, ...req.body };
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch (e: any) {
    console.warn("Error saving settings.json:", e.message);
  }
  res.json({ success: true, settings });
});

app.get("/api/records", async (req, res) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const records = await db.all("SELECT * FROM test_records ORDER BY timestamp DESC LIMIT 50");
    res.json(records.map((r: any) => ({
      ...r,
      torqueData: typeof r.torqueData === 'string' ? JSON.parse(r.torqueData) : r.torqueData,
      testParams: typeof r.testParams === 'string' ? JSON.parse(r.testParams) : r.testParams
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Diagnostic & IO-Link Scan Routes
// ----------------------------------------------------
app.post("/api/diagnostics/scan", async (req, res) => {
  try {
    const target = req.body.endpoint || endpointUrl;
    const creds = {
      username: req.body.username || process.env.OPC_USERNAME || "admin",
      password: req.body.password || process.env.OPC_PASSWORD || "admin"
    };
    const report = await runComprehensiveMasterScan(target, creds, opcSession);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: "Diagnosescan fehlgeschlagen: " + err.message });
  }
});

app.get("/api/diagnostics/scan", async (req, res) => {
  try {
    const report = await runComprehensiveMasterScan(endpointUrl, undefined, opcSession);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: "Diagnosescan fehlgeschlagen: " + err.message });
  }
});

app.post("/api/diagnostics/motor-1deg-test", async (req, res) => {
  try {
    const target = req.body.endpoint || endpointUrl;
    const creds = {
      username: req.body.username || process.env.OPC_USERNAME || "admin",
      password: req.body.password || process.env.OPC_PASSWORD || "admin"
    };
    const forceNodeId = req.body.forceNodeId;
    const result = await runMotor1DegDiagnosticTest(target, creds, forceNodeId, opcSession);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "1° Motor Bewegungstest fehlgeschlagen: " + err.message });
  }
});

app.post("/api/diagnostics/led-test", async (req, res) => {
  try {
    const target = req.body.endpoint || endpointUrl;
    const creds = {
      username: req.body.username || process.env.OPC_USERNAME || "admin",
      password: req.body.password || process.env.OPC_PASSWORD || "admin"
    };
    const port = req.body.port || "X3";
    const colorCode = typeof req.body.color === "number" ? req.body.color : 0x05;
    // Set persistent active color so cyclic loop keeps it on permanently
    sendLedCommand(colorCode);
    const result = await runLedTestSuite(target, creds, port, colorCode, opcSession);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "LED / Taster-Test fehlgeschlagen: " + err.message });
  }
});

app.post("/api/diagnostics/custom-write", async (req, res) => {
  const { nodeId, dataType, hexValue, numValue } = req.body;
  if (!nodeId) return res.status(400).json({ error: "nodeId erforderlich" });

  try {
    let buf: Buffer = Buffer.from([]);
    if (hexValue) {
      buf = Buffer.from(hexValue.replace(/\s+/g, ""), "hex");
    } else if (typeof numValue === "number") {
      buf = Buffer.alloc(4);
      buf.writeInt32BE(numValue, 0);
    }

    if (opcSession && isConnected) {
      let targetDataType = DataType.ByteString;
      let targetArrayType = VariantArrayType.Scalar;
      let targetValue: any = buf;

      if (dataType === "ByteArray") {
        targetDataType = DataType.Byte;
        targetArrayType = VariantArrayType.Array;
        targetValue = Array.from(buf);
      } else if (dataType === "Int16") {
        targetDataType = DataType.Int16;
        targetValue = typeof numValue === "number" ? numValue : buf.readInt16BE(0);
      } else if (dataType === "Int32") {
        targetDataType = DataType.Int32;
        targetValue = typeof numValue === "number" ? numValue : buf.readInt32BE(0);
      } else if (dataType === "Boolean") {
        targetDataType = DataType.Boolean;
        targetValue = numValue === 1 || hexValue === "01" || hexValue === "1";
      }

      const result = await opcSession.write({
        nodeId: nodeId,
        attributeId: AttributeIds.Value,
        value: {
          value: {
            dataType: targetDataType,
            arrayType: targetArrayType,
            value: targetValue
          }
        }
      });

      return res.json({
        success: result.equals(StatusCodes.Good),
        statusCode: result.toString(),
        nodeId,
        dataType: dataType || "ByteString",
        hexWritten: buf.toString("hex").toUpperCase()
      });
    } else {
      return res.json({
        success: false,
        statusCode: "BadNotConnected",
        message: "Keine aktive OPC UA Session verbunden. Bitte Diagnosescan oder Reconnect ausführen.",
        nodeId,
        hexWritten: buf.toString("hex").toUpperCase()
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.post("/api/diagnostics/custom-read", async (req, res) => {
  const { nodeId } = req.body;
  if (!nodeId) return res.status(400).json({ error: "nodeId erforderlich" });

  try {
    if (opcSession && isConnected) {
      const dataVal = await opcSession.read({
        nodeId: nodeId,
        attributeId: AttributeIds.Value
      });

      let hex = "";
      const val = dataVal.value?.value;
      if (Buffer.isBuffer(val)) hex = val.toString("hex").toUpperCase();
      else if (Array.isArray(val)) hex = Buffer.from(val).toString("hex").toUpperCase();
      else if (val !== undefined) hex = String(val);

      return res.json({
        success: dataVal.statusCode.equals(StatusCodes.Good),
        statusCode: dataVal.statusCode.toString(),
        value: val,
        rawHex: hex,
        dataType: dataVal.value?.dataType !== undefined ? DataType[dataVal.value.dataType] : "Unknown"
      });
    } else {
      return res.json({
        success: false,
        statusCode: "BadNotConnected",
        message: "Keine aktive OPC UA Session vorhanden."
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// CODESYS PROFINET Soft-SPS Endpoints
// ----------------------------------------------------
app.get("/api/profinet/status", (req, res) => {
  try {
    const report = runProfinetDiagnosticScan(endpointUrl.replace("opc.tcp://", "").split(":")[0] || "10.191.199.182");
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: "Fehler beim Abrufen des PROFINET-Status: " + err.message });
  }
});

app.post("/api/profinet/scan", (req, res) => {
  try {
    const targetIp = req.body.masterIp || endpointUrl.replace("opc.tcp://", "").split(":")[0] || "10.191.199.182";
    const report = runProfinetDiagnosticScan(targetIp);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: "PROFINET Diagnosescan fehlgeschlagen: " + err.message });
  }
});

app.post("/api/profinet/plc-state", (req, res) => {
  const { state } = req.body;
  if (!state || !["RUN", "STOP", "EXCEPTION"].includes(state)) {
    return res.status(400).json({ error: "Ungültiger Zustand. Erlaubt: RUN, STOP, EXCEPTION" });
  }
  const result = setSoftPlcState(state);
  res.json(result);
});

app.get("/api/profinet/download/gsdml", (req, res) => {
  res.setHeader("Content-Disposition", 'attachment; filename="GSDML-V2.35-Baumer-CM50I-PN-2024.xml"');
  res.setHeader("Content-Type", "application/xml");
  res.send(GSDML_BAUMER_CM50I_PN_XML);
});

app.get("/api/profinet/download/st", (req, res) => {
  res.setHeader("Content-Disposition", 'attachment; filename="MAIN_PRG.st"');
  res.setHeader("Content-Type", "text/plain");
  res.send(CODESYS_STRUCTURED_TEXT_PLC_PRG);
});

app.get("/api/profinet/download/setup-script", (req, res) => {
  res.setHeader("Content-Disposition", 'attachment; filename="setup_pi5_profinet_codesys.sh"');
  res.setHeader("Content-Type", "application/x-sh");
  res.send(PI5_OFFLINE_SETUP_SCRIPT);
});

app.post("/api/diagnostics/reconnect", async (req, res) => {
  const { endpoint, username, password } = req.body;
  if (username) process.env.OPC_USERNAME = username;
  if (password) process.env.OPC_PASSWORD = password;
  if (endpoint) process.env.BAUMER_OPCUA_ENDPOINT = endpoint;

  try {
    if (opcSession) {
      try { await opcSession.close(); } catch(e) {}
    }
    if (opcClient) {
      try { await opcClient.disconnect(); } catch(e) {}
    }
    isConnected = false;
    setupOpcUa().catch(console.error);
    res.json({ success: true, message: "Verbindungsaufbau neu gestartet" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Server Startup & Sockets
// ----------------------------------------------------
async function startServer() {
  await setupDatabase();
  setupOpcUa().catch(console.error);

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });

  // Initialize Hardware GPIOs on Raspberry Pi
  let Gpio: any;
  let x5Button: any = null;
  let x6Sensor: any = null;
  let x7Relay: any = null;
  let statusLed: any = null;

  try {
    Gpio = _require('onoff').Gpio;
    x5Button = new Gpio(17, 'in', 'both'); // Pin 11 - Start/Totmann
    x6Sensor = new Gpio(27, 'in', 'both'); // Pin 13 - Home Sensor
    x7Relay = new Gpio(22, 'out');         // Pin 15 - Relay
    statusLed = new Gpio(23, 'out');       // Pin 16 - Pi Status LED

    statusLed.writeSync(1);
    console.log("Hardware GPIOs (onoff) initialisiert.");
  } catch (err) {
    console.log("Running in standard mode without direct GPIO access.");
  }

  // Socket connection
  io.on('connection', (socket) => {
    socket.emit('status_update', {
      connected: isConnected,
      state,
      statusInfo: status_info,
      liveTorque: cur_nm,
      peakTorque: peak_nm,
      motorPositionDeg: cur_deg,
      motorPositionInc: cur_pos,
      breakPosDeg: break_pos,
      ledColor: last_led_sent,
      selectedProgram: selected_program,
      x3Mode: x3_mode,
      x3Active: x3_active,
      x5Active: x5_active,
      isReady: x3_active,
      settings
    });

    socket.on('execute_command', (data) => {
      if (data.action === 'select_program') executeSelectProgram(data.program);
      else if (data.action === 'set_x3') executeSetX3(data.x3Active, data.x3Mode);
      else if (data.action === 'toggle_x3') executeSetX3();
      else if (data.action === 'set_x5') executeSetX5(Boolean(data.x5Pressed));
      else if (data.action === 'start') executeStartSequence();
      else if (data.action === 'stop') executeEmergencyStop();
      else if (data.action === 'go_home') executeGoHome();
      else if (data.action === 'jog') executeJog(data.dir);
      else if (data.action === 'reset') executeReset();
      else if (data.action === 'tare') tareTorque();
    });
  });

  // Main 10Hz Broadcast & State Machine Loop
  setInterval(() => {
    tickStateMachine();

    let gpioState = { x5: false, x6: false, x7: false, led: false };
    if (Gpio && x5Button) {
      try {
        gpioState.x5 = x5Button.readSync() === 1;
        gpioState.x6 = x6Sensor.readSync() === 1;
        gpioState.x7 = x7Relay.readSync() === 1;
        gpioState.led = statusLed.readSync() === 1;
      } catch(e) {}
    }

    io.emit('status_update', {
      connected: isConnected,
      state,
      statusInfo: status_info,
      liveTorque: cur_nm,
      peakTorque: peak_nm,
      motorPositionDeg: cur_deg,
      motorPositionInc: cur_pos,
      breakPosDeg: break_pos,
      ledColor: last_led_sent,
      selectedProgram: selected_program,
      x3Mode: x3_mode,
      x3Active: x3_active,
      x5Active: x5_active,
      isReady: x3_active,
      gpio: gpioState,
      settings,
      liveCurve: current_curve.slice(-80)
    });
  }, 100);

  const distPath = path.join(process.cwd(), 'dist');
  const indexFile = path.join(distPath, 'index.html');
  
  // Im Edge-System (Raspberry Pi) wird meistens "node dist/server.cjs" ausgeführt.
  // In diesem Fall wollen wir die produktiven Dateien ausliefern, ohne Vite zu laden.
  const isCompiled = process.argv[1] && process.argv[1].endsWith('server.cjs');
  const isProduction = process.env.NODE_ENV === "production" || isCompiled;

  if (isProduction && fs.existsSync(indexFile)) {
    console.log("Auslieferung der produktiven Frontend-Dateien aus /dist");
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(indexFile);
    });
  } else {
    console.log("Entwicklungsmodus: Lade Vite (kann dauern)...");
    const viteMod = await import("vite");
    const vite = await viteMod.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
  });
}

startServer();
