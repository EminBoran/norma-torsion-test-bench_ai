const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Finde die OPC UA Client Erstellung und füge Auth hinzu
code = code.replace(
`    opcClient = OPCUAClient.create({
      endpointMustExist: false,
      connectionStrategy: {
        maxRetry: 10,
        initialDelay: 1000,
        maxDelay: 5000,
      }
    });`,
`    opcClient = OPCUAClient.create({
      endpointMustExist: false,
      connectionStrategy: {
        maxRetry: 10,
        initialDelay: 1000,
        maxDelay: 5000,
      }
    });`
);

// Finde das Session.create() und füge Benutzername und Passwort ein
code = code.replace(
`    opcSession = await opcClient.createSession();`,
`    const userIdentity = {
      userName: process.env.OPC_USERNAME || "admin",
      password: process.env.OPC_PASSWORD || "admin"
    };
    opcSession = await opcClient.createSession(userIdentity);`
);

fs.writeFileSync('server.ts', code);
