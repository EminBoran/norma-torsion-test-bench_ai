const fs = require('fs');
let content = fs.readFileSync('src/context/TestBenchContext.tsx', 'utf8');

// Replace toggleX3
content = content.replace(/const toggleX3 = useCallback\(\(\) => \{[\s\S]*?\}, \[x3Status, activeProgram, addLog\]\);/g, `
  const toggleX3 = useCallback(async () => {
    if (x3Status === 'idle' || x3Status === 'stopping') {
      setX3Status('starting');
      addLog('Starte Antrieb (Sende Freigabe an OPC UA und GPIO)...', 'x3', 'X3-START');
      
      try {
        if (socket) {
           socket.emit('set_gpio', { pin: 'X7', state: true });
        }
        await fetch('http://localhost:3000/api/motor/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'enable', speed: 10, targetNm: 25 })
        });
      } catch (e) { console.error(e); }

      setTimeout(() => {
        setX3Status('running');
        setX5Status('armed');
        setMotorSpeedRpm(10);
        addLog('Antrieb BEREIT und Freigabe erteilt.', 'x3', 'X3-RUNNING');
      }, 600);
    } else {
      setX3Status('stopping');
      addLog('Stoppe Antrieb (Entziehe Freigabe)...', 'x3', 'X3-STOP');
      
      try {
        if (socket) {
           socket.emit('set_gpio', { pin: 'X7', state: false });
        }
        await fetch('http://localhost:3000/api/motor/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'disable', speed: 0, targetNm: 0 })
        });
      } catch (e) { console.error(e); }

      setTimeout(() => {
        setX3Status('idle');
        setX5Status('idle');
        setMotorSpeedRpm(0);
        addLog('Antrieb DEAKTIVIERT (Standby).', 'info', 'SYSTEM');
      }, 500);
    }
  }, [x3Status, activeProgram, addLog, socket]);
`);

// Also fix opcUa connection default
content = content.replace(/const \[opcUaConnected, setOpcUaConnected\] = useState\(true\);/g, `const [opcUaConnected, setOpcUaConnected] = useState(false);`);

fs.writeFileSync('src/context/TestBenchContext.tsx', content);
