import HevaProtocolWriter from "../network/hevaProtocolWriter";
import IProtocolWrite from "./network/IProtocolWrite";

export default class Item implements IProtocolWrite
{
    #id: number;

    constructor(id: number)
    {
        this.#id = id;
    }

    write(w: HevaProtocolWriter): void {
        w.writeByte(0xF0); // No idea
        w.writeUInt32(this.#id);
        w.writeUInt32(0); // No idea
    }
}