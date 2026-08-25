const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('VariantArrayType')) {
    code = code.replace(/import \{ ([^}]+) \} from "node-opcua";/, 'import { $1, VariantArrayType } from "node-opcua";');
}
code = code.replace(/opcua\.VariantArrayType/g, 'VariantArrayType');
fs.writeFileSync('server.ts', code);
