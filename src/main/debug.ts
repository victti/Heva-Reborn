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