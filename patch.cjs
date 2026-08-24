const fs = require('fs');
let content = fs.readFileSync('src/context/TestBenchContext.tsx', 'utf8');

// Replace the mock setInterval block inside TestBenchProvider
content = content.replace(/const interval = setInterval\(async \(\) => \{[\s\S]*?\}, 100\);/g, `
    // Mock simulation removed completely for production mode.
    // Torque data is now only driven by the live OPC-UA connection from the backend.
    const interval = setInterval(async () => {
      const isRunning = x3Status === 'running';
      const isSeqRunning = sequenceStateRef.current?.isRunning;

      setTorqueData(prev => {
        // Freeze graph after step 5 dwell time is over (which means we reached step 6)
        if (isSeqRunning && sequenceStateRef.current?.currentStep && sequenceStateRef.current.currentStep >= 6) {
          return prev;
        }
        
        // Wait for X5 trigger to start recording
        if (isSeqRunning && prev.length === 0) {
          const step = sequenceStateRef.current?.currentStep;
          const isX5Held = sequenceStateRef.current?.isX5Held;
          if (step !== 1 || !isX5Held) {
            return prev; // Do not record until step 1 and X5 is pressed!
          }
        }
        
        // ONLY RECORD LIVE OPC UA DATA! No random jitter.
        if (isRunning && opcUaConnected) {
            const t = prev.length > 0 ? prev[prev.length - 1].time + 1 : 0;
            const newPoint = {
              time: t,
              torque: liveTorqueRef.current,
              position: motorPosRef.current,
              speedRpm: motorSpeedRpm
            };
            
            // Peak drop detection logic
            if (sequenceStateRef.current?.currentStep === 3) {
              const currentMax = Math.max(...prev.map(p => p.torque), 0);
              if (liveTorqueRef.current > currentMax) {
                sequenceStateRef.current.maxTorque = liveTorqueRef.current;
              }
              const breakThreshold = currentMax * (1 - (sequenceConfigRef.current.step3_breakDropPercent / 100));
              if (currentMax > 1.0 && liveTorqueRef.current < breakThreshold) {
                sequenceStateRef.current.peakDropDetected = true;
              }
            }
            return [...prev, newPoint];
        }
        return prev;
      });
    }, 100);
`);

fs.writeFileSync('src/context/TestBenchContext.tsx', content);
