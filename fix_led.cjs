const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// I will make sure the LED logic is explicitly handling the Baumer IO-Link LED
const searchStr = `if (pin === 'LED' && statusLed) statusLed.writeSync(state ? 1 : 0);`;
const ledBlock = `if (pin === 'LED' && statusLed) statusLed.writeSync(state ? 1 : 0);
          
          // Baumer LED an Port X6 steuern (1 Byte Output Data)
          if (pin === 'LED' && opcSession && isConnected) {
              const ledBuffer = Buffer.alloc(32);
              // Node-RED Codes: 01=Gruen, 02=Gelb, 04=Rot, 05=Blau
              ledBuffer.writeUInt8(state ? 0x01 : 0x00, 0); 
              opcSession.write({
                  nodeId: "ns=7;i=646", // IolOutputDataPinCq Port 6 (basierend auf Port-Offset +6 für X6)
                  attributeId: 13,
                  value: { value: { dataType: 15, value: ledBuffer } }
              }).catch(e => console.error("LED OPC UA error", e));
          }`;

if (!code.includes("ns=7;i=646")) {
    code = code.replace(searchStr, ledBlock);
    fs.writeFileSync('server.ts', code);
    console.log("LED Logic patched.");
} else {
    console.log("LED Logic already present.");
}
