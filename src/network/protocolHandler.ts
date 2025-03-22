import HevaClient from "./hevaClient";
import HevaProtocolReader from "./hevaProtocolReader";

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

        switch(protocol)
        {
            default:
                console.log(`Unknown protocol ${protocol} for packet ${data.bufferT.toString("hex").match(/(.{1,64})/g)!.map(s => s.match(/.{1,2}/g)!.join(' '))}`);
        }
    }
}