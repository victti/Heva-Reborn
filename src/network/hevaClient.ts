import HevaServer from "../main/hevaServer";
import TCPClient from "./core/tcp/tcpClient";
import HevaProtocolReader from "./hevaProtocolReader";
import HevaProtocolWriter from "./hevaProtocolWriter";
import { deobfuscateClientPacket, deobfuscateClientPacketHeader, obfuscateServerPacket, readTable2, readTables } from "./packetUtils";
import ProtocolHandler from "./protocolHandler";

export default class HevaClient
{
    #server: HevaServer;
    #client: TCPClient;

    #packetsReceived: number;

    constructor(server: HevaServer, client: TCPClient)
    {
        this.#server = server;
        this.#client = client;

        this.#packetsReceived = 0;
    }

    async handleData(data: Buffer)
    {
        console.log("received:", data);

        let deobfuscatedPacketHeader = deobfuscateClientPacketHeader(data, this.#packetsReceived);
        if(!deobfuscatedPacketHeader)
        {
            // TODO: disconnect the client, the packet is not valid
            return;
        }

        this.#packetsReceived += 1;

        let deobfuscatedPacket = deobfuscateClientPacket(deobfuscatedPacketHeader);
        if(!deobfuscatedPacket)
        {
            // TODO: disconnect the client, the packet is not valid
            return;
        }

        ProtocolHandler.handleData(this, new HevaProtocolReader(deobfuscatedPacket));
        //return;

        console.log("deobfuscated:", deobfuscatedPacket);

        let writer = new HevaProtocolWriter();
        writer.writeUInt16(8);
        writer.writeUInt16(0);
        writer.writeByte(0x10); // not used (byte 6)
        writer.writeByte(0x00);
        writer.writeByte(0x00);
        writer.writeByte(0x00);
        writer.writeByte(0x00);
        for(let id = 0; id < 5; id++)
        {
            writer.writeStringNT("TestServer " + id);
            writer.writeUInt32(id);
        }

        this.sendPacket(writer);
    }

    sendPacket(writer: HevaProtocolWriter)
    {
        let buffer = writer.getBuffer();

        console.log("sending:" + buffer.toString("hex"));

        this.#client.sendData(buffer);
    }
}