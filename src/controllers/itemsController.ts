import { readItemsTable } from "../network/packetUtils";

export default class ItemsController
{
    #itemsTable: Buffer;

    constructor()
    {
        this.#itemsTable = Buffer.alloc(0);
    }

    async start()
    {
        this.#itemsTable = await readItemsTable();

        //this.#test();
    }

    #test()
    {
        let itemID = "PANTS_401";
        let itemIndex = 1;

        let id = this.#generateId(itemID);
        let v4 = (id.readUInt32LE(0) % 128);

        let finalID = Buffer.alloc(12);
        finalID.writeUInt32LE(itemIndex, 0);
        finalID.writeUInt32LE(id.readUInt32LE(0), 4);
        finalID.writeUInt32LE(0, 8);

        console.log(itemID, finalID, v4, v4.toString(16), id.readUInt32LE(0))
    }

    #generateId(itemID: string)  
    {
        const baseHash: number = -559038242;
        const baseModifier: number = 2146271213;

        let hash = Number(baseHash);
        let modifier = Number(baseModifier);

        console.log(hash);
        console.log(modifier)

        let upper = itemID.toUpperCase();
        for(let i = 0; i < itemID.length; i++)
        {
            let charCode = upper.charCodeAt(i);
            hash = (hash + modifier) ^ this.#itemsTable.readUInt32LE(charCode << 2);
            modifier = (charCode + hash + 0x21 * modifier + 3) >>> 0;
        }

        hash = hash >>> 0;

        let output = Buffer.alloc(4);
        output.writeUInt32LE(hash);

        return output;
    }
}