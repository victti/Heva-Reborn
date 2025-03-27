import os from 'os';

export default class BufferReader {
    protected buffer: Buffer
    protected _position: number;
    protected order?: "LE" | "BE";
    protected debugFlag: boolean;
    debugHex?: string;

    get position() : number
    {
        return this._position;
    }

    get bufferT() : Buffer
    {
        return this.buffer;
    }

    /**
     * Initializes a new instance of the BufferReader class.
     * @param buffer The buffer to read from.
     */
    constructor(buffer: Buffer)
    {
        this.buffer = buffer;
        this._position = 0;
        this.debugFlag = false;
    }

    setDebug(flag: boolean)
    {
        this.debugFlag = flag;
    }

    getDebug(): boolean
    {
        return this.debugFlag;
    }

    setBytesOrder(order: "LE" | "BE")
    {
        this.order = order;
    }

    getBytesOrder(): "LE" | "BE"
    {
        return this.order ? this.order : BufferReader.IsLittleEndian() ? "LE" : "BE";
    }

    /**
     * Determines if the buffer has enough unread data to read the specified
     * amount of bytes. If no length is specified, the method will check if there
     * is at least one byte left to read.
     *
     * @param {number} [length=0] The amount of bytes to check for.
     * @returns {boolean} True if the buffer has enough unread data, otherwise false.
     */
    canRead(length: number = 0): boolean
    {
        return this.position + length < this.buffer.length;
    }

    /**
     * Moves the reading position to the specified offset.
     *
     * @param {number} offset The offset to move to.
     * @param {'absolute' | 'relative' | 'end'} [mode='absolute'] The mode to use for setting the position.
     *     'absolute' will set the position to the given offset, 'relative' will move the position by the given
     *     offset from the current position, and 'end' will set the position to the end of the buffer minus the
     *     given offset.
     */
    seek(offset: number, mode: 'absolute' | 'relative' | 'end' = 'absolute')
    {
        switch (mode) {
            case 'absolute':
                this._position = offset;
                break;
            case 'relative':
                this._position += offset;
                break;
            case 'end':
                this._position = this.buffer.length - offset;
                break;
        }

        // Prevent out-of-bounds
        this._position = Math.max(0, Math.min(this.position, this.buffer.length - 1));
    }

    /**
     * Reads a single byte from the buffer.
     * @returns The read byte.
     */
    readByte()
    {
        const byte = this.buffer.readUInt8(this.position);
        this._position += 1;
        return byte;
    }

    /**
     * Reads a signed byte from the buffer.
     * @returns The read signed byte.
     */
    readSByte()
    {
        const byte = this.buffer.readInt8(this.position);
        this._position += 1;
        return byte;
    }

    /**
     * Reads a specified number of bytes from the buffer.
     * @param length The number of bytes to read.
     * @returns The read bytes.
     */
    readBytes(length: number)
    {
        const bytes = this.buffer.subarray(this.position, this.position + length);
        this._position += length;

        return bytes;
    }

    peekBytes(length: number)
    {
        return this.buffer.subarray(this.position, this.position + length);
    }

    /**
     * Reads a boolean value from the buffer.
     * @returns {boolean} True if the read byte is not zero, otherwise false.
     */
    readBoolean(): boolean
    {
        return this.readByte() != 0;
    }

    /**
     * Reads a 16-bit unsigned integer from the buffer.
     * @returns The read 16-bit unsigned integer.
     */
    readUInt16()
    {
        const uint16 = (!this.order ? BufferReader.IsLittleEndian() : this.order == "LE") ? this.buffer.readUInt16LE(this.position) : this.buffer.readUInt16BE(this.position);
        this._position += 2;
        return uint16;
    }

    /**
     * Reads a 16-bit signed integer from the buffer.
     * @returns The read 16-bit signed integer.
     */
    readInt16()
    {
        const int16 = (!this.order ? BufferReader.IsLittleEndian() : this.order == "LE") ? this.readInt16LE() : this.readInt16BE();
        return int16;
    }

    readInt16LE()
    {
        const int16 = this.buffer.readInt16LE(this.position);
        this._position += 2;
        return int16;
    }

    readInt16BE()
    {
        const int16 = this.buffer.readInt16BE(this.position);
        this._position += 2;
        return int16;
    }

    /**
     * Reads a 32-bit unsigned integer from the buffer.
     * @returns The read 32-bit unsigned integer.
     */
    readUInt32()
    {
        const uint32 = (!this.order ? BufferReader.IsLittleEndian() : this.order == "LE") ? this.readUInt32LE() : this.readUInt32BE();
        return uint32;
    }

    readUInt32LE()
    {
        const uint32 = this.buffer.readUInt32LE(this.position);
        this._position += 4;
        return uint32;
    }

    readUInt32BE()
    {
        const uint32 = this.buffer.readUInt32BE(this.position);
        this._position += 4;
        return uint32;
    }

    /**
     * Reads a 32-bit signed integer from the buffer.
     * @returns The read 32-bit signed integer.
     */
    readInt32()
    {
        const int32 = (!this.order ? BufferReader.IsLittleEndian() : this.order == "LE") ? this.readInt32LE() : this.readInt32BE();
        return int32;
    }

    readInt32LE()
    {
        const int32 = this.buffer.readInt32LE(this.position);
        this._position += 4;
        return int32;
    }

    readInt32BE()
    {
        const int32 = this.buffer.readInt32BE(this.position);
        this._position += 4;
        return int32;
    }

    /**
     * Reads a 64-bit signed integer from the buffer.
     * @returns The read 64-bit signed integer.
     */
    readInt64()
    {
        const int64 = (!this.order ? BufferReader.IsLittleEndian() : this.order == "LE") ? this.readInt64LE() : this.readInt64BE();
        return int64;
    }

    readInt64LE()
    {
        const int64 = this.buffer.readBigInt64LE(this.position);
        this._position += 8;
        return int64;
    }

    readInt64BE()
    {
        const int64 = this.buffer.readBigInt64BE(this.position);
        this._position += 8;
        return int64;
    }

    /**
     * Reads a double-precision floating-point number from the buffer.
     * @returns The read double.
     */
    readDouble()
    {
        const double = (!this.order ? BufferReader.IsLittleEndian() : this.order == "LE") ? this.buffer.readDoubleLE(this.position) : this.buffer.readDoubleBE(this.position);

        this._position += 8;
        return double;
    }


    /**
     * Reads a single-precision floating-point number from the buffer.
     * @returns The read single.
     */
    readSingle()
    {
        const single = (!this.order ? BufferReader.IsLittleEndian() : this.order == "LE") ? this.buffer.readFloatLE(this.position) : this.buffer.readFloatBE(this.position);
        this._position += 4;
        return single;
    }

    /**
     * Determines if the node.js process is running on a little-endian architecture.
     * @returns {boolean} True if the process is running on a little-endian architecture, false if it is running on a big-endian architecture.
     */
    static IsLittleEndian(): boolean
    {
        return os.endianness() === 'LE';
    }
}