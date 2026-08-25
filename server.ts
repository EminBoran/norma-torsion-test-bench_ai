import fs from "fs";
import http from "http";
import express from "express";
import path from "path";
import cors from "cors";
import { OPCUAClient, AttributeIds, ClientSubscription, ClientMonitoredItem, TimestampsToReturn, DataType } from "node-opcua";
import { Server } from "socket.io";
import * as dotenv from "dotenv";
import { createRequire } from "module";

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
const MOTOR_RIGHT = "000000000011"; // 5 bytes 0x00, byte 5: 0x11
const MOTOR_LEFT  = "000000000012"; // 5 bytes 0x00, byte 5: 0x12

const LED_OFF    = 0x00;
const LED_GREEN  = 0x01;
const LED_YELLOW = 0x02;
const LED_RED    = 0x04;
const LED_BLUE   = 0x05;

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
  tester_name: "Pruefer",
  article_id: "NORM-TORQUE-01",
  serial_number: "SN-" + Math.floor(10000 + Math.random() * 90000),
  torque_offset: 0.0
};

// ----------------------------------------------------
// State Machine Variables
// ----------------------------------------------------
let state = 0; // 0=IDLE, 1=PHASE1 (Anfahren), 2=PHASE2 (Pause), 3=PHASE3 (Prüfung), 4=PHASE4 (Nachlauf), 5=PHASE5 (Standstill), 10=HOMING
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
let status_info = "Bereit (Idle)";
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
  return hex + "0014"; // 12 chars = 6 bytes
}

// Helper to convert hex string to 32-byte OPC UA Buffer
function hexTo32ByteBuffer(hexStr: string): Buffer {
  const buf = Buffer.alloc(32);
  const data = Buffer.from(hexStr, 'hex');
  data.copy(buf, 0);
  return buf;
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
const NODE_LED_OUT   = "ns=7;i=646"; // Port X6 Output (IFM Button LED)
const NODE_HOME_IN   = "ns=7;i=696"; // Port X6 Input (Home Button)
const NODE_DEADMAN_IN= "ns=7;i=697"; // Port X7 Input (Totmann Switch)

async function writeOpcNode(nodeId: string, buffer: Buffer): Promise<boolean> {
  if (!opcSession || !isConnected) return false;
  try {
    await opcSession.write({
      nodeId: nodeId,
      attributeId: AttributeIds.Value,
      value: {
        value: {
          dataType: DataType.ByteString,
          value: buffer
        }
      }
    });
    return true;
  } catch (err: any) {
    console.error(`[OPC UA] Error writing to ${nodeId}:`, err.message);
    return false;
  }
}

async function sendMotorCommand(hexCmd: string): Promise<boolean> {
  const buf = hexTo32ByteBuffer(hexCmd);
  console.log(`[MOTOR] Sende Hex: ${hexCmd} an ${NODE_MOTOR_OUT}`);
  return await writeOpcNode(NODE_MOTOR_OUT, buf);
}

async function sendLedCommand(ledColorByte: number): Promise<boolean> {
  const buf = Buffer.alloc(32);
  buf.writeUInt8(ledColorByte, 0);
  last_led_sent = ledColorByte;
  return await writeOpcNode(NODE_LED_OUT, buf);
}

// ----------------------------------------------------
// OPC UA Connect & Monitored Items
// ----------------------------------------------------
async function setupOpcUa() {
  try {
    opcClient = OPCUAClient.create({
      endpointMustExist: false,
      connectionStrategy: {
        maxRetry: 10,
        initialDelay: 1000,
        maxDelay: 5000,
      }
    });

    console.log(`[OPC UA] Verbinde zu ${endpointUrl}...`);
    await opcClient.connect(endpointUrl);
    isConnected = true;
    console.log("[OPC UA] Verbunden mit Baumer Master!");

    opcSession = await opcClient.createSession();
    console.log("[OPC UA] Session erfolgreich erstellt!");

    const subscription = ClientSubscription.create(opcSession, {
      requestedPublishingInterval: 50,
      requestedLifetimeCount: 100,
      requestedMaxKeepAliveCount: 10,
      maxNotificationsPerPublish: 100,
      publishingEnabled: true,
      priority: 10
    });

    // 1. Monitor Torque Sensor (Port X1 Input: ns=7;i=691)
    const torqueItem = ClientMonitoredItem.create(
      subscription,
      { nodeId: NODE_TORQUE_IN, attributeId: AttributeIds.Value },
      { samplingInterval: 50, discardOldest: true, queueSize: 10 },
      TimestampsToReturn.Both
    );

    torqueItem.on("changed", (dataValue) => {
      if (dataValue?.value?.value) {
        try {
          const buf = dataValue.value.value;
          if (Buffer.isBuffer(buf) && buf.length >= 2) {
            // Node-RED Formula:
            // raw = hexToS16(val.substring(0, 4))
            // cur_nm = -((((raw / 27648) * 20) - 10) * 2.5 - offset)
            const raw = buf.readInt16BE(0);
            const calculated = -((((raw / 27648.0) * 20.0) - 10.0) * 2.5 - settings.torque_offset);
            cur_nm = Number(calculated.toFixed(3));
          }
        } catch (e: any) {
          console.error("Torque decode error:", e.message);
        }
      }
    });

    // 2. Monitor Motor Position (Port X0 Input: ns=7;i=690)
    const motorItem = ClientMonitoredItem.create(
      subscription,
      { nodeId: NODE_MOTOR_IN, attributeId: AttributeIds.Value },
      { samplingInterval: 50, discardOldest: true, queueSize: 10 },
      TimestampsToReturn.Both
    );

    motorItem.on("changed", (dataValue) => {
      if (dataValue?.value?.value) {
        try {
          const buf = dataValue.value.value;
          if (Buffer.isBuffer(buf) && buf.length >= 4) {
            // Node-RED Formula:
            // pos = hexToS32(val.substring(0, 8))
            // cur_deg = (cur_pos - home_pos) * 0.9
            const pos = buf.readInt32BE(0);
            cur_pos = pos;
            cur_deg = Number(((cur_pos - settings.home_pos) * 0.9).toFixed(1));
          }
        } catch (e: any) {
          console.error("Motor pos decode error:", e.message);
        }
      }
    });

    // Set initial LED to Blue (Ready)
    sendLedCommand(LED_BLUE);

  } catch (err: any) {
    console.warn("[OPC UA] Verbindung fehlgeschlagen (Mock/Fallback aktiv):", err.message);
    isConnected = false;
  }
}

// ----------------------------------------------------
// State Machine Engine (Runs at 100ms)
// ----------------------------------------------------
function tickStateMachine() {
  const now = Date.now();
  const start_tol_inc = Math.max(1, Math.round(settings.start_tolerance_deg / 0.9));

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
    status_info = "PHASE 3: Prüffahrt läuft";
  }
  // State 3: Phase 3 (Bruch erkennen via Peak Drop)
  else if (
    state === 3 &&
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
    status_info = `Prüfung erfolgreich abgeschlossen! Max: ${peak_nm.toFixed(2)} Nm`;

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
          JSON.stringify(settings)
        ]
      ).catch((e: any) => console.error("DB Save error:", e));
    }
  }
  // State 10: Homing Sequence
  else if (state === 10) {
    const atHome = Math.abs(cur_pos - settings.home_pos) <= settings.home_tol_inc;
    const isTimeout = now > homing_until;

    if (atHome) {
      state = 0;
      sendMotorCommand(MOTOR_STOP);
      sendLedCommand(LED_BLUE);
      status_info = "Home-Position (0.0°) erreicht.";
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
function executeStartSequence() {
  const now = Date.now();
  const start_tol_inc = Math.max(1, Math.round(settings.start_tolerance_deg / 0.9));

  // Check if at home
  if (Math.abs(cur_pos - settings.home_pos) > start_tol_inc) {
    sendLedCommand(LED_RED);
    status_info = `Start blockiert: Motor nicht bei 0° (Ist: ${cur_deg.toFixed(1)}°). Bitte zuerst "Go Home" fahren!`;
    return { success: false, message: status_info };
  }

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
  status_info = `PHASE 1: Anfahren gestartet (Prüfung #${total_test_count})`;

  return { success: true, message: status_info };
}

function executeEmergencyStop() {
  state = 0;
  sendMotorCommand(MOTOR_STOP);
  sendLedCommand(LED_RED);
  status_info = "NOT-HALT ausgelöst! Motor gestoppt.";
  return { success: true, message: status_info };
}

function executeGoHome() {
  if (state !== 0) {
    return { success: false, message: "Homing nur im Stillstand (Idle) möglich." };
  }

  state = 10;
  homing_until = Date.now() + settings.homing_timeout_ms;
  
  const posCmd = getPosHexCmd(settings.home_pos);
  sendMotorCommand(posCmd);
  sendLedCommand(LED_YELLOW);
  status_info = `Homing gestartet: Ziel ${settings.home_pos} Inkremente (0.0°)`;

  return { success: true, message: status_info };
}

function executeJog(dir: 'left' | 'right' | 'stop') {
  if (state !== 0 && state !== 10) {
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
  peak_nm = 0.0;
  break_pos = 0.0;
  break_deg = null;
  t_dwell = 0;
  standstill_start = 0;
  start_time = 0;
  current_curve = [];
  sendMotorCommand(MOTOR_STOP);
  sendLedCommand(LED_BLUE);
  status_info = "System zurückgesetzt. Bereit.";
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
    settings
  });
});

app.post("/api/control", async (req, res) => {
  const { action, dir } = req.body;
  let result: any = { success: false, message: "Unbekannte Aktion" };

  switch (action) {
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
      settings
    });

    socket.on('execute_command', (data) => {
      if (data.action === 'start') executeStartSequence();
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
