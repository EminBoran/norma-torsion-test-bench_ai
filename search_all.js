import { OPCUAClient } from "node-opcua";
const endpointUrl = "opc.tcp://10.191.199.182:4840";
async function main() {
    const client = OPCUAClient.create({ endpointMustExist: false });
    try {
        await client.connect(endpointUrl);
        const session = await client.createSession();
        // ...
