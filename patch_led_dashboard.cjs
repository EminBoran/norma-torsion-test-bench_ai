const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// The logic from Node-RED suggests that the LED is connected to Port 6,
// But the exact behavior depends on the Baumer IO-Link structure. 
// Port X1 (1) is 640.
// Port X2 (2) is 641.
// Port X3 (3) is 642.
// Port X4 (4) is 643.
// Port X5 (5) is 644.
// Port X6 (6) is 645. <-- Ah! The array is 0-indexed in the Baumer for NodeIDs!

// Wait, earlier I found Port X1 was 640. 
// Wait, the documentation said Port 1 output is ns=7;i=640?
// Let's use 645 for X6.

code = code.replace(/"ns=7;i=646"/g, '"ns=7;i=645"');

fs.writeFileSync('server.ts', code);
console.log("LED NodeID updated to X6 (i=645).");
