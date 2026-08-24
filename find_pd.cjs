import { OPCUAClient } from "node-opcua";

const endpointUrl = "opc.tcp://10.191.199.182:4840";

async function main() {
    const client = OPCUAClient.create({ endpointMustExist: false });
    try {
        await client.connect(endpointUrl);
        const session = await client.createSession();
        
        async function browseRecursive(nodeId, indent, depth) {
            if (depth > 3) return;
            try {
                const res = await session.browse(nodeId);
                for (const ref of res.references) {
                    const name = ref.browseName.name;
                    if (name.includes("PD") || name.includes("Process") || name.includes("Data") || name.includes("Input") || name.includes("Output")) {
                        console.log(`${indent}► ${name} (NodeID: ${ref.nodeId.toString()})`);
                        // Try reading it
                        try {
                            const val = await session.read({nodeId: ref.nodeId});
                            console.log(`${indent}  └── WERT:`, val.value.value);
                        } catch(e){}
                    } else if (name === "Device" || name === "Port00" || name === "Port01") {
                       console.log(`${indent}► ${name} (NodeID: ${ref.nodeId.toString()})`);
                       await browseRecursive(ref.nodeId, indent + "  ", depth + 1);
                    }
                }
            } catch(e) {}
        }
        
        console.log("Suche nach Process Data...");
        await browseRecursive("ns=6;i=501", "", 0);
        
        await session.close();
        await client.disconnect();
    } catch (e) {
        console.error(e.message);
    }
}
main();
