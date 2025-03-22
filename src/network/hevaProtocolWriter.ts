import BufferWriter from "./core/bufferWriter";
import { obfuscateServerPacket } from "./packetUtils";

export default class HevaProtocolWriter extends BufferWriter
{
    constructor()
    {
        super();
        this.writeUInt16(0);
    }

    /**
     * Writes the length of the buffer to the first two bytes of the given array.
     * @param {Uint8Array} data The array to write the length to.
     */
    #writeDataLength(data: Uint8Array)
    {
        let num = this.getLength();
        
        data[0] = num & 0xFF;
        data[1] = (num >> 8) & 0xFF;
    }

    /**
     * Gets the length of the buffer.
     * @returns {number} The length of the buffer.
     */
    getLength(): number
    {
        return this.buffer.length;
    }

    /**
     * Gets the buffer as a single Buffer, with the length of the buffer in the first two bytes.
     * @returns {Buffer} The buffer as a single Buffer.
     */
    getBuffer(): Buffer
    {
        let buffer = Buffer.alloc(this.getLength());
        this.buffer.copy(buffer, 0);
        this.#writeDataLength(buffer);
        let obfuscated = obfuscateServerPacket(buffer);
        return typeof obfuscated === "number" ? buffer : obfuscated;
    }

    /**
     * Writes a null-terminated string to the buffer.
     * @param {string} value The string to write.
     */
    writeStringNT(value: string)
    {
        this.writeBytes(Array.from(Buffer.from(value, "utf8")));
        this.writeByte(0);
    }
}