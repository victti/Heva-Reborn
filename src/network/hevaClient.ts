import Character from "../core/character";
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

    #charLimit: number;
    #characters: Character[];

    constructor(server: HevaServer, client: TCPClient)
    {
        this.#server = server;
        this.#client = client;

        this.#packetsReceived = 0;
    
        this.#charLimit = 2;
        this.#characters = [];
    }

    async handleData(data: Buffer)
    {
        console.log("received:", data);

        let deobfuscatedPacketHeader = deobfuscateClientPacketHeader(data, this.#packetsReceived);
        if(!deobfuscatedPacketHeader)
        {
            // TODO: disconnect the client, the packet is not valid
            console.error("Invalid packet header");
            return;
        }

        this.#packetsReceived += 1;

        let deobfuscatedPacket = deobfuscateClientPacket(deobfuscatedPacketHeader);
        if(!deobfuscatedPacket)
        {
            // TODO: disconnect the client, the packet is not valid
            console.error("Invalid packet");
            return;
        }

        console.log("deobfuscated:", deobfuscatedPacket);

        ProtocolHandler.handleData(this, new HevaProtocolReader(deobfuscatedPacket));
        return;

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
        console.log(writer.buffer.toString("hex"));
        let buffer = writer.getBuffer();

        console.log("sending:" + buffer.toString("hex"));

        this.#client.sendData(buffer);
    }

    disconnect(reason: string)
    {
        console.warn("Disconnecting client:", reason);
    }

    canCreateMoreCharacters(): boolean
    {
        return this.#characters.length < this.#charLimit;
    }
}