const express = require('express');
const morgan = require( "morgan" );
const lora_packet = require("lora-packet");
const app = express();
app.use(express.json());
app.use( express.urlencoded( { extended: true } ) );
app.use(morgan("tiny"));
app.post( '/enviar_paquete', enviarPaqueteHandler );

var counter = 0;
function enviarPaqueteHandler ( req, res ) {
    console.log( "-----------------------------------------" );
    console.log( "Llego un paquete: " + req.query.paquete )
    const packet = lora_packet.fromWire(Buffer.from(req.query.paquete, "hex"));

    // debug: prints out contents
    // - contents depend on packet type
    // - contents are named based on LoRa spec
    console.log("Paquete decodificado\n" + packet);

    // e.g. retrieve payload elements
    console.log("packet MIC=" + packet.MIC.toString("hex"));
    console.log("FRMPayload=" + packet.FRMPayload.toString("hex"));

    // check MIC
    const NwkSKey = Buffer.from("44024241ed4ce9a68c6a8bc055233fd3", "hex");
    console.log("MIC check=" + (lora_packet.verifyMIC(packet, NwkSKey) ? "OK" : "fail"));

    // calculate MIC based on contents
    console.log("calculated MIC=" + lora_packet.calculateMIC(packet, NwkSKey).toString("hex"));

    // decrypt payload
    const AppSKey = Buffer.from("ec925802ae430ca77fd3dd73cb2cc588", "hex");
    console.log("Decrypted (ASCII)='" + lora_packet.decrypt(packet, AppSKey, NwkSKey).toString() + "'");
    console.log( "Decrypted (hex)='0x" + lora_packet.decrypt( packet, AppSKey, NwkSKey ).toString( "hex" ) + "'" );
    
    // Crear Paquete
    console.log( "Creando paquete ACK" );
    const constructedPacket = lora_packet.fromFields(
        {
            MType: "Unconfirmed Data Down", // (default)
            DevAddr: Buffer.from("01020304", "hex"), // big-endian
            FCtrl: {
                ADR: false, // default = false
                ACK: true, // default = false
                ADRACKReq: false, // default = false
                FPending: false, // default = false
            },
            FCnt: counter, // can supply a buffer or a number
            payload: "test",
        },
        Buffer.from("ec925802ae430ca77fd3dd73cb2cc588", "hex"), // AppSKey
        Buffer.from("44024241ed4ce9a68c6a8bc055233fd3", "hex") // NwkSKey
    );
    counter++;
    console.log( "Paquete ACK creado" );
    const wireFormatPacket = constructedPacket.getPHYPayload();
    const ackMessage =  wireFormatPacket.toString("hex");

    res.send( ackMessage );
}
let port = 9501;
app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
  