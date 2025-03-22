import HevaClient from "./hevaClient";
import HevaProtocolReader from "./hevaProtocolReader";
import ChannelProtocol from "./protocols/channelProtocol";

export default class ProtocolHandler
{
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
                return true;
            case 4:
                //ChannelProtocol.sendChannels(client);
                return true;
            default:
                console.log(`Unknown protocol ${protocol} for packet ${data.bufferT.toString("hex").match(/(.{1,64})/g)!.map(s => s.match(/.{1,2}/g)!.join(' '))}`);
                return false;
        }
    }
}