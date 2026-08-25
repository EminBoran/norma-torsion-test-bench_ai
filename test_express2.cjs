const express = require("express");
const app = express();
try {
  app.get('*', (req, res) => res.send("ok"));
  console.log("Express get * worked.");
} catch(e) {
  console.error("Express error *:", e.message);
}
try {
  app.get('*all', (req, res) => res.send("ok"));
  console.log("Express get *all worked.");
} catch(e) {
  console.error("Express error *all:", e.message);
}
try {
  app.get('(.*)', (req, res) => res.send("ok"));
  console.log("Express get (.*) worked.");
} catch(e) {
  console.error("Express error (.*):", e.message);
}
try {
  app.get('/*', (req, res) => res.send("ok"));
  console.log("Express get /* worked.");
} catch(e) {
  console.error("Express error /*:", e.message);
}
