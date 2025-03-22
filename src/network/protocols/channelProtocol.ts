import HevaProtocolWriter from "../hevaProtocolWriter";

export default class ChannelProtocol
{
    sendChannels()
    {
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
    }
}