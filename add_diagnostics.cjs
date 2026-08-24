const fs = require('fs');

// 1. Patch server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
if (!serverCode.includes('broadcastLog')) {
    serverCode = serverCode.replace(
        /const io = new Server\(server, \{ cors: \{ origin: "\*" \} \}\);/g,
        `const io = new Server(server, { cors: { origin: "*" } });\n\nconst originalLog = console.log;\nconst originalError = console.error;\nconst logsCache = [];\nfunction broadcastLog(level, args) {\n  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');\n  const logEntry = { timestamp: new Date().toISOString(), level, message: msg };\n  logsCache.push(logEntry);\n  if(logsCache.length > 500) logsCache.shift();\n  io.emit('server_log', logEntry);\n}\nconsole.log = function(...args) { originalLog.apply(console, args); broadcastLog('info', args); };\nconsole.error = function(...args) { originalError.apply(console, args); broadcastLog('error', args); };`
    );
    serverCode = serverCode.replace(
        /socket\.emit\("opc_status", \{ connected: isConnected \}\);/g,
        `socket.emit("opc_status", { connected: isConnected });\n    socket.emit("server_log_history", logsCache);`
    );
    fs.writeFileSync('server.ts', serverCode);
}

// 2. Patch TestBenchContext.tsx
let ctxCode = fs.readFileSync('src/context/TestBenchContext.tsx', 'utf8');
if (!ctxCode.includes('serverLogs: any[]')) {
    ctxCode = ctxCode.replace(/opcUaConnected: boolean;/g, `opcUaConnected: boolean;\n  serverLogs: any[];`);
    ctxCode = ctxCode.replace(/const \[opcUaConnected, setOpcUaConnected\] = useState\(false\);/g, `const [opcUaConnected, setOpcUaConnected] = useState(false);\n  const [serverLogs, setServerLogs] = useState<any[]>([]);`);
    ctxCode = ctxCode.replace(/socket\.on\('opc_status', \(data\) => \{/g, `socket.on('server_log_history', (history) => setServerLogs(history));\n      socket.on('server_log', (log) => setServerLogs(prev => [...prev, log].slice(-500)));\n      socket.on('opc_status', (data) => {`);
    ctxCode = ctxCode.replace(/opcUaConnected,/g, `opcUaConnected,\n    serverLogs,`);
    fs.writeFileSync('src/context/TestBenchContext.tsx', ctxCode);
}

// 3. Patch App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
if (!appCode.includes('Terminal className=')) {
    appCode = appCode.replace(/import \{ Settings, X, Activity, Cpu, Compass \} from 'lucide-react';/g, `import { Settings, X, Activity, Cpu, Compass, Terminal, Copy } from 'lucide-react';`);
    appCode = appCode.replace(/const \[showSettings, setShowSettings\] = useState\(false\);/g, `const [showSettings, setShowSettings] = useState(false);\n  const [showLogs, setShowLogs] = useState(false);`);
    appCode = appCode.replace(/const \{ opcUaConnected, liveTorque, motorPosition, sequenceState \} = useTestBench\(\);/g, `const { opcUaConnected, liveTorque, motorPosition, sequenceState, serverLogs } = useTestBench();`);
    
    const logsModal = `
        {showLogs && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex flex-col p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center"><Terminal className="mr-2" /> System-Diagnose & Logs</h2>
              <div className="flex space-x-3">
                <button onClick={() => navigator.clipboard.writeText(serverLogs.map(l => \`[\${l.timestamp}] \${l.level.toUpperCase()}: \${l.message}\`).join('\\n'))} className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm cursor-pointer"><Copy className="w-4 h-4 mr-1.5"/> Kopieren</button>
                <button onClick={() => setShowLogs(false)} className="p-1.5 bg-slate-800 hover:bg-red-600 text-white rounded cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 bg-black rounded-lg p-4 overflow-y-auto font-mono text-xs text-green-400 border border-slate-700 shadow-inner flex flex-col-reverse">
              <div>
              {serverLogs.map((log, i) => (
                <div key={i} className={log.level === 'error' ? 'text-red-400 py-0.5' : 'text-green-400 py-0.5 border-b border-slate-800/50'}>
                  <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                </div>
              ))}
              {serverLogs.length === 0 && <div className="text-slate-500 italic">Warte auf Logs vom OPC UA Server...</div>}
              </div>
            </div>
          </div>
        )}
    `;
    
    appCode = appCode.replace(/\{showSettings && \(/g, logsModal + '\n        {showSettings && (');
    
    const logButton = `
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-green-400 rounded-md transition-colors cursor-pointer border border-slate-700 flex items-center space-x-1"
            title="Diagnose Konsole"
          >
            <Terminal className="w-4 h-4" />
            <span className="text-xs font-bold">Logs</span>
          </button>
    `;
    appCode = appCode.replace(/<button \n            onClick=\{\(\) => setShowSettings\(!showSettings\)\}/g, logButton + '\n          <button \n            onClick={() => setShowSettings(!showSettings)}');
    
    fs.writeFileSync('src/App.tsx', appCode);
}
