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
        let deobfuscatedPacketHeader = deobfuscateClientPacketHeader(data, this.#packetsReceived);
        if(!deobfuscatedPacketHeader)
        {
            // TODO: disconnect the client, the packet is not valid
            return;
        }

        let deobfuscatedPacket = deobfuscateClientPacket(deobfuscatedPacketHeader);
        if(!deobfuscatedPacket)
        {
            // TODO: disconnect the client, the packet is not valid
            return;
        }

        ProtocolHandler.handleData(this, new HevaProtocolReader(deobfuscatedPacket));
        //return;

        console.log(deobfuscatedPacket)

        let writer = new HevaProtocolWriter();
        writer.writeUInt16(0x4);
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used (byte 6)
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used
        writer.writeByte(0x01); // channel count
        // channel data
        writer.writeByte(0x01);
        writer.writeByte(0x00);
        writer.writeByte(0x00);
        writer.writeByte(0x00);
        writer.writeByte(0x00);
        writer.writeByte(0x00);
        // channel name
        writer.writeStringNT("TestChannel");

        let buffer = writer.getBuffer();

        this.#client.sendData(buffer);
    }
}