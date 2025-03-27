import Character from "../core/character";
import HevaClient from "./hevaClient";
import HevaProtocolReader from "./hevaProtocolReader";
import ChannelProtocol from "./protocols/channelProtocol";
import CharacterCreationProtocol from "./protocols/characterCreationProtocol";

export default class ProtocolHandler
{
    static #idTemporary: number = 1;

    static async handleData(client: HevaClient, data: HevaProtocolReader | HevaProtocolReader[])
    {
        if(Array.isArray(data))
        {
            for(let r of data)
                await this.#handleData(client, r);

            return;
        }
    
        this.#handleData(client, data);
    }

    static async #handleData(client: HevaClient, data: HevaProtocolReader)
    {
        let protocol = data.readUInt16();
        data.readUInt16(); // Empty (I think)

        switch(protocol)
        {
            case 3:
                let someClientValue = data.readUInt32();
                let playbusterValue = data.readUInt32();
                
                console.log(`Client value: ${someClientValue}, Playbuster value: ${playbusterValue}`);

                if(someClientValue != 1116423 || playbusterValue != 1000)
                {
                    console.error("Invalid client version or playbuster version!");
                    return false;
                }

                ChannelProtocol.sendServerList(client);
                return true;
            case 4:
                let serverId = data.readUInt32();

                ChannelProtocol.sendChannels(client);
                return true;
            case 10:
                let serverId2 = data.readUInt32();
                let channelId = data.readByte();

                // I am not sure if this is how its supposed to work but doing this works
                // both can put the game in the character selection state but channel protocol removes a dialog from the screen
                // character creation protocol makes two free slots for characters, you can even send already made characters
                ChannelProtocol.sendCharacters(client);
                CharacterCreationProtocol.sendCharacterList(client);
                return true;
            case 17:
                let nameToCheck = data.readStringNT();

                if(nameToCheck.length > 9)
                {
                    CharacterCreationProtocol.sendNameTooLong(client);
                    return true;
                }

                console.log(`Name to check: ${nameToCheck}`);

                if(true)
                {
                    CharacterCreationProtocol.sendNameAvailable(client);
                    return true;
                }
                return true;
            case 19:
                let gender = data.readByte();

                let hair = data.readUInt16();
                let hairType = Math.floor(hair / 10);
                let hairColor = hair - hairType;

                let faceType = data.readUInt16();
                let top = data.readUInt16();
                let bottom = data.readUInt16();
                let name = data.readStringNT();

                CharacterCreationProtocol.sendCreateCharacter(client, new Character(this.#idTemporary++, name, gender, hairType, hairColor, faceType, top, bottom, 1, 1));
                return true;
            case 20:
                let chararecterId = data.readUInt16();
                let characterName = data.readStringNT();
                let characterNameConfirmation = data.readStringNT();

                console.log(`Character id: ${chararecterId}, Character name: ${characterName}, Character name confirmation: ${characterNameConfirmation}`);

                if(characterName != characterNameConfirmation)
                {

                    return false;
                }

                return true;
            case 21:
                let characterId = data.readUInt32();

                CharacterCreationProtocol.sendPlay(client);
                return true;
            default:
                console.log(`Unknown protocol ${protocol} for packet ${data.bufferT.toString("hex").match(/(.{1,64})/g)!.map(s => s.match(/.{1,2}/g)!.join(' '))}`);
                return false;
        }
    }
}