import Character from "../../core/character";
import HevaClient from "../hevaClient";
import HevaProtocolWriter from "../hevaProtocolWriter";

export default class CharacterCreationProtocol
{
    static sendNameTooLong(client: HevaClient)
    {
        let writer = new HevaProtocolWriter();
        writer.writeUInt16(0x13);
        writer.writeUInt16(0);
        writer.writeByte(0x06);

        client.sendPacket(writer);
    }

    static sendNameUnavailable(client: HevaClient)
    {
        let writer = new HevaProtocolWriter();
        writer.writeUInt16(0x13);
        writer.writeUInt16(0);
        writer.writeByte(0x03);

        client.sendPacket(writer);
    }

    static sendNameDuplicated(client: HevaClient)
    {
        let writer = new HevaProtocolWriter();
        writer.writeUInt16(0x13);
        writer.writeUInt16(0);
        writer.writeByte(0x02);

        client.sendPacket(writer);
    }

    static sendCharactersFull(client: HevaClient)
    {
        let writer = new HevaProtocolWriter();
        writer.writeUInt16(0x13);
        writer.writeUInt16(0);
        writer.writeByte(0x04);

        client.sendPacket(writer);
    }

    static sendNameAvailable(client: HevaClient)
    {
        let writer = new HevaProtocolWriter();
        writer.writeUInt16(0x11);
        writer.writeUInt16(0);
        writer.writeByte(0x00);

        client.sendPacket(writer);
    }

    static sendCreateCharacter(client: HevaClient, character: Character)
    {
        let writer = new HevaProtocolWriter();
        writer.writeUInt16(0x13);
        writer.writeUInt16(0);
        writer.writeByte(0x00);

        writer.writeUInt32(character.id);
        writer.writeByte(character.gender);
        writer.writeUInt16(character.level);
        writer.writeUInt16(character.class);
        writer.writeByte(0);
        writer.writeByte(0);
        writer.writeByte(0);
        writer.writeByte(0);
        writer.writeUInt16(15);
        writer.writeByte(0);

        // 19 - hand weapon
        // 27 - shirt item
        // 28 - hand weapon again? gun
        // 36 - pants item
        // 37 - hand weapon again? gun
        // 45 - hands item
        // 46 - hand weapon again? gun
        // 54 - foot item
        // 55 - hand weapon again? gun
        // 64 - hand weapon again? gun
        // 72 - right hand hand weapon again? sword
        // 73 - hand weapon again? gun
        // 81 - left hand hand weapon again? sword

        writer.writeByte(1);
        for(let i = 0; i < 107; i++)
        {
            writer.writeByte(0);
        }

        writer.writeStringNT(character.name);

        client.sendPacket(writer);
    }

    static sendCharacterList(client: HevaClient)
    {
        let writer = new HevaProtocolWriter();
        writer.writeUInt16(0x12);
        writer.writeUInt16(0);

        writer.writeUInt32(0);
        writer.writeUInt32(0);

        writer.writeByte(0);

        client.sendPacket(writer);
    }

    static sendPlay(client: HevaClient)
    {
        let writer = new HevaProtocolWriter();
        writer.writeUInt16(0x15);
        writer.writeUInt16(0);

        for(let i = 0; i < 1000; i++)
        {
            writer.writeByte(0);
        }

        client.sendPacket(writer);
    }
}