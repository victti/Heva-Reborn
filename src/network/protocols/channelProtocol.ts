import HevaClient from "../hevaClient";
import HevaProtocolWriter from "../hevaProtocolWriter";

export default class ChannelProtocol
{
    static sendServerList()
    {
        let writer = new HevaProtocolWriter();
        writer.writeUInt16(8);
        writer.writeUInt16(0);
        writer.writeByte(0x10); // not used (byte 6)
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used
        for(let id = 0; id < 5; id++)
        {
            writer.writeStringNT("TestServer " + id);
            writer.writeUInt32(id);
        }
    }

    static sendChannels(client: HevaClient)
    {
        let writer = new HevaProtocolWriter();
        writer.writeUInt16(0x4);
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used (byte 6)
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used
        writer.writeByte(0x00); // not used
        writer.writeByte(0x05); // channel count
        for(let i = 1; i < 6; i++)
        {
            // channel data
            writer.writeByte(i);
            writer.writeByte(0x00);
            writer.writeByte(0x00);
            writer.writeByte(0x00);
            writer.writeByte(0x00);
            writer.writeByte(0x00);
            // channel name
            writer.writeStringNT("TestChannel " + i);
        }

        client.sendPacket(writer);
    }
}