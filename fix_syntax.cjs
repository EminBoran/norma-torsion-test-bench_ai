const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/}\);\n}\);/g, '});');
fs.writeFileSync('server.ts', code);
