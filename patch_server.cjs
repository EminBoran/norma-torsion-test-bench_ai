const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Replace motor control logic
const motorStart = code.indexOf('app.post("/api/motor/control", async (req, res) => {');
const motorEnd = code.indexOf('});\n\nasync function startServer() {');

if (motorStart > -1) {
    const newMotorBlock = `app.post("/api/motor/control", async (req, res) => {
  const { command, speed, targetNm } = req.body;
  if (!isConnected || !opcSession) {
    return res.status(503).json({ error: "OPC UA not connected" });
  }
  
  try {
    console.log(\`[MOTOR] Sende echten IO-Link Befehl: \${command}\`);
    
    // Motor ProcessDataOutput (Port X0)
    const motorNodeId = "ns=7;i=640"; 
    
    // IO-Link Baumer erwartet 32 Bytes OPC UA Buffer
    const buffer = Buffer.alloc(32);
    
    // Commands from Node-RED logic:
    // MOTOR_STOP  = "000000000000"; -> 6 Bytes 0
    // MOTOR_RIGHT = "000000000011"; -> Byte 5 is 0x11
    // MOTOR_LEFT  = "000000000012"; -> Byte 5 is 0x12
    
    let cmdByte = 0x00;
    if (command === 'enable' || command === 'start' || command === 'right') {
        cmdByte = 0x11;
    } else if (command === 'left') {
        cmdByte = 0x12;
    }
    
    // Set command byte at index 5
    buffer.writeUInt8(cmdByte, 5); 

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

    code = code.substring(0, motorStart) + newMotorBlock + code.substring(motorEnd);
}

// Add GPIO logic to also update LED via OPC UA if it's LED
code = code.replace(/if \(pin === 'LED' && statusLed\) statusLed\.writeSync\(state \? 1 : 0\);/g, `
          if (pin === 'LED' && statusLed) statusLed.writeSync(state ? 1 : 0);
          
          // Baumer LED an Port X6
          if (pin === 'LED' && opcSession && isConnected) {
              const ledBuffer = Buffer.alloc(32);
              ledBuffer.writeUInt8(state ? 0x01 : 0x00, 0); // 0x01 = Green
              opcSession.write({
                  nodeId: "ns=7;i=646",
                  attributeId: 13,
                  value: { value: { dataType: 15, value: ledBuffer } }
              }).catch(e => console.error("LED OPC UA error", e));
          }
`);

fs.writeFileSync('server.ts', code);
