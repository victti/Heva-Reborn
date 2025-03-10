import os from 'os';

export default class BufferWriter
{
    protected chunks: Buffer[];

    /**
     * Initializes a new instance of the BufferWriter class.
     * This class is used to write binary data to a buffer.
     */
    constructor()
    {
        this.chunks = [];
    }

    /**
     * Gets the concatenated buffer from all the written chunks.
     * @returns A Buffer containing the data written so far.
     */
    get buffer() : Buffer
    {
        return Buffer.concat(this.chunks);
    }

    /**
     * Writes a single byte to the buffer.
     * @param value The number to write.
     */
    writeByte(value: number)
    {
        let buffer = Buffer.alloc(1);
        buffer.writeUInt8(value);

        this.chunks.push(buffer);
    }

    /**
     * Writes a signed byte to the buffer.
     * @param value The signed byte to write.
     */
    writeSByte(value: number)
    {
        let buffer = Buffer.alloc(1);
        buffer.writeInt8(value);
        
        this.chunks.push(buffer);
    }

    /**
     * Writes an array of bytes to the buffer.
     * @param values An array of bytes to write.
     */
    writeBytes(values: number[])
    {
        let buffer = Buffer.alloc(values.length);

        for(let i = 0; i < values.length; i++)
            buffer.writeUInt8(values[i], i);
            
        this.chunks.push(buffer);
    }

    /**
     * Writes a 16-bit unsigned integer to the buffer.
     * @param value The number to write.
     */
    writeUInt16(value: number)
    {
        let buffer = Buffer.alloc(2);
        BufferWriter.isLittleEndian() ? buffer.writeUInt16LE(value) : buffer.writeUInt16BE(value);

        this.chunks.push(buffer);
    }

    /**
     * Writes a 16-bit signed integer to the buffer.
     * @param value The signed short integer to write.
     */
    writeInt16(value: number)
    {
        let buffer = Buffer.alloc(2);
        BufferWriter.isLittleEndian() ? buffer.writeInt16LE(value) : buffer.writeInt16BE(value);

        this.chunks.push(buffer);
    }

    /**
     * Writes a 32-bit unsigned integer to the buffer.
     * @param value The unsigned integer to write.
     */
    writeUInt32(value: number)
    {
        let buffer = Buffer.alloc(4);
        BufferWriter.isLittleEndian() ? buffer.writeUInt32LE(value) : buffer.writeUInt32BE(value);

        this.chunks.push(buffer);
    }

/**
 * Writes a 32-bit signed integer to the buffer.
 * @param value The signed integer to write.
 */
    writeInt32(value: number)
    {
        let buffer = Buffer.alloc(4);
        BufferWriter.isLittleEndian() ? buffer.writeInt32LE(value) : buffer.writeInt32BE(value);

        this.chunks.push(buffer);
    }

    /**
     * Writes a 64-bit signed integer to the buffer.
     * @param value The signed long integer to write.
     */
    writeInt64(value: bigint)
    {
        let buffer = Buffer.alloc(8);
        BufferWriter.isLittleEndian() ? buffer.writeBigInt64LE(value) : buffer.writeBigInt64BE(value);

        this.chunks.push(buffer);
    }

    /**
     * Writes a 64-bit unsigned integer to the buffer.
     * @param value The unsigned long integer to write.
     */
    writeUInt64(value: bigint)
    {
        let buffer = Buffer.alloc(8);
        BufferWriter.isLittleEndian() ? buffer.writeBigUInt64LE(value) : buffer.writeBigUInt64BE(value);

        this.chunks.push(buffer);
    }

    /**
     * Writes a 64-bit double-precision floating-point number to the buffer.
     * @param value The double-precision floating-point number to write.
     */
    writeDouble(value: number)
    {
        let buffer = Buffer.alloc(8);
        BufferWriter.isLittleEndian() ? buffer.writeDoubleLE(value) : buffer.writeDoubleBE(value);
        
        this.chunks.push(buffer);
    }

    /**
     * Writes a 32-bit single-precision floating-point number to the buffer.
     * @param value The float number to write.
     */
    writeFloat(value: number)
    {
        let buffer = Buffer.alloc(4);
        BufferWriter.isLittleEndian() ? buffer.writeFloatLE(value) : buffer.writeFloatBE(value);

        this.chunks.push(buffer);
    }

    /**
     * Writes a boolean value to the buffer.
     * @param value The boolean value to write.
     */
    writeBoolean(value: boolean)
    {
        this.writeByte(value ? 1 : 0);
    }

    static isLittleEndian()
    {
        return os.endianness() === 'LE';
    }
}