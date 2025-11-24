import Character from "../../core/character";
import HevaClient from "../hevaClient";
import HevaProtocolWriter from "../hevaProtocolWriter";

export default class CharacterCreationProtocol
{
    static sendNameTooLong(client: HevaClient)
    {
        let writer = new HevaProtocolWriter(0x13);

        writer.writeByte(0x06);

        client.sendPacket(writer);
    }

    static sendNameUnavailable(client: HevaClient)
    {
        let writer = new HevaProtocolWriter(0x13);

        writer.writeByte(0x03);

        client.sendPacket(writer);
    }

    static sendNameDuplicated(client: HevaClient)
    {
        let writer = new HevaProtocolWriter(0x13);

        writer.writeByte(0x02);

        client.sendPacket(writer);
    }

    static sendCharactersFull(client: HevaClient)
    {
        let writer = new HevaProtocolWriter(0x13);

        writer.writeByte(0x04);

        client.sendPacket(writer);
    }

    static sendNameAvailable(client: HevaClient)
    {
        let writer = new HevaProtocolWriter(0x11);

        writer.writeByte(0x00);

        client.sendPacket(writer);
    }

    static sendCreateCharacter(client: HevaClient, character: Character)
    {
        let writer = new HevaProtocolWriter(0x13);

        writer.writeByte(0x00);

        character.writeCharacterLightData(writer);

        client.sendPacket(writer);

        //setTimeout(() => CharacterCreationProtocol.teste(client, 0, 0), 1000);
    }

    static sendCharacterList(client: HevaClient)
    {
        let writer = new HevaProtocolWriter(0x12);

        writer.writeUInt32(0);
        writer.writeUInt32(0);

        writer.writeByte(0);

        client.sendPacket(writer);
    }

    static sendConnectToGameServer(client: HevaClient, ip: string = "127.0.0.1", port: number = 50000)
    {
        let writer = new HevaProtocolWriter(15);

        const ipParts = ip.split('.').map(part => parseInt(part));
        const ipBinary = ((ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]) >>> 0;

        writer.writeUInt16(port);
        writer.writeUInt32(ipBinary);
        writer.writeUInt32(0xabcdef12); // this seems to be a new encryption key, need to check

        client.sendPacket(writer);
    }

    static sendPlay(client: HevaClient)
    {
        let writer = new HevaProtocolWriter(0x15);

        let bytes = Buffer.alloc(4000, 0);

        for(let i = 0; i < bytes.length; i++)
            bytes[i] = (i % 2) + 1;

        bytes.writeUInt32LE(1, 0); // id

        bytes[4] = 0; // seems related to the gender, it did not change the player model, only the icon

        bytes.writeUInt16LE(0, 5); // hair type and color
        bytes.writeUInt16LE(0, 7); // face type

        // more customization stuff
        bytes[9] = 0;
        bytes[10] = 0;
        bytes[11] = 0;
        bytes[12] = 0;

        bytes.writeUInt32LE(80, 13); // currentHP
        bytes.writeUInt32LE(60, 17); // currentMP

        bytes.writeUInt16LE(1, 21); // level (apparently only affects the xp bar)
        bytes.writeUInt16LE(1, 23); // job
        bytes.writeUInt32LE(0, 25); // current XP
        bytes.writeUInt32LE(0, 29); // next level XP offset ?

        bytes.writeUInt8(0, 34); // energy bar

        bytes.writeUInt16LE(1, 38); // map id | 31 for tutorial map

        bytes.writeUInt16LE(0, 40); // spawn rotation

        bytes.writeUInt16LE(100, 42); // spawn position x
        bytes.writeUInt16LE(1050, 44); // spawn position y - forward
        bytes.writeUInt16LE(400, 46); // spawn position z - up

        bytes.writeUInt32LE(0, 64); // achivement points

        bytes.writeUInt16LE(0, 80); // medals

        // 1500-2200 has items
        // before that it seems to have skill related things on quick slots

        // empty
        for(let i = 0; i < 2216; i++)
        {
            writer.writeByte(bytes[i]);
        }

        writer.writeStringNT("teste"); // player name

        client.sendPacket(writer);
    }
}