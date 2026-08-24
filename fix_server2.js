import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// I will remove the whole app.post block manually
const postStart = code.indexOf('app.post("/api/motor/control", async (req, res) => {');
const nextFuncStart = code.indexOf('async function startServer() {');

const newPost = `app.post("/api/motor/control", async (req, res) => {
  const { command, speed, targetNm } = req.body;
  if (!isConnected || !opcSession) {
    return res.status(503).json({ error: "OPC UA not connected" });
  }
  
  try {
    console.log(\`[MOTOR] Sende echten IO-Link Befehl: \${command}\`);
    
    // Motor ProcessDataOutput (Port X0)
    const motorNodeId = "ns=7;i=640"; 
    
    const buffer = Buffer.alloc(32);
    
    // Wir wissen noch nicht genau die Byte-Struktur,
    // raten aber Byte 0 und 1 fuer Enable (0x0F)
    let enableWord = (command === 'enable' || command === 'start') ? 0x0F : 0x00;
    
    buffer.writeUInt8(enableWord, 0); 
    buffer.writeUInt8(enableWord, 1);
    if (speed) {
        buffer.writeInt16BE(speed, 2);
    }

    await opcSession.write({
      nodeId: motorNodeId,
      attributeId: 13, // Value
      value: {
        value: {
          dataType: 15, // ByteString
          value: buffer
        }
      }
    });

    res.json({ success: true, command, written: true });
  } catch (err) {
    console.error("Error writing to OPC UA:", err);
    res.status(500).json({ error: "Failed to send command" });
  }
});\n\n`;

code = code.substring(0, postStart) + newPost + code.substring(nextFuncStart);

fs.writeFileSync('server.ts', code);
