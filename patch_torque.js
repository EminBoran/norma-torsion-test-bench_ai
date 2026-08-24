import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// Torque Reading fix from Node-RED V31:
// cur_nm = -((((raw / 27648) * 20) - 10) * 2.5)
// Let's implement this exactly

code = code.replace(/currentTorque\s*=\s*\([^;]+;/g, `
              // Node-RED Formula:
              // raw = hexToS16
              // cur_nm = -((((raw / 27648) * 20) - 10) * 2.5)
              let raw = buf.readInt16BE(0); // Assuming Big-Endian for raw hexToS16
              currentTorque = -((((raw / 27648) * 20) - 10) * 2.5);
`);

fs.writeFileSync('server.ts', code);
console.log("Torque calculation patched.");
