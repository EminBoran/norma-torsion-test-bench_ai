const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Motor Output Data NodeID aktualisieren (Port X0)
content = content.replace(/"ns=6;i=33285"/g, '"ns=7;i=640"');
// Buffer auf 32 Bytes erweitern, da der Baumer Master 32 Bytes erwartet
content = content.replace(/Buffer\.alloc\(2\)/g, 'Buffer.alloc(32)');

// 2. Sensor Input Data NodeID aktualisieren (Port X1)
content = content.replace(/"ns=6;i=33286"/g, '"ns=7;i=691"');

// 3. Etwas sichereres Torque Parsing für den Analog-Konverter
// (Analog-Wandler von Baumer geben meist 16-Bit Integer Little-Endian oder Big-Endian aus)
content = content.replace(/const rawVal = buf\.readInt16BE\(0\);/g, `
              // Wir lesen die ersten beiden Bytes aus
              const rawValBE = buf.readInt16BE(0);
              const rawValLE = buf.readInt16LE(0);
              // HBM T22 über Baumer Analog-Wandler
              const rawVal = Math.abs(rawValBE) < Math.abs(rawValLE) ? Math.abs(rawValBE) : Math.abs(rawValLE); 
`);

fs.writeFileSync('server.ts', content);
console.log("Server patched with final NodeIDs.");
