const fs = require('fs');
let env = fs.readFileSync('.env.example', 'utf8');

if (!env.includes('OPC_USERNAME')) {
    env += '\nOPC_USERNAME=admin';
    env += '\nOPC_PASSWORD=admin';
    fs.writeFileSync('.env.example', env);
}
