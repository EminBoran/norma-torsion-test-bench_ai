const fs = require('fs');
let code = fs.readFileSync('src/context/TestBenchContext.tsx', 'utf8');

// Fix the syntax error
code = code.replace(/const \[opcUaConnected,\n    serverLogs, setOpcUaConnected\] = useState\(false\);/g, "const [opcUaConnected, setOpcUaConnected] = useState(false);");

fs.writeFileSync('src/context/TestBenchContext.tsx', code);
