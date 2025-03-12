import HevaServer from "../main/hevaServer";
import TCPClient from "./core/tcp/tcpClient";
import { obfuscatePacket, readTable2, readTables } from "./packetUtils";

export default class HevaClient
{
    #server: HevaServer;
    #client: TCPClient;

    constructor(server: HevaServer, client: TCPClient)
    {
        this.#server = server;
        this.#client = client;
    }

    async handleData(data: Buffer)
    {
        console.log("received data")
        console.log(data);

        let lookupTables = await readTables();
        let validationTable = await readTable2();

        let packet = Buffer.from([0x03, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01, 0x00]);
        console.log("obfuscating", packet);
        packet = obfuscatePacket(lookupTables, validationTable, packet, 0);
        console.log("sending", packet);
        this.#client.sendData(packet);
    }
}