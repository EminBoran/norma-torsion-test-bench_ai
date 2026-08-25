const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix MOTOR_ constants
code = code.replace(/const MOTOR_RIGHT = "000000000011";/g, 'const MOTOR_RIGHT = "001100000000";');
code = code.replace(/const MOTOR_LEFT  = "000000000012";/g, 'const MOTOR_LEFT  = "001200000000";');

// Fix getPosHexCmd
code = code.replace(
`  const hex = (p >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return hex + "0014"; // 12 chars = 6 bytes`,
`  const hex = (p >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return "0014" + hex; // Control Word first (0014), then 4 bytes Position`
);

fs.writeFileSync('server.ts', code);
