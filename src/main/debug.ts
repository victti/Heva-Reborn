export function obfuscatePacketHeader(lookupTables: number[][], table2: number[], table3: Buffer<ArrayBuffer>, packetData: Buffer<ArrayBuffer>)
{
    let serverPacketIndex = 1;

        // Read the original packet size (first 2 bytes)
  const originalSize = packetData.readUInt16LE(0);

  // For server-side obfuscation, we assume no randomization
  const randomizedHeader = 0;

  // Determine the lookup table index deterministically
  let lookupTableIndex = table3.readUint16LE(serverPacketIndex);
  serverPacketIndex = (serverPacketIndex + 1) >>> 0;

  // Compute encryption seed.
  // In the original, encryptionSeed = ((randomizedHeader >> 29) + packetIndex) & 0xF.
  // Here randomizedHeader is 0.
  const encryptionSeed = ((randomizedHeader >>> 29) + (serverPacketIndex & 0x1FF)) & 0xF;

  // Compute xorByte and validationByte.
  // Original: xorByte = (((encryptionSeed << 11 | (lookupTableIndex & 0x7FF)) << 14) >> 24)
  let xorByte = (((encryptionSeed << 11) | (lookupTableIndex & 0x7FF)) << 14) >>> 24;
  // validationByte is then: xorByte | (randomizedHeader >> 24). With randomizedHeader zero, it equals xorByte.
  const validationByte = xorByte;

  // uVar1 is the original packet size (stored in the first 2 bytes)
  const uVar1 = originalSize;

  // Build transformedHeader.
  // In the original, transformedHeader = (lookupTableIndex << 22) | (packetBodySize) | (updatedPacketIndex & 0xfff).
  // Here, updatedPacketIndex = ( (randomizedHeader >> 29) + uVar1 ) but randomizedHeader is 0.
  const updatedPacketIndex = uVar1 & 0xFFFF;
  // packetBodySize is computed from bytes at offset 2 (mask with 0x3FF then shifted left 12).
  const packetBodySize = (packetData.readUInt16LE(2) & 0x3FF) << 12;
  let transformedHeader = (lookupTableIndex << 22) | (updatedPacketIndex & 0xFFF) | packetBodySize;

  // Write the transformedHeader into the first 4 bytes of the packet.
  packetData.writeUInt32LE(transformedHeader, 0);

  // Adjust packetData[4] using transformedHeader and the computed xorByte.
  // Original: packetData[4] = ((char)(transformedHeader >> 9) << 5 | (packetData[4] & 0x1C)) ^ ((xorByte & 6) >> 1);
  let temp = ((transformedHeader >>> 9) << 5) | (packetData[4] & 0x1C);
  packetData[4] = temp ^ (((xorByte & 6) >> 1) & 0xFF);

  // Begin the rolling XOR on the first 5 bytes.
  let rollingXor = 0;
  let lookupOffset = 0;
  for (let i = 0; i < 5; i++) {
    // Use the byte table for rolling XOR.
    xorByte = table2[packetData[i] ^ rollingXor];
    rollingXor = xorByte;
    // XOR the current byte with a value from the lookup tables.
    // Here we assume each row of lookupTables is an array of bytes.
    const lookupValue = lookupTables[lookupOffset][(lookupTableIndex * 4) % lookupTables[lookupOffset].length];
    packetData[i] ^= lookupValue;
    lookupOffset++;
  }

  // Final adjustment of packetData[4] using validationByte.
  // Original:
  //   packetData[4] ^= (((char)(CONCAT13(validationByte, transformedHeader._1_3_) >> 0xe) << 2) ^ packetData[4]) & 0x1C;
  // Here, simulate CONCAT13 by combining validationByte with the upper 3 bytes of transformedHeader.
  const upper3Bytes = transformedHeader >>> 8; // top 3 bytes
  const concat = (validationByte << 24) | (upper3Bytes & 0xFFFFFF);
  const adjustment = ((concat >>> 14) << 2) ^ packetData[4];
  packetData[4] ^= adjustment & 0x1C;

  // Optionally store the final rollingXor in packetData[5] (as the original does)
  packetData[5] = rollingXor & 0xFF;

  return packetData;
}

export function testThings2(lookupTables: number[][])
{
    let packetSize = 0xE24 & 0xFFF;
    let lookupValue = 0x100;

    const packetData = Buffer.alloc(5);
    
    // Step 1: We need to ensure three constraints:
    // 1. (transformedRawHeader >> 14) * 4 = lookupValue
    // 2. extractPacketSize(packetData) = packetSize
    // 3. (rawHeader >> 0x18) = 1 (finalValidationByte)
    
    // Start with bits for the finalValidationByte
    // This means the highest byte of rawHeader should have 1 in it
    let rawHeader = 1 << 24; // 0x01000000
    
    // Set the packet size bits 
    // Lower 3 bits of packet size go to bits 0-2 of the header
    rawHeader |= (packetSize & 0x7);
    
    // Set bits for packetData[4]
    // Bits 3-5 of packet size go to bits 2-4 of packetData[4]
    let byte5Value = ((packetSize >> 3) & 0x7) << 2;
    
    // Now we need to set bits that affect the XOR lookup value
    // This primarily involves bits 3-5 of rawHeader (0x38)
    // We can set these directly based on our lookup value
    
    // The lookup value is determined by (transformedRawHeader >> 14) * 4
    // transformedRawHeader is affected by bits 3-5 (0x38) of rawHeader
    
    // For simplicity, we'll use a direct approach to encode the lookup value
    // Set bits 22-23 of rawHeader to highest bits of our lookup value
    rawHeader |= ((lookupValue >> 8) & 0x3) << 22;
    
    // Set bits 16-18 of rawHeader to middle bits of our lookup value
    rawHeader |= ((lookupValue >> 5) & 0x7) << 16;
    
    // Set bits 3-5 of rawHeader to lower bits of our lookup value
    rawHeader |= ((lookupValue) & 0x7) << 3;
    
    // Write values to packet
    packetData.writeUInt32LE(rawHeader, 0);
    packetData[4] = byte5Value;

    let rawHeader2 = packetData.readUInt32LE(0);
    let transformedRawHeader = ((((packetData[4] & 0xE0) * 2 | rawHeader2 & 0x38) << 7 | rawHeader2 & 0x70000) << 3 | rawHeader2 & 0xC00000) * 2;
    let finalValidationByte = (transformedRawHeader >> 24) & 0xFF;

    console.log("rawHeader", rawHeader.toString(16));
    console.log("transformedRawHeader", transformedRawHeader.toString(16));
    console.log("finalValidationByte", finalValidationByte.toString(16));
}

const lookupIndexTable = Buffer.from([0xCD, 0x4, 0xAD, 0x0, 0x49, 0x0, 0x82, 0x5, 0xF2, 0x5, 0x1E, 0x3, 0xE4, 0x5, 0x3E, 0x1, 0xE0, 0x2, 0xEF, 0x1, 0x92, 0x4, 0x62, 0x6, 0x9, 0x7, 0xC6, 0x1, 0xC4, 0x4, 0x18, 0x5, 0xED, 0x0, 0x9C, 0x7, 0x85, 0x5, 0x7C, 0x7, 0xBC, 0x5, 0xC6, 0x2, 0xAE, 0x6, 0xBE, 0x4, 0x2C, 0x1, 0x43, 0x4, 0x67, 0x5, 0xA0, 0x7, 0x96, 0x5, 0x45, 0x7, 0xE4, 0x6, 0xA, 0x4, 0x55, 0x0, 0x1, 0x7, 0x5E, 0x5, 0xF, 0x0, 0x60, 0x6, 0x50, 0x3, 0x7, 0x4, 0x26, 0x5, 0x11, 0x1, 0xF3, 0x0, 0x1, 0x6, 0xAB, 0x3, 0x7F, 0x7, 0xFF, 0x7, 0x74, 0x4, 0xE3, 0x7, 0x37, 0x3, 0x99, 0x1, 0x22, 0x4, 0x4C, 0x4, 0x2D, 0x6, 0xA1, 0x2, 0x48, 0x5, 0xCF, 0x1, 0x54, 0x3, 0x1F, 0x2, 0xD, 0x4, 0xD8, 0x1, 0x3F, 0x1, 0xB, 0x6, 0x28, 0x0, 0xB6, 0x4, 0x3D, 0x2, 0xD6, 0x7, 0x2E, 0x0, 0x80, 0x3, 0xB6, 0x5, 0xF5, 0x1, 0x65, 0x2, 0x49, 0x7, 0x10, 0x2, 0x82, 0x3, 0xEE, 0x4, 0x91, 0x0, 0x41, 0x1, 0x3B, 0x4, 0x2D, 0x4, 0xC0, 0x1, 0x93, 0x5, 0x8E, 0x6, 0xF8, 0x6, 0x64, 0x2, 0xEA, 0x7, 0xC1, 0x6, 0x66, 0x2, 0x6C, 0x2, 0x2D, 0x0, 0x66, 0x5, 0xF8, 0x5, 0xBF, 0x6, 0x16, 0x4, 0xFD, 0x0, 0xEA, 0x3, 0xB, 0x3, 0x22, 0x0, 0xED, 0x2, 0xD7, 0x1, 0xC0, 0x4, 0xCF, 0x6, 0xA0, 0x3, 0x94, 0x5, 0x74, 0x3, 0x1E, 0x2, 0xF9, 0x1, 0x47, 0x2, 0x56, 0x2, 0x44, 0x3, 0x4, 0x2, 0xC7, 0x1, 0x11, 0x7, 0xAF, 0x4, 0xD7, 0x6, 0x3B, 0x6, 0xC3, 0x1, 0x41, 0x2, 0xC3, 0x3, 0xEB, 0x7, 0x5D, 0x2, 0xC8, 0x3, 0xC3, 0x0, 0x6A, 0x3, 0x20, 0x7, 0xBE, 0x5, 0x22, 0x6, 0xE8, 0x3, 0x6D, 0x0, 0x41, 0x4, 0x6E, 0x3, 0xD1, 0x5, 0xD8, 0x5, 0x53, 0x4, 0x9F, 0x5, 0xAB, 0x5, 0x66, 0x0, 0x54, 0x7, 0x82, 0x0, 0x30, 0x7, 0x27, 0x6, 0xBF, 0x4, 0x6A, 0x7, 0xA8, 0x0, 0xFF, 0x2, 0x21, 0x6, 0x17, 0x1, 0x89, 0x6, 0xA6, 0x2, 0x60, 0x1, 0xE5, 0x2, 0x52, 0x3, 0x5, 0x0, 0x29, 0x5, 0x3A, 0x7, 0xA6, 0x7, 0xB8, 0x5, 0xBB, 0x3, 0x2D, 0x3, 0xA7, 0x6, 0xDB, 0x3, 0xD4, 0x7, 0x72, 0x7, 0x92, 0x2, 0x1B, 0x7, 0xFA, 0x7, 0x8A, 0x0, 0xA1, 0x5, 0xF7, 0x4, 0xEE, 0x3, 0x31, 0x2, 0x5C, 0x1, 0x6B, 0x0, 0x1, 0x2, 0xC5, 0x4, 0x63, 0x1, 0x24, 0x5, 0x63, 0x5, 0x5D, 0x0, 0x60, 0x7, 0xFC, 0x0, 0x96, 0x1, 0x39, 0x4, 0x89, 0x0, 0xE7, 0x5, 0x27, 0x4, 0xE0, 0x1, 0xC5, 0x2, 0xB7, 0x7, 0x20, 0x2, 0x13, 0x0, 0xE, 0x1, 0x97, 0x2, 0xE4, 0x4, 0x70, 0x4, 0x3, 0x4, 0x20, 0x6, 0x8C, 0x1, 0x4D, 0x5, 0x0, 0x5, 0x62, 0x3, 0x19, 0x6, 0x15, 0x2, 0xEC, 0x0, 0xD7, 0x7, 0x4E, 0x6, 0xCF, 0x0, 0xED, 0x5, 0xAF, 0x3, 0xD0, 0x3, 0x1C, 0x6, 0xE0, 0x5, 0x61, 0x6, 0xED, 0x6, 0x92, 0x3, 0x57, 0x7, 0x4C, 0x0, 0x36, 0x0, 0x36, 0x6, 0x5E, 0x6, 0x52, 0x4, 0x8A, 0x7, 0x90, 0x4, 0x89, 0x7, 0x10, 0x5, 0x5E, 0x4, 0x23, 0x0, 0x67, 0x7, 0xF2, 0x1, 0x50, 0x7, 0x35, 0x5, 0x27, 0x1, 0x9A, 0x0, 0xEE, 0x0, 0x87, 0x0, 0x73, 0x6, 0xC2, 0x1, 0x91, 0x4, 0x3, 0x3, 0x92, 0x6, 0xA5, 0x7, 0xD0, 0x7, 0xDC, 0x2, 0xA6, 0x1, 0x23, 0x7, 0xD4, 0x0, 0x73, 0x7, 0x76, 0x1, 0x40, 0x2, 0x64, 0x3, 0xCC, 0x0, 0x77, 0x6, 0xE0, 0x0, 0x32, 0x0, 0x1E, 0x5, 0xC6, 0x7, 0xBE, 0x0, 0xC2, 0x7, 0xE6, 0x4, 0x42, 0x4, 0xC4, 0x5, 0xB6, 0x7, 0x8E, 0x3, 0xA7, 0x7, 0x19, 0x0, 0xFA, 0x3, 0x99, 0x4, 0x3A, 0x3, 0x8C, 0x4, 0x13, 0x2, 0xE9, 0x5, 0x20, 0x5, 0x5B, 0x1, 0x9B, 0x0, 0xDB, 0x6, 0x5, 0x5, 0x72, 0x0, 0xD7, 0x2, 0xCE, 0x0, 0x4E, 0x2, 0x5D, 0x5, 0x9E, 0x3, 0x64, 0x0, 0x81, 0x0, 0x82, 0x2, 0xF0, 0x6, 0x5F, 0x7, 0x3A, 0x4, 0x9, 0x5, 0x72, 0x4, 0x27, 0x5, 0x2, 0x1, 0x40, 0x4, 0xAA, 0x3, 0xC2, 0x2, 0x49, 0x5, 0xA0, 0x6, 0x61, 0x3, 0x4A, 0x2, 0x80, 0x4, 0x25, 0x2, 0xF4, 0x0, 0xC6, 0x3, 0xB2, 0x0, 0xAD, 0x2, 0x25, 0x0, 0x23, 0x4, 0x65, 0x5, 0x8E, 0x0, 0x1C, 0x4, 0x69, 0x2, 0xD0, 0x1, 0x7D, 0x3, 0xC0, 0x5, 0x4A, 0x7, 0x3D, 0x6, 0x9D, 0x5, 0x3D, 0x3, 0xB7, 0x0, 0x3E, 0x4, 0xFD, 0x4, 0xB5, 0x0, 0xCC, 0x2, 0x9F, 0x0, 0xA9, 0x3, 0xB8, 0x1, 0xFA, 0x0, 0xE4, 0x2, 0x97, 0x4, 0xFB, 0x1, 0x11, 0x3, 0x9C, 0x0, 0x51, 0x7, 0x87, 0x6, 0x3, 0x6, 0x6D, 0x6, 0xA6, 0x5, 0xF7, 0x6, 0xC2, 0x6, 0xD, 0x1, 0xCC, 0x7, 0xC3, 0x6, 0xD3, 0x3, 0x90, 0x0, 0xFD, 0x2, 0xAE, 0x4, 0xF6, 0x7, 0xCE, 0x1, 0xAF, 0x2, 0x35, 0x0, 0x96, 0x7, 0x7E, 0x5, 0x4B, 0x1, 0x51, 0x2, 0x7C, 0x1, 0x30, 0x6, 0xE7, 0x6, 0xCB, 0x2, 0x97, 0x1, 0x7E, 0x4, 0xDE, 0x7, 0xB0, 0x5, 0xC7, 0x0, 0x45, 0x3, 0x61, 0x1, 0x28, 0x5, 0x39, 0x2, 0xD0, 0x6, 0xCD, 0x3, 0x91, 0x3, 0xBF, 0x1, 0xEF, 0x5, 0x45, 0x0, 0xE3, 0x4, 0x16, 0x7, 0x23, 0x1, 0xD9, 0x7, 0xE5, 0x6, 0x3A, 0x2, 0x2A, 0x6, 0x5C, 0x6, 0x7E, 0x3, 0xC5, 0x5, 0x38, 0x7, 0x2E, 0x4, 0xFE, 0x5, 0xEF, 0x2, 0x2C, 0x5, 0xD5, 0x0, 0x4B, 0x0, 0x7A, 0x0, 0x1B, 0x5, 0x55, 0x1, 0xAC, 0x4, 0x88, 0x4, 0x37, 0x6, 0xDE, 0x2, 0x1F, 0x1, 0xAD, 0x6, 0xA3, 0x7, 0xFF, 0x4, 0xF3, 0x5, 0x8, 0x1, 0xF0, 0x5, 0xDC, 0x6, 0xE9, 0x6, 0xD5, 0x5, 0xD3, 0x1, 0x13, 0x7, 0x19, 0x1, 0x58, 0x4, 0x6A, 0x4, 0xD9, 0x2, 0x29, 0x7, 0x81, 0x4, 0x73, 0x2, 0x8B, 0x5, 0x8C, 0x3, 0xD4, 0x1, 0x1F, 0x7, 0x62, 0x0, 0x98, 0x0, 0x92, 0x0, 0x8A, 0x5, 0x0, 0x4, 0x8B, 0x6, 0x58, 0x5, 0x81, 0x2, 0x86, 0x4, 0x8B, 0x7, 0xC7, 0x6, 0x29, 0x1, 0xE4, 0x7, 0xD0, 0x2, 0xF6, 0x6, 0xFE, 0x3, 0x89, 0x5, 0x18, 0x1, 0x7E, 0x0, 0x19, 0x5, 0x8, 0x4, 0x46, 0x7, 0xBF, 0x3, 0xFB, 0x3, 0x3B, 0x5, 0x1D, 0x4, 0x5F, 0x3, 0xB1, 0x7, 0x63, 0x3, 0x57, 0x2, 0x2E, 0x5, 0x0, 0x2, 0x5A, 0x1, 0xFF, 0x1, 0xAC, 0x7, 0xA6, 0x6, 0xD5, 0x3, 0xD0, 0x0, 0xF3, 0x4, 0xF5, 0x3, 0x8D, 0x3, 0x83, 0x3, 0xDE, 0x5, 0xFE, 0x6, 0x9C, 0x4, 0x90, 0x3, 0xE5, 0x7, 0x36, 0x4, 0xD0, 0x5, 0x49, 0x2, 0xE3, 0x6, 0x69, 0x1, 0x7F, 0x1, 0xCC, 0x5, 0x16, 0x3, 0xC2, 0x3, 0xEB, 0x0, 0xA8, 0x2, 0x4E, 0x4, 0x88, 0x3, 0x7D, 0x1, 0x0, 0x7, 0xD1, 0x6, 0x63, 0x7, 0x47, 0x7, 0x91, 0x7, 0x93, 0x7, 0x32, 0x5, 0xF1, 0x7, 0x1A, 0x0, 0x72, 0x6, 0x1E, 0x1, 0x34, 0x5, 0xE6, 0x0, 0xB3, 0x6, 0xB2, 0x7, 0x40, 0x1, 0x99, 0x2, 0x58, 0x7, 0x77, 0x3, 0x7C, 0x5, 0x74, 0x0, 0x82, 0x4, 0xE7, 0x7, 0x35, 0x1, 0x7F, 0x2, 0x4, 0x5, 0xEA, 0x6, 0x6B, 0x7, 0x32, 0x7, 0xC1, 0x3, 0xE1, 0x0, 0x99, 0x0]);

function reconstructHeader()
{
    let data = Buffer.from([140, 246, 135, 76, 154, 28, 171, 0x00, 0x00, 0x00]);

    console.log("og", data);

    let rHeader = data.readUInt32LE(0);

    let step1 = data[4] & 0xE0;          // Extract bits from packetData[4]
    let step2 = step1 << 1;                    // Shift left by 1 (multiply by 2)
    let step3 = rHeader & 0x38;              // Extract bits from rawHeader
    let step4 = step2 | step3;                 // Combine results
    let step5 = step4 << 7;                    // Shift left by 7
    let step6 = rHeader & 0x70000;           // Extract more bits
    let step7 = step5 | step6;                 // Combine results
    let step8 = step7 << 3;                    // Shift left by 3
    let step9 = rHeader & 0xC00000;          // Extract more bits
    let step10 = step8 | step9;                // Combine results
    let result = step10 << 1;    // Final shift left by 1

    let finalValidationByte = (result >> 24) & 0xFF;
    let lookupValue = (result >> 14) << 2;

    console.log("extracted the transformedRawHeader", result.toString(16));
    console.log("extracted the finalValidationByte", finalValidationByte.toString(16));
    console.log("extracted the lookupValue", lookupValue);

    lookupValue = lookupIndexTable.readUInt16LE(0) << 2;

    console.log("writing a new lookupValue", lookupValue);

    const mask = ~(((1 << 14) - 1) << 14);  // This creates a mask with 0s in the bit positions we want to replace

    // Clear the bits and insert the new value
    result = (result & mask) | ((lookupValue >> 2) << 14);

    let reversedValue = result;

    // Undo the final left shift by 1
    reversedValue = reversedValue >> 1;

    // Extract the bits that came from rawHeader & 0xC00000
    let rawHeaderPart3 = reversedValue & 0xC00000;

    // Remove those bits from our working value
    let tempValue = reversedValue & ~0xC00000;

    // Undo the left shift by 3
    tempValue = tempValue >> 3;

    // Extract the bits that came from rawHeader & 0x70000
    let rawHeaderPart2 = tempValue & 0x70000;

    // Remove those bits from our working value
    tempValue = tempValue & ~0x70000;

    // Undo the left shift by 7
    tempValue = tempValue >> 7;

    // Extract the bits that came from rawHeader & 0x38
    let rawHeaderPart1 = tempValue & 0x38;

    // Remove those bits from our working value
    tempValue = tempValue & ~0x38;

    // Undo the first left shift by 1
    let packetDataPart = tempValue >> 1;

    // Reconstruct the original values
    let reconstructedPacketData4 = packetDataPart & 0xE0;
    let reconstructedRawHeader = rawHeaderPart1 | rawHeaderPart2 | rawHeaderPart3;

    let test = Buffer.alloc(5);
    test.writeUint32LE(reconstructedRawHeader);
    test.writeUint8(reconstructedPacketData4, 4);

    console.log("reconstructed the original rawHeader", test);

    rHeader = test.readUInt32LE(0);

    step1 = test[4] & 0xE0;          // Extract bits from packetData[4]
    step2 = step1 << 1;                    // Shift left by 1 (multiply by 2)
    step3 = rHeader & 0x38;              // Extract bits from rawHeader
    step4 = step2 | step3;                 // Combine results
    step5 = step4 << 7;                    // Shift left by 7
    step6 = rHeader & 0x70000;           // Extract more bits
    step7 = step5 | step6;                 // Combine results
    step8 = step7 << 3;                    // Shift left by 3
    step9 = rHeader & 0xC00000;          // Extract more bits
    step10 = step8 | step9;                // Combine results
    result = step10 << 1;    // Final shift left by 1

    finalValidationByte = (result >> 24) & 0xFF;
    lookupValue = (result >> 14) << 2;    

    console.log("extracted the transformedRawHeader again", result.toString(16));
    console.log("extracted the finalValidationByte again", finalValidationByte.toString(16));
    console.log("extracted the lookupValue again", lookupValue);
}

function injectHeader()
{
    let transformedRawHeader = 0x2BCF12C0;
    let finalValidationByte = (transformedRawHeader >> 24) & 0xFF;
    let lookupValue = transformedRawHeader >> 14;

    console.log(finalValidationByte.toString(16), lookupValue.toString(16));

    transformedRawHeader = (finalValidationByte << 24) | (lookupValue << 14);

    console.log(transformedRawHeader.toString(16));

    finalValidationByte = (transformedRawHeader >> 24) & 0xFF;
    lookupValue = transformedRawHeader >> 14;
    
    console.log(finalValidationByte.toString(16), lookupValue.toString(16));
}

function reconstructedPostXOR(lookupTables: number[][])
{
    let packetSize = 0xe24 & 0xFFF;

    // Start with clean values
    let packetData = Buffer.alloc(5, 0);

    // Handle bits 0-2 and 3-5 as before
    packetData[4] = ((packetSize & 0x7) << 2);
    let transformedHeader = (packetSize >> 3) & 0x7;
    
    // For bits 6+, we need to place them where maskedField can capture them
    const highBits = (packetSize >> 6) & 0x3F;  // Get bits 6-11
    
    // First 3 bits go to transformedHeader bits 13-15 (captured by & 0xe000)
    transformedHeader |= ((highBits & 0x7) << 13);
    
    // Next 3 bits go to transformedHeader bits 29-31 (captured by >> 13 & 0x70000)
    transformedHeader |= ((highBits >> 3) << 29);
    
    // Write to packet
    transformedHeader = transformedHeader >>> 0;

    let randomValue = 5//Math.random() * 8;
    let random = (((randomValue << 5) << 24) >>> 19) & 0xD001C00; // 0x9001C00 without 26-27
    random |= ((randomValue << 5) >> 8) & 0x3;

    transformedHeader &= ~0xd001c00;
    transformedHeader |= random & 0xd001c00;

    packetData.writeUInt32LE(transformedHeader >>> 0, 0);

    console.log(packetData);

    packetData[4] &= ~0x3;
    packetData[4] |= random & 0x3;

    console.log(packetData)

    let dtransformedHeader = packetData.readUInt32LE(0);
    let dmaskedField = dtransformedHeader >> 13 & 0x70000 | dtransformedHeader & 0xE000;
    let dsizeField = (((dmaskedField >> 5) | (packetData[4] & 0x1C)) >> 2) | ((dtransformedHeader & 7) << 3);

    let validationByte2 = (((packetData[4] & 3) << 8 | dtransformedHeader & 0xFFFFFC00) << 19) >> 24;
    let validationByte1 = validationByte2 | (dtransformedHeader >> 26) & 6;

    console.log("validation byte2", (validationByte2 >> 5).toString(16));
    console.log("validation byte1", validationByte1.toString(16));

    console.log(dtransformedHeader.toString(16), dmaskedField.toString(16), dsizeField.toString(16));

    let xorIndex = lookupIndexTable.readInt16LE(0) << 2;

    console.log("xorIndex", xorIndex);

    console.log("prexored buffer", dtransformedHeader.toString(16));

    for(let i = 0; i < 5; i++)
        packetData[i] ^= lookupTables[i][xorIndex];

    obfuscateFinalStep(packetData, 5, xorIndex);
    deobfuscatePacketHeader(lookupTables, packetData);
}

export function testThings(lookupTables: number[][])
{
    //reconstructHeader();
    reconstructedPostXOR(lookupTables);

    //deobfuscatePacketHeader(lookupTables, packetData);
}

function obfuscateFinalStep(xoredBuffer: Buffer<ArrayBuffer>, finalValidationByte: number, lookupValue: number)
{
    let rHeader = xoredBuffer.readUInt32LE(0);

    console.log("xored buffer", rHeader.toString(16));

    let step1 = xoredBuffer[4] & 0xE0;          // Extract bits from packetData[4]
    let step2 = step1 << 1;                    // Shift left by 1 (multiply by 2)
    let step3 = rHeader & 0x38;              // Extract bits from rawHeader
    let step4 = step2 | step3;                 // Combine results
    let step5 = step4 << 7;                    // Shift left by 7
    let step6 = rHeader & 0x70000;           // Extract more bits
    let step7 = step5 | step6;                 // Combine results
    let step8 = step7 << 3;                    // Shift left by 3
    let step9 = rHeader & 0xC00000;          // Extract more bits
    let step10 = step8 | step9;                // Combine results
    let result = step10 << 1;    // Final shift left by 1

    // result = transformedHeader

    // inject the XOR index
    const mask = ~(((1 << 14) - 1) << 14);  // This creates a mask with 0s in the bit positions we want to replace
    result = (result & mask) | ((lookupValue >> 2) << 14);

    // reconstruct the header with our new values
    let reversedValue = result;

    // Undo the final left shift by 1
    reversedValue = reversedValue >> 1;

    // Extract the bits that came from rawHeader & 0xC00000
    let rawHeaderPart3 = reversedValue & 0xC00000;

    // Remove those bits from our working value
    let tempValue = reversedValue & ~0xC00000;

    // Undo the left shift by 3
    tempValue = tempValue >> 3;

    // Extract the bits that came from rawHeader & 0x70000
    let rawHeaderPart2 = tempValue & 0x70000;

    // Remove those bits from our working value
    tempValue = tempValue & ~0x70000;

    // Undo the left shift by 7
    tempValue = tempValue >> 7;

    // Extract the bits that came from rawHeader & 0x38
    let rawHeaderPart1 = tempValue & 0x38;

    // Remove those bits from our working value
    tempValue = tempValue & ~0x38;

    // Undo the first left shift by 1
    let packetDataPart = tempValue >> 1;

    // Reconstruct the original values
    let reconstructedPacketData4 = packetDataPart & 0xE0;
    let reconstructedRawHeader = rawHeaderPart1 | rawHeaderPart2 | rawHeaderPart3;

    const bitPositions = [22, 23, 24, 28, 29, 30, 31];
    let mask2 = 0;
    for (const position of bitPositions) {
        mask2 |= (1 << position);
    }

    console.log("mask", mask2.toString(16))

    rHeader &= ~0xc70038;
    rHeader |= reconstructedRawHeader;
    rHeader = rHeader >>> 0;

    console.log((rHeader & 0xfe0000).toString(16))

    xoredBuffer.writeUInt32LE(rHeader, 0);
    xoredBuffer[4] &= ~0xE0;
    xoredBuffer[4] |= reconstructedPacketData4;

    console.log(xoredBuffer)
}

export function deobfuscatePacketHeader(lookupTables: number[][], packetData: Buffer<ArrayBuffer>)
{
    let rawHeader = packetData.readUInt32LE(0);
    let transformedRawHeader = ((((packetData[4] & 0xE0) * 2 | rawHeader & 0x38) << 7 | rawHeader & 0x70000) << 3 | rawHeader & 0xC00000) * 2;
    let finalValidationByte = (transformedRawHeader >> 24) & 0xFF;

    console.log("rawHeader", rawHeader.toString(16));
    console.log("transformedRawHeader", transformedRawHeader.toString(16));
    console.log("finalValidationByte", finalValidationByte.toString(16));

    let xorIndex = 0;

    console.log("First 4 bytes before XOR:", packetData.slice(0, 5));

    do
    {
        let lookupValue = lookupTables[xorIndex][(transformedRawHeader >> 14) * 4];

        console.log(
            `XOR Index: ${xorIndex}, Original Byte: ${packetData[xorIndex].toString(16)}, Lookup Value: ${lookupValue.toString(16)}, byteShift: ${(transformedRawHeader >> 14) * 4} | ${transformedRawHeader >> 14}`
        );

        packetData[xorIndex] ^= lookupValue;
        xorIndex++;
    } while (xorIndex < 5);

    console.log("First 4 bytes after XOR:", packetData.slice(0, 5));

    let transformedHeader = packetData.readUInt32LE(0);
    let maskedField = transformedHeader >> 13 & 0x70000 | transformedHeader & 0xE000;
    let sizeField = (((maskedField >> 5) | (packetData[4] & 0x1C)) >> 2) | ((transformedHeader & 7) << 3);

    console.log("transformedHeader", transformedHeader.toString(16));
    console.log("maskedField", maskedField.toString(16));
    console.log("sizeField", sizeField.toString(16));

    let decodedHeaderFields = Buffer.alloc(4); // 4-byte buffer
    decodedHeaderFields.writeUIntLE(((maskedField >> 15) | transformedRawHeader) & 0xFFFFFF, 1, 3); // Ensure only 3 bytes

    let validationByte2 = (((packetData[4] & 3) << 8 | transformedHeader & 0xFFFFFC00) << 19) >>> 24;
    let validationByte1 = validationByte2 | (transformedHeader >> 26) & 6;
    finalValidationByte = validationByte1 | finalValidationByte;

    decodedHeaderFields.writeUInt8(sizeField & 0xFF, 0); // First byte is the packet size

    console.log("decodedHeaderFields", decodedHeaderFields.readUInt32LE(0).toString(16));
    console.log("validationByte2", validationByte2.toString(16));
    console.log("validationByte1", validationByte1.toString(16));
    console.log("finalValidationByte", finalValidationByte.toString(16));

    let returnValue = sizeField & 0xFFFF;

    console.log("returnValue", returnValue.toString(16));

    if ((returnValue - 6) < 0xFFB) {
        let concatValue = (finalValidationByte << 24) | decodedHeaderFields.readUIntLE(1, 3);
        let validationCheck = ((validationByte1 >> 1) + ((concatValue >> 14) & 0xFF)) & 7;

        console.log("concatValue", concatValue.toString(16));
        console.log("validationCheck", validationCheck.toString(16));

        console.log("validation check shift", (validationByte2 >> 5).toString(16), validationCheck.toString(16))

        if ((validationByte2 >> 5) === validationCheck) {
            let newHeader = (transformedHeader >> 8 & 0x70000 | transformedHeader & 0x380000) >> 4 |
                (transformedHeader & 0x3C0) << 12 | decodedHeaderFields.readUInt32LE(0);

            console.log("newHeader", newHeader.toString(16));

            packetData.writeUInt32LE(newHeader, 0);
            packetData[4] = finalValidationByte;

            return returnValue;
        }
    }

    return 0;
}