import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// Also update the position NodeId mapping and formula if possible, but for now we focus on torque and motor.
code = code.replace(/nodeId:\s*"ns=6;i=33308"/g, 'nodeId: "ns=7;i=670"');

fs.writeFileSync('server.ts', code);
