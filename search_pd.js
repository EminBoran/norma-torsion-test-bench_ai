import { OPCUAClient } from "node-opcua";
const endpointUrl = "opc.tcp://10.191.199.182:4840";
async function main() {
    const client = OPCUAClient.create({ endpointMustExist: false });
    try {
        await client.connect(endpointUrl);
        const session = await client.createSession();
        
        console.log("Suche in ProcessDataMonitor (ns=7;i=7)...");
        try {
            const res = await session.browse("ns=7;i=7");
            for (let ref of res.references) {
                 console.log(` - ${ref.browseName.name} (NodeID: ${ref.nodeId.toString()})`);
            }
        } catch(e) {}
        
        console.log("\nSuche an Port 0 und Port 1 direkt...");
        const ports = ["ns=6;i=33269", "ns=6;i=98805"];
        for (let port of ports) {
             const res = await session.browse(port);
             for (let ref of res.references) {
                  const subRes = await session.browse(ref.nodeId);
                  for (let sub of subRes.references) {
                       const name = sub.browseName.name;
                       if (name.match(/ProcessDataInput|ProcessDataOutput|PDInput|PDOutput/i)) {
                            console.log(`🔥 TREFFER an Port ${port === ports[0] ? '0' : '1'}: ${name} (NodeID: ${sub.nodeId.toString()})`);
                       }
                  }
             }
        }
        await session.close();
        await client.disconnect();
    } catch(e) { console.error(e); }
}
main();
