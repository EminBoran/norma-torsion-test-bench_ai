const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`function hexTo32ByteBuffer(hexStr: string): Buffer {
  const buf = Buffer.alloc(32);
  const data = Buffer.from(hexStr, 'hex');
  data.copy(buf, 0);
  return buf;
}`,
`function hexTo32ByteBuffer(hexStr: string): Buffer {
  return Buffer.from(hexStr, 'hex'); // Sende genau die Länge des Befehls (für Motor 6 Bytes)
}`
);

// We should also patch sendLedCommand to send exactly 1 byte if the LED takes 1 byte.
// Let's assume LED takes 1 byte.
code = code.replace(
`async function sendLedCommand(ledColorByte: number): Promise<boolean> {
  const buf = Buffer.alloc(32);
  buf.writeUInt8(ledColorByte, 0);`,
`async function sendLedCommand(ledColorByte: number): Promise<boolean> {
  const buf = Buffer.alloc(1);
  buf.writeUInt8(ledColorByte, 0);`
);

fs.writeFileSync('server.ts', code);
