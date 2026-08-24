const fs = require('fs');

let ctx = fs.readFileSync('src/context/TestBenchContext.tsx', 'utf8');
ctx = ctx.replace(/socket\.emit\('set_gpio'/g, "// socket.emit('set_gpio'");
fs.writeFileSync('src/context/TestBenchContext.tsx', ctx);
