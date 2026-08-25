const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`    await opcSession.write({
      nodeId: nodeId,
      attributeId: AttributeIds.Value,
      value: {
        value: {
          dataType: DataType.ByteString,
          value: buffer
        }
      }
    });
    return true;`,
`    const result = await opcSession.write({
      nodeId: nodeId,
      attributeId: AttributeIds.Value,
      value: {
        value: {
          dataType: DataType.ByteString,
          value: buffer
        }
      }
    });
    console.log("[OPC UA] Write result for " + nodeId + ":", result.toString());
    if (result.value !== 0) { // Good is 0
       console.log("Maybe try ByteArray...");
       const result2 = await opcSession.write({
        nodeId: nodeId,
        attributeId: AttributeIds.Value,
        value: {
          value: {
            dataType: DataType.Byte,
            arrayType: opcua.VariantArrayType.Array,
            value: Array.from(buffer)
          }
        }
      });
      console.log("[OPC UA] Fallback Write result for " + nodeId + ":", result2.toString());
    }
    return true;`
);

fs.writeFileSync('server.ts', code);
