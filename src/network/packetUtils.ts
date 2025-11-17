import HevaServer from "../main/hevaServer";

const fs = require('fs');
const readline = require('readline');

/**
 * Deobfuscates a client packet header, and returns the result if successful.
 * The deobfuscation is done by XORing the first 5 bytes of the packet with the corresponding values from the lookup tables.
 * The lookup index is determined by the packet index, and the lookup table to use is determined by the packet header.
 * The function returns undefined if the deobfuscation fails.
 * @param packetData The packet data to deobfuscate.
 * @param packetIndex The packet index to use for determining the lookup index.
 * @returns The deobfuscated packet header, or undefined if the deobfuscation fails.
 */
export function deobfuscateClientPacketHeader(packetData: Buffer<ArrayBuffer>, packetIndex: number): Buffer | undefined
{
    let packetHeader = packetData.readUInt32LE(0);
    let xorByte = packetData.readUint8(4);

    packetIndex &= 0x1FF;

    let transformedBits = ((packetHeader & 0x38) << 2 | xorByte & 0x1C) * 2;
    let maskedBits = (packetHeader >> 3) & 0x1800000;

    let extractedBits = Buffer.alloc(4);
    extractedBits.writeUIntLE((((transformedBits | (packetHeader & 0xE00)) << 11) & 0xFFFFFF) | (maskedBits & 0xFFFFFF), 1, 3);
    let headerChecksum = maskedBits >> 24;

    let lookupIndex = HevaServer.validationTable.readUInt16LE(packetIndex * 2) & 0x7FF;

    packetIndex += 1;

    if(lookupIndex != ((transformedBits | packetHeader & 0xe00) << 0xb | maskedBits) >> 0xe)
    {
        console.error("Lookup index mismatch", packetIndex, lookupIndex, ((transformedBits | packetHeader & 0xe00) << 0xb | maskedBits) >> 0xe);
        return undefined;
    }

    let xorLoopCounter = 5;
    for (let i = 0; i < xorLoopCounter; i++)
    {
        packetData[i] ^= HevaServer.lookupTables[i][lookupIndex << 2];
    }

    packetHeader = packetData.readUInt32LE(0);
    packetHeader = (packetHeader >> 2 & 0xe00000 | packetHeader & 0x1c0000) >> 9 | packetHeader & 0x1c0;
    maskedBits = packetData.readUint8(4) << 4;
    transformedBits = packetHeader >> 6;
    
    extractedBits.writeUIntLE(((packetHeader >> 0xe) & 0xFFFFFF) | ((maskedBits >> 8) & 0xFFFFFF) & 0xfffffe | extractedBits.readUIntLE(1, 3), 1, 3);

    packetHeader = packetData.readUInt32LE(0);
    lookupIndex = (((packetData[4] & 3) << 0xb | packetHeader & 0xffff8000) << 8 | packetHeader & 0x600000) << 6;
    headerChecksum = ((lookupIndex >> 24) & 0xFF) | headerChecksum;

    maskedBits = transformedBits | maskedBits & 0xe00;
    extractedBits.writeUIntLE(transformedBits, 0, 1);

    if (((maskedBits < 0x1001) && (5 < maskedBits - (lookupIndex >>> 29))) && (((packetIndex + (lookupIndex >>> 29) ^ lookupIndex >>> 25) & 0xF) == 0))
    {
        packetData.writeUInt32LE(((packetHeader >> 10 & 0x3C0000) | ((packetHeader & 7) << 15) | extractedBits.readUInt32LE(0) | (packetHeader & 0x7000)) >>> 0, 0);
        packetData.writeUInt8(headerChecksum, 4);

        return packetData;
    }

    console.error("Failed to deobfuscate packet header");
    return undefined;
}

/**
 * Deobfuscates a client packet using the provided lookup tables and validation table.
 * The deobfuscation involves an XOR operation on the packet data with values from
 * the lookup tables and validation table to restore the original packet.
 * 
 * @param packetData - The obfuscated packet data represented as a Buffer.
 * @returns The deobfuscated packet as a Buffer if successful, or undefined if deobfuscation fails.
 */
export function deobfuscateClientPacket(packetData: Buffer<ArrayBuffer>)
{
    let deobfuscatedPacket = Buffer.alloc(packetData.length);

    let packetHeader = packetData.readUInt32LE(0);
    let maskedHeader = packetData.readUInt32LE(1);
    let packetSize = (packetData.readUInt16LE(0) & 0xFFF);
    let extractedValue = packetSize - (maskedHeader >>> 29);

    let xorByte = 0;
    let rollingXor = 0;

    let lookupTableIndex = maskedHeader >> 14 & 0x7FF;

    for (let i = 0; i < 5; i++)
    {
        let xorByte = HevaServer.crcTable[packetData[i] ^ rollingXor];
        rollingXor = xorByte;
    }

    if(extractedValue > 6)
    {
        let remainingBytes = (extractedValue & 0xffff) - 6 & 0xffff;
        let currentByte = 6;

        let cursor = 0;
        do 
        {
            const offset = currentByte + (lookupTableIndex - cursor) + ((maskedHeader >> 25 & 0xf) - lookupTableIndex);

            const lookupIndex = ((currentByte + (lookupTableIndex - cursor)) & 0x7ff) * 4;
            const tablePos = offset & 0xf;

            deobfuscatedPacket[currentByte] = packetData[currentByte] ^ HevaServer.lookupTables[tablePos][lookupIndex];
            
            xorByte = HevaServer.crcTable[deobfuscatedPacket[currentByte] ^ rollingXor];
            rollingXor = xorByte;
            
            currentByte++;
            remainingBytes--;
        } while (remainingBytes != 0);
    }

    if(xorByte == packetData[5])
    {
        deobfuscatedPacket.writeUInt16LE(((packetHeader >> 0xc) & 0xFFFF) & 0x3ff, 2);
        deobfuscatedPacket.writeInt16LE(extractedValue, 0);

        return deobfuscatedPacket;
    }

    return undefined;
}

/**
 * Obfuscates a server packet using the provided lookup tables and validation table.
 * The obfuscation process involves generating random values, extracting packet size and second field,
 * and performing a two-phase XOR operation on the packet data to produce the obfuscated packet.
 * @param packetData - The server packet data represented as a Buffer.
 * @returns The obfuscated packet as a Buffer if successful, or 0 if obfuscation fails.
 */
export function obfuscateServerPacket(packetData: Buffer<ArrayBuffer>)
{
    // Generate random values similar to rand() % 512 and rand() % 16
    const randomBits = Math.floor(Math.random() * 512);
    const randomShifted = Math.floor(Math.random() * 16);
    
    // Extract packet size from first 2 bytes
    const packetSize = packetData.readUInt16LE(0);

    // Extract second field from next 2 bytes
    const secondField = packetData.readUInt16LE(2);

    // Check if packet size and second field are within valid ranges
    if (secondField > 0x3FF || packetSize > 4095) {
        return 0;
    }

    const tempBuffer = Buffer.alloc(5);
    tempBuffer.writeUInt32LE(0, 0); // Initialize with 0 to ensure clean state

    // Set up the transformed header value in v23 (tempBuffer) as in the original code
    // This is the direct translation of: *(_DWORD *)&v23[1] = *(_WORD *)&v23[1] & 0x3FFF | ((v2 + v3) << 29) | ((v2 & 0x7FF | ((v3 & 0xF) << 11)) << 14);
    const lookupOffset = ((randomShifted & 0xF) << 11 | randomBits & 0x7FF) << 14;
    const headerChecksum = ((randomShifted + randomBits) & 0xF) << 29;
    let headerValue = (tempBuffer.readUInt32LE(1) & 0x3FFF) | headerChecksum | lookupOffset;
    tempBuffer.writeUInt32LE(headerValue >>> 0, 1);

    // This is the direct translation of: v7 = *(_DWORD *)v23 & 0xFFC00000 | v4 & 0xFFF | ((v5 & 0x3FF) << 12);
    // Where v7 is transformedHeader, v4 is packetSize, v5 is secondField
    const transformedHeader = (tempBuffer.readUInt32LE(0) & 0xFFC00000) | (packetSize & 0xFFF) | ((secondField & 0x3FF) << 12);

    tempBuffer.writeUInt32LE(transformedHeader >>> 0, 0);

    // Update the 5th byte (at index 4) - translated from *(_BYTE *)(a2 + 4) = *(_BYTE *)(a2 + 4) & 0xE0 | (4 * (v7 & 7)) | (*(_DWORD *)&v23[1] >> 27) & 3;
    packetData[4] = (packetData[4] & 0xE0) | ((transformedHeader  & 7) << 2) | ((headerValue >> 27) & 3);
    
    // Calculate a complex value for the first 4 bytes
    const complexValue = (packetData.readUInt32LE(0) & 0xC70038) | 
                         ((transformedHeader & 0x38 | 
                          ((transformedHeader & 0x3C0000 | (headerValue >> 7) & 0x1C00000) >> 9)) >> 3) | 
                         (4 * ((headerValue & 0x6000000) | 
                          (4 * (transformedHeader & 0x38000 | 
                           (8 * (transformedHeader & 0x1C0 | 
                            (32 * (transformedHeader & 0x7000 | 
                             ((transformedHeader & 0xFFFFFE00) << 8)))))))));
    
    // Update the first 4 bytes
    packetData.writeUInt32LE(complexValue >>> 0, 0);

    // First phase of encryption - first 5 bytes
    let rollingXor = 0;
    for (let i = 0; i < 5; i++) {
        // Using a predefined XOR table
        rollingXor = HevaServer.crcTable[rollingXor ^ tempBuffer[i]];

        // XOR with value from lookup table - using randomBits << 2 as in your current code
        packetData[i] ^= HevaServer.lookupTables[i][randomBits << 2];
    }

    // Second phase of encryption - remaining bytes
    if (packetSize > 6)
    {
        let remainingBytes = packetSize - 6 & 0xffff;
        let currentByte = 6;

        do 
        {
            // Update rolling XOR
            rollingXor = HevaServer.crcTable[rollingXor ^ packetData[currentByte]];
            
            // Complex XOR operation
            const lookupIndex = (currentByte + (randomBits - 0) + (randomShifted & 0x8000000f) - randomBits) & 0xF;
            const offsetIndex = (currentByte + (randomBits - 0)) & 0x7FF;

            packetData[currentByte] ^= HevaServer.lookupTables[lookupIndex][offsetIndex << 2];

            currentByte++;
            remainingBytes--;
        } while (remainingBytes != 0)
    }
    
    // Final updates to the packet header
    packetData[4] = (packetData[4] & 0x1F) | ((headerValue >> 17) << 5);
    
    const finalComplexValue = (packetData.readUInt32LE(0) & 0xFF38FFC7) | 
                             ((headerValue & 0x1800000 | 
                              (((0x700000) & headerValue | 
                               (headerValue >> 7) & 0x380) >> 3)) >> 1);
    
    packetData.writeUInt32LE(finalComplexValue >>> 0, 0);
    packetData[5] = rollingXor;

    return packetData;
}

/**
 * Applies a workaround XOR transformation to an obfuscated packet.
 * The function first copies and transforms the raw header and calculates
 * a final validation byte. It then performs a 5-byte XOR transformation
 * using lookup values from the server's lookup tables. If the packet size
 * exceeds 6, it continues processing the remaining bytes using a rolling
 * XOR transformation. The function ultimately returns the final rolling
 * XOR value.
 *
 * @param obfuscatedPacket - The packet data to apply the XOR workaround on.
 * @returns The final rolling XOR value after processing the packet.
 */

function xorWorkaround(obfuscatedPacket: Buffer)
{
    let packetData = Buffer.alloc(obfuscatedPacket.length);
    obfuscatedPacket.copy(packetData, 0);

    let rawHeader = packetData.readUInt32LE(0);
    let transformedRawHeader = ((((packetData[4] & 0xffffe0e0) << 1 | rawHeader & 0x38) << 7 | rawHeader & 0x70000) << 3 | rawHeader & 0xC00000) << 1;
    let finalValidationByte = (transformedRawHeader >> 24) & 0xFF;

    let xorIndex = 0;

    do
    {
        let lookupValue = HevaServer.lookupTables[xorIndex][(transformedRawHeader >> 14) << 2];

        packetData[xorIndex] ^= lookupValue;
        xorIndex++;
    } while (xorIndex < 5);

    let transformedHeader = packetData.readUInt32LE(0);
    let maskedField = transformedHeader >> 13 & 0x70000 | transformedHeader & 0xE000;
    let sizeField = (((maskedField >> 5) | (packetData[4] & 0x1C)) >> 2) | ((transformedHeader & 7) << 3);

    let decodedHeaderFields = Buffer.alloc(4); // 4-byte buffer
    decodedHeaderFields.writeUIntLE(((maskedField >> 15) | transformedRawHeader) & 0xFFFFFF, 1, 3); // Ensure only 3 bytes

    let validationByte2 = (((packetData[4] & 3) << 8 | transformedHeader & 0xFFFFFC00) << 19) >>> 24;
    let validationByte1 = validationByte2 | (transformedHeader >> 26) & 6;
    finalValidationByte = validationByte1 | finalValidationByte;

    decodedHeaderFields.writeUInt8(sizeField & 0xFF, 0); // First byte is the packet size

    let newHeader = (transformedHeader >> 8 & 0x70000 | transformedHeader & 0x380000) >> 4 |
    (transformedHeader & 0x3C0) << 12 | decodedHeaderFields.readUInt32LE(0);

    packetData.writeUInt32LE(newHeader, 0);
    packetData[4] = finalValidationByte;

    let packetCursor = packetData;
    transformedHeader = packetCursor.readUInt32LE(1);
    rawHeader = packetCursor.readUInt32LE(0);
    let lookupTableIndex = (transformedHeader >> 14) & 0x7FF;
    let packetSize = packetCursor.readUInt16LE(0) & 0xFFF;
    let rollingXor = 0;

    // First 5-byte XOR transformation
    for (let i = 0; i < 5; i++) {
        let xorByte = HevaServer.crcTable[packetCursor[i] ^ rollingXor];
        rollingXor = xorByte;
    }

    // If packet size > 6, process the rest
    if (packetSize > 6) {
        let remainingBytes = packetSize - 6;
        let currentByte = 6;

        let cursor = 0;

        while (remainingBytes > 0) {
            // Calculate the byte and lookup indices
            const offset = currentByte + (lookupTableIndex - cursor) + ((transformedHeader >> 25 & 0xf) - lookupTableIndex);

            const lookupIndex = ((currentByte + (lookupTableIndex - cursor)) & 0x7ff) * 4;
            const tablePos = offset & 0xf;

            // Apply XOR transformation using the lookup table
            packetCursor[currentByte] ^= HevaServer.lookupTables[tablePos][lookupIndex];

            let xorByte = HevaServer.crcTable[packetCursor[currentByte] ^ rollingXor];
            rollingXor = xorByte;
            currentByte += 1;
            remainingBytes -= 1;
        }
    }

    return rollingXor;
}

export async function readTable2()
{
    const fileStream = fs.createReadStream('./src/res/table2.txt');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let table = [];

    for await (const line of rl) {
        table.push(Number.parseInt(line, 16));
    }

    return table;
}

export async function readItemsTable()
{
    const fileStream = fs.createReadStream('./src/res/itemsHashTable.txt');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let table = [];

    for await (const line of rl)
    {
        table.push(Number.parseInt(line, 16));
    }

    return Buffer.from(table);
}