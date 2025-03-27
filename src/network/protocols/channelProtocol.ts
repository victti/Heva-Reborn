import HevaClient from "../hevaClient";
import HevaProtocolWriter from "../hevaProtocolWriter";

export default class ChannelProtocol
{
    static sendServerList(client: HevaClient)
    {
        let writer = new HevaProtocolWriter();
        writer.writeUInt16(8);
        writer.writeUInt16(0);
        writer.writeByte(0x10); // not used (byte 6)
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used

        writer.writeStringNT("HEVA");
        writer.writeUInt32(1);

        for(let id = 2; id < 2; id++)
        {
            writer.writeStringNT("TestServer");
            writer.writeUInt32(id);
        }

        client.sendPacket(writer);
    }

    static sendChannels(client: HevaClient)
    {
        let writer = new HevaProtocolWriter();
        writer.writeUInt16(0x4);
        writer.writeUInt16(0);
        writer.writeByte(0x00); // not used (byte 6)
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used
        writer.writeByte(0x05); // channel count
        for(let i = 1; i < 7; i++)
        {
            // channel data
            writer.writeByte(i);
            writer.writeByte(0x00);
            writer.writeByte(0x00);
            writer.writeByte(0x00);
            writer.writeByte(0x00);
            writer.writeByte(0x00);
            // channel name
            writer.writeStringNT("CH-0" + i);
        }

        client.sendPacket(writer);
    }

    static sendCharacters(client: HevaClient)
    {
        let writer = new HevaProtocolWriter();
        writer.writeUInt16(0x1c);
        writer.writeUInt16(0);
        writer.writeByte(0x00);

        client.sendPacket(writer);
    }
}