const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/import \{ Settings, X, Activity, Cpu, Compass \} from 'lucide-react';/, "import { Settings, X, Activity, Cpu, Compass, Terminal, Copy } from 'lucide-react';");
fs.writeFileSync('src/App.tsx', appCode);
