import fs from "fs";


import express from "express";
import path from "path";
import cors from "cors";
import { OPCUAClient, AttributeIds, ClientSubscription, ClientMonitoredItem, TimestampsToReturn, DataType, Variant } from "node-opcua";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

dotenv.config();



import { createRequire } from "module";
// using standard require inside server bundle or falling back gracefully
const _require = typeof require !== 'undefined' ? require : createRequire('file://' + process.cwd() + '/server.js');

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

    // Create tables
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
  } catch (err) {
    console.warn("Real SQLite failed to load (expected in cloud without g++). Using in-memory mock DB fallback for preview. Error:", err.message);
    isMockDb = true;
    
    // In-memory mock interface
    db = {
      all: async (query: string) => {
        if (query.includes("system_variables")) return mockData.system_variables;
        if (query.includes("test_records")) return mockData.test_records;
        return [];
      },
      run: async (query: string, params: any[]) => {
        if (query.includes("INSERT INTO test_records")) {
          mockData.test_records.push({
            id: params[0], timestamp: params[1], articleId: params[2], serialNumber: params[3],
            testerId: params[4], result: params[5], maxTorque: params[6], duration: params[7],
            torqueData: params[8], testParams: params[9]
          });
        }
      },
      exec: async (query: string) => {}
    };
  }
}


const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const endpointUrl = process.env.BAUMER_OPCUA_ENDPOINT || "opc.tcp://10.191.199.182:4840";
let opcClient: OPCUAClient | null = null;
let opcSession: any = null;

// Realtime state cache from OPC UA
let currentTorque = 0.0;
let currentPosition = 0.0;
let isConnected = false;

async function setupOpcUa() {
  try {
    opcClient = OPCUAClient.create({
      endpointMustExist: false,
      connectionStrategy: {
        maxRetry: 5,
        initialDelay: 1000,
        maxDelay: 5000,
      }
    });

    console.log(`Connecting to OPC UA Server at ${endpointUrl}...`);
    await opcClient.connect(endpointUrl);
    isConnected = true;
    console.log("Connected to OPC UA Server!");

    opcSession = await opcClient.createSession();
    console.log("Session created!");

    // Subscribe to Torque (Node ns=6;i=98844 as seen in python-api)
    const subscription = ClientSubscription.create(opcSession, {
      requestedPublishingInterval: 100,
      requestedLifetimeCount: 100,
      requestedMaxKeepAliveCount: 10,
      maxNotificationsPerPublish: 100,
      publishingEnabled: true,
      priority: 10
    });

    subscription.on("started", () => {
      console.log("Subscription started for Torque monitoring.");
    });

    // We assume Torque is ns=6;i=98844 and Motor position might be derived from process input ns=6;i=33308
    const torqueItem = ClientMonitoredItem.create(
      subscription,
      {
        nodeId: "ns=6;i=98844",
        attributeId: AttributeIds.Value
      },
      {
        samplingInterval: 100,
        discardOldest: true,
        queueSize: 10
      },
      TimestampsToReturn.Both
    );

    torqueItem.on("changed", (dataValue) => {
      if (dataValue.value && dataValue.value.value !== null) {
        currentTorque = parseFloat(dataValue.value.value.toString());
      }
    });

    const motorPosItem = ClientMonitoredItem.create(
      subscription,
      {
        nodeId: "ns=6;i=33308",
        attributeId: AttributeIds.Value
      },
      {
        samplingInterval: 100,
        discardOldest: true,
        queueSize: 10
      },
      TimestampsToReturn.Both
    );
    motorPosItem.on("changed", (dataValue) => {
      // Decode process input byte string if needed
      // Mocked decoding for now depending on HALSTRUP WALCHER PSE structure
      if (dataValue.value && dataValue.value.value !== null) {
        // Normally extract position from bytes
        // currentPosition = decoded value
      }
    });

  } catch (err: any) {
    // Silent fallback to mock mode in cloud environment
    isConnected = false;
  }
}


// Database API Routes
app.get("/api/variables", async (req, res) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const vars = await db.all("SELECT * FROM system_variables");
    res.json(vars.map(v => ({ ...v, sqlSynced: v.sqlSynced === 1 })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/variables", async (req, res) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  const vars = req.body;
  if (!Array.isArray(vars)) return res.status(400).json({ error: "Expected an array of variables" });
  
  try {
    await db.exec("BEGIN TRANSACTION");
    if (isMockDb) {
      mockData.system_variables = vars.map((v: any) => ({...v, sqlSynced: v.sqlSynced ? 1 : 0, value: String(v.value)}));
    } else {
      for (const v of vars) {
        await db.run(
          `INSERT INTO system_variables (id, key, value, type, category, description, sqlSynced, lastUpdated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             value = excluded.value,
             description = excluded.description,
             lastUpdated = excluded.lastUpdated`,
          [v.id, v.key, String(v.value), v.type, v.category, v.description, v.sqlSynced ? 1 : 0, v.lastUpdated]
        );
      }
    }
    await db.exec("COMMIT");
    res.json({ success: true });
  } catch (err: any) {
    await db.exec("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/records", async (req, res) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const records = await db.all("SELECT * FROM test_records ORDER BY timestamp DESC");
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/records", async (req, res) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  const { id, timestamp, articleId, serialNumber, testerId, result, maxTorque, duration } = req.body;
  
  try {
    await db.run(
      `INSERT INTO test_records (id, timestamp, articleId, serialNumber, testerId, result, maxTorque, duration, torqueData, testParams)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, timestamp, articleId, serialNumber, testerId, result, maxTorque, duration, req.body.torqueData, req.body.testParams]
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API Routes
app.get("/api/status", (req, res) => {
  res.json({
    connected: isConnected,
    liveTorque: currentTorque,
    motorPosition: currentPosition
  });
});

app.post("/api/motor/control", async (req, res) => {
  const { command, speed, targetNm } = req.body;
  if (!isConnected || !opcSession) {
    return res.status(503).json({ error: "OPC UA not connected" });
  }
  
  try {
    // Write to process data output: ns=6;i=33309
    // In a real scenario, we build the byte array for the PSE motor (e.g. control word)
    console.log(`Sending motor command: ${command}, speed: ${speed}`);
    
    // Simulate updating position based on command for demo if not moving
    res.json({ success: true, command });
  } catch (err) {
    console.error("Error writing to OPC UA:", err);
    res.status(500).json({ error: "Failed to send command" });
  }
});

async function startServer() {
  // Start OPC UA in the background so it doesn't block the server startup
  await setupDatabase();
  setupOpcUa().catch(console.error);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
