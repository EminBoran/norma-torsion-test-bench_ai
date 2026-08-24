const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startIndex = code.indexOf('app.post("/api/motor/control"');
const endIndex = code.indexOf('});', startIndex);

console.log(startIndex, endIndex);
