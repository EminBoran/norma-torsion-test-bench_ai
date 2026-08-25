const express = require("express");
const app = express();
app.get('*all', (req, res) => res.send("matched: " + req.params.all));
const server = app.listen(0, () => {
  const port = server.address().port;
  require("http").get(`http://localhost:${port}/some/path`, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log("Response:", data);
      server.close();
    });
  });
});
