import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const postStart = code.indexOf('app.post("/api/motor/control", async (req, res) => {');
const postEnd = code.indexOf('});', postStart) + 3;

const newPost = `app.post("/api/motor/control", async (req, res) => {
  const { command, speed, targetNm } = req.body;
  if (!isConnected || !opcSession) {
    return res.status(503).json({ error: "OPC UA not connected" });
  }
  
  try {
    console.log(\`[MOTOR] Sende echten IO-Link Befehl: \${command}\`);
    
    // Motor ProcessDataOutput (Port X0)
    const motorNodeId = "ns=7;i=640"; 
    
    // IO-Link Baumer erwartet exakt 32 Bytes
    const buffer = Buffer.alloc(32);
    
    // Halstrup Walcher PSE: 
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
});`;

code = code.substring(0, postStart) + newPost + code.substring(postEnd);

// Fix Torque Reading
code = code.replace(/nodeId:\s*"ns=6;i=98844"/g, 'nodeId: "ns=7;i=691"');
code = code.replace(/currentTorque\s*=\s*parseFloat\(dataValue\.value\.value\.toString\(\)\);/g, `
        try {
           const buf = dataValue.value.value;
           if (Buffer.isBuffer(buf) && buf.length >= 2) {
              const rawValBE = buf.readInt16BE(0);
              const rawValLE = buf.readInt16LE(0);
              currentTorque = (Math.abs(rawValBE) < Math.abs(rawValLE) ? Math.abs(rawValBE) : Math.abs(rawValLE)) / 100.0;
           }
        } catch(e) {}
`);

fs.writeFileSync('server.ts', code);
