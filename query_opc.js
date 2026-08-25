const { OPCUAClient } = require("node-opcua");
const endpointUrl = "opc.tcp://10.191.199.182:4840";
async function main() {
    const client = OPCUAClient.create({ endpointMustExist: false });
    try {
        await client.connect(endpointUrl);
        const session = await client.createSession();
        console.log("Connected");
        // Browse the motor node ns=7;i=640 and see what it is
        const res = await session.browse("ns=7;i=640");
        console.log("Node ns=7;i=640 references:");
        res.references.forEach(r => console.log(r.browseName.name, r.nodeClass.toString()));
        
        // Read its properties
        const val = await session.read({nodeId: "ns=7;i=640"});
        console.log("Value type:", val.value.dataType.toString());
        console.log("Array type:", val.value.arrayType.toString());
        console.log("Value:", val.value.value);

        await session.close();
        await client.disconnect();
    } catch (e) {
        console.log("Error:", e.message);
    }
}
main();
