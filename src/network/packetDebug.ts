import { lookupIndexTable } from "./packetUtils";

export function deobfuscateServerPacketHeader(lookupTables: number[][], packetData: Buffer<ArrayBuffer>)
{
    let rawHeader = packetData.readUInt32LE(0);
    let transformedRawHeader = ((((packetData[4] & 0xffffe0e0) << 1 | rawHeader & 0x38) << 7 | rawHeader & 0x70000) << 3 | rawHeader & 0xC00000) << 1;
    let finalValidationByte = (transformedRawHeader >> 24) & 0xFF;

    let xorIndex = 0;

    do
    {
        let lookupValue = lookupTables[xorIndex][(transformedRawHeader >> 14) << 2];

        console.log(
            `XOR Index: ${xorIndex}, Original Byte: ${packetData[xorIndex].toString(16)}, Lookup Value: ${lookupValue.toString(16)}, byteShift: ${(transformedRawHeader >> 14) * 4} | ${transformedRawHeader >> 14}`
        );

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

    let returnValue = sizeField & 0xFFFF;

    if ((returnValue - 6) < 0xFFB) {
        let concatValue = (finalValidationByte << 24) | decodedHeaderFields.readUIntLE(1, 3);
        let validationCheck = ((validationByte1 >> 1) + ((concatValue >> 14) & 0xFF)) & 7;

        if ((validationByte2 >> 5) === validationCheck) {
            let newHeader = (transformedHeader >> 8 & 0x70000 | transformedHeader & 0x380000) >> 4 |
                (transformedHeader & 0x3C0) << 12 | decodedHeaderFields.readUInt32LE(0);

            packetData.writeUInt32LE(newHeader, 0);
            packetData[4] = finalValidationByte;

            return returnValue;
        }
    }

    return 0;
}

export function deobfuscateServerPacket(lookupTable: number[][], validationTable: number[], packetData: Buffer): number {
    if (packetData.length < 6) {
        console.log("Invalid packet size");
        return 0;
    }

    let packetCursor = packetData;
    let transformedHeader = packetCursor.readUInt32LE(1);
    let rawHeader = packetCursor.readUInt32LE(0);
    let lookupTableIndex = (transformedHeader >> 14) & 0x7FF;
    let packetSize = packetCursor.readUInt16LE(0) & 0xFFF;
    let rollingXor = 0;

    console.log(transformedHeader.toString(16), lookupTableIndex)

    // First 5-byte XOR transformation
    for (let i = 0; i < 5; i++) {
        let xorByte = validationTable[packetCursor[i] ^ rollingXor];
        rollingXor = xorByte;
    }

    console.log("packetCursor before body deobfuscation", packetCursor)
    console.log("rollingXor", rollingXor)

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
            packetCursor[currentByte] ^= lookupTable[tablePos][lookupIndex];

            let xorByte = validationTable[packetCursor[currentByte] ^ rollingXor];
            rollingXor = xorByte;
            currentByte += 1;
            remainingBytes -= 1;
        }
    }

    console.log(rollingXor.toString(16), packetCursor[5].toString(16))

    // Validate packet
    if (rollingXor === packetCursor[5]) {
        let newHeader = ((rawHeader >> 12) & 0x3FF);
        packetCursor.writeUInt16LE(newHeader, 2);
        packetCursor.writeUInt16LE(packetSize, 0);
        console.log("Packet validated, size:", packetSize, newHeader);
        return packetSize;
    } else {
        console.log("Packet validation failed");
        return 0;
    }
}

// this doesnt work, it has some problems
export function obfuscateClientPacket(lookupTables: number[][], table2: number[], packetData: Buffer<ArrayBuffer>, packetIndex: number) {
    console.log(packetData)
    let packetSize = packetData.readUInt16LE(0);
    let randomizedHeader = 0;

    if ((0x1000 - packetSize) < 7) {
        randomizedHeader = 0;
    } else {
        let randomValue = Math.floor(Math.random() * 8);
        //randomizedHeader = randomValue << 29;
        randomizedHeader = -1140818135 >>> 0;
    }

    packetIndex &= 0x1FF;
    let lookupTableIndex = lookupIndexTable.readUInt16LE(packetIndex); 
    packetIndex += 1;

    console.log("lookupTableIndex", lookupTableIndex)

    let encryptionSeed = (packetIndex + (randomizedHeader >>> 29)) & 0xf;

    let xorByte = ((encryptionSeed << 11 | lookupTableIndex & 0x7ff) << 14) >> 0x18;
    let validationByte = xorByte | (randomizedHeader >> 0x18);

    let test = lookupTableIndex << 22;

    console.log(randomizedHeader, lookupTableIndex, encryptionSeed, validationByte);
    let transformedHeader = (randomizedHeader & 0xE0003FFF) | (((lookupTableIndex & 0x7FF) | (encryptionSeed << 11)) << 14); // v8

    let test2 = (randomizedHeader >> 29) + packetData.readUint32LE(0);
    let test3 = (packetData.readUInt16LE(2) & 0x3FF) << 12;
    let updatedPacketIndex = (packetData.readUInt16LE(0) + ((transformedHeader >>> 29) & 7)) & 0xFFFF;

    let packetBodySize = (transformedHeader & 0xFFC00000) | (updatedPacketIndex & 0xFFF) | ((packetData.readUInt16LE(2) & 0x3FF) << 12);
    
    test = test3 | test2 & 0xFFF | test;
    packetData[4] = (((transformedHeader >>> 25) & 3) ^ (packetData[4] & 0x1C)) | ((packetBodySize >>> 9) & 0xE0);

    let buffTest = Buffer.alloc(4);
    buffTest.writeUIntLE(test >>> 0, 0, 4);
    console.log("testBuff", buffTest)
    //transformedHeader = (transformedHeader & 0xFFC00000) | (updatedPacketIndex & 0xFFF) | ((packetData.readUInt16LE(2) & 0x3FF) << 12);

    console.log(packetData, "expected: 0e 00 03 00 02 00 07 09 11 00 e8 03");
    
    let rollingXor = 0;
    let lookupOffset = 0;

    packetData.writeUInt32LE(
        (packetData.readUInt32LE(0) & 0xC000E38) |
        ((transformedHeader >>> 14) & 0x38000) |
        (packetBodySize & 0x7000) |
        (((transformedHeader & 0x18000000) | ((packetBodySize >>> 9) & 0x1C0)) >>> 6) |
        (((packetBodySize & 7) | (16 * ((packetBodySize & 0xFFFC0000) | (32 * ((packetBodySize & 0x38) | (4 * (packetBodySize & 0x1C0))))))) << 6),
        0
    );

    console.log(packetData, "expected: C8 B0 2A 00 02 00 07 09 11 00 E8 03");

    //for(let i = 0; i < 255; i++)
    //    console.log("test", i, (0xa9 ^ i).toString(16), table2[0xa9 ^ i].toString(16));

    console.log("test", (173).toString(16), (0xc5 ^ 0x40).toString(16), 0xc5, 51, table2[0xc5 ^ 51].toString(16));

    // Create a buffer of 5 bytes
    let transformedHeaderBuffer = Buffer.alloc(5);

    let headerBuf = Buffer.alloc(4);
    headerBuf.writeUint32LE(transformedHeader >>> 0, 0);
    let packetBuf = Buffer.alloc(4);
    packetBuf.writeUInt32LE(packetBodySize >>> 0, 0);

    // Copy first 2 bytes from packetBodySize buffer
    packetBuf.copy(transformedHeaderBuffer, 0, 0, 2);
    
    transformedHeaderBuffer[2] = buffTest[2];
    
    // Copy bytes 2-3 (index) from transformedHeader to positions 3-4
    headerBuf.copy(transformedHeaderBuffer, 3, 2, 4);

    //console.log(transformedHeader2.toString(16), transformedHeaderBuffer, packetBodySize.toString(16), transformedHeader.toString(16))
    //transformedHeaderBuffer.writeUint32LE(transformedHeader >>> 0, 0);
    //transformedHeaderBuffer.writeUInt32LE(packetBodySize >>> 0, 0);
    //transformedHeaderBuffer[4] = transformedHeaderBuffer[3]; // 0xad
    //transformedHeaderBuffer[3] = 0x33;
    //transformedHeaderBuffer[2] = 0x40;

    let oooo = packetData.readUint32LE(0);
    let xorLoopCounter = 5;
    for (let i = 0; i < xorLoopCounter; i++)
    {
        let offsetByte = transformedHeaderBuffer[i];
        let xorIndex = offsetByte ^ rollingXor;

        xorByte = table2[xorIndex];

        console.log(`${i} rollingXor: ${rollingXor}`, `currentByte: ${packetData[i]}`, `packetBodySize: ${packetBodySize}`, `xorIndex: ${xorIndex}`, `offsetByte: ${offsetByte}`, `xorByte: ${xorByte} (${xorByte.toString(16)})`);

        rollingXor = xorByte;
        packetData[i] ^= lookupTables[lookupOffset][lookupTableIndex << 2];
        lookupOffset += 1;
    }

    //rollingXor = 0x61;
    console.log(rollingXor.toString(16))

    console.log(packetData, "expected: 8C F4 6E 25 1E 00 07 09 11 00 E8 03");

    packetBodySize = 6;
    if(packetSize > 6)
    {
        let remainingBytes = packetSize - 6;
        packetBodySize = (remainingBytes + 6) & 0xffff;
    
        let packetByteCursor = 6; // Start at byte index 6
    
        while (remainingBytes > 0)
        {
            // First XOR operation using byte_767118 lookup table
            xorByte = table2[packetData[packetByteCursor] ^ rollingXor];
            rollingXor = xorByte;

            // Second XOR operation using packetHandler.lookupTable
            const tableX = 
                ((packetByteCursor) + (lookupTableIndex - 0) + (encryptionSeed - lookupTableIndex)) & 0xf;
            const tableY = 
                (((packetByteCursor) + (lookupTableIndex - 0)) & 0x7ff) * 4;
        
            packetData[packetByteCursor] ^= lookupTables[tableX][tableY];
        
            packetByteCursor++;
            remainingBytes--;
        }
    }

    packetData[5] = xorByte;

    let concat = (validationByte << 24 | transformedHeader);

    packetData[4] ^= ((concat >> 14) << 2 ^ packetData[4]) & 0x1C;

    packetData.writeUInt32LE(
        ((transformedHeader & 0x700000) >> 11 |
        (concat & 0x1800000) << 3 |
        (transformedHeader & 0xe0000) >> 14 |
        (packetData.readUInt32LE(0) & 0xf3fff1c7)) >>> 0, 0);


    console.log(packetData);
}