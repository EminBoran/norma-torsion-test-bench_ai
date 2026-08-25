const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('MessageSecurityMode')) {
    code = code.replace(
        /import \{ ([^}]+) \} from "node-opcua";/,
        'import { $1, MessageSecurityMode, SecurityPolicy } from "node-opcua";\nimport { OPCUACertificateManager } from "node-opcua-certificate-manager";'
    );
}

code = code.replace(
`    opcClient = OPCUAClient.create({
      endpointMustExist: false,
      connectionStrategy: {
        maxRetry: 10,
        initialDelay: 1000,
        maxDelay: 5000,
      }
    });`,
`    const certManager = new OPCUACertificateManager({
      automaticallyAcceptUnknownCertificate: true,
      rootFolder: "./pki"
    });
    
    opcClient = OPCUAClient.create({
      endpointMustExist: false,
      securityMode: MessageSecurityMode.SignAndEncrypt,
      securityPolicy: SecurityPolicy.Basic256Sha256,
      serverCertificateManager: certManager,
      connectionStrategy: {
        maxRetry: 10,
        initialDelay: 1000,
        maxDelay: 5000,
      }
    });`
);

fs.writeFileSync('server.ts', code);
