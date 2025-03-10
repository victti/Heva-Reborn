import { PBAnimationReader } from '../libs/hevaReader/pbAnimation';
import { PBSkeletonReader } from '../libs/hevaReader/pbSkeleton';
import { PBMeshReader } from '../libs/hevaReader/pbMesh';
const fs = require('fs');
const readline = require('readline');

import HevaServer from './hevaServer';
import { My3DReader } from '../libs/hevaReader/my3d/my3d';
import { xtbReader } from '../libs/hevaReader/xtbReader';

import { deobfuscatePacket, deobfuscatePacketHeader, obfuscatePacket, obfuscatePacketHeader, encryptPacketInternal } from '../network/packetUtils';

let server: HevaServer | null = null;

async function EntryPoint()
{
    //console.log(JSON.stringify(PBSkeletonReader.readFromPath("./src/res/decompile/pbs/test.pbs")));
    //console.log(PBSkeletonReader.readFromPath("./src/res/decompile/test/bg_stone_stand01/bg_stand01.pbs").points);
    //console.log(PBAnimationReader.readFromPath("./src/res/decompile/pba/fovtest.pba"));
    //let mesh = PBMeshReader.readFromPath("./src/res/decompile/pbm/sum_n30a_shoes.pbm");
    //let obj = mesh.exportToObj(true);
    //fs.writeFileSync("./test.obj", obj);

    //xtbReader.readFromPath("./src/res/xtb/str_quest.xtb")

    //My3DReader.readFromPath("./src/res/my3d/t_chico.my3d");
    //while(true);
    //return;

    await test();

    if (server === null)
    {
        server = new HevaServer();
        await server.start();
    }
}

async function test()
{
    let lookupTables = await readTables();
    let validationTable = await readTable2();
    let someTable = await readTable3();

    //let packet = Buffer.from([140, 246, 135, 76, 154, 28, 171, 0x00, 0x00, 0x00]);

    let packet = Buffer.from([0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01, 0x00]);

    console.log("original", packet)

    packet = obfuscatePacket(lookupTables, validationTable, packet, 0);
    console.log("obfuscated part 1", packet);

    //console.log();

    //deobfuscatePacketHeader(lookupTables, packet);
    //console.log("deobfuscated part 1", packet);

    deobfuscatePacket(lookupTables, validationTable, packet);
    console.log("deobfuscated part 2", packet);

    //deobfuscatePacketHeader(lookupTables, packet);
    //console.log("deobfuscated part 1", packet);

    //console.log();

    //packet = obfuscatePacketHeader(lookupTables, packet);
    //console.log("obfuscated part 2", packet);

    //console.log();

    //let length = deobfuscatePacketHeader(lookupTables, packet);
    //console.log("deobfuscated part 1", packet);

    //console.log();

    //processPacketInternal(lookupTables, validationTable, packet);
    //console.log("deobfuscated part 2", packet)

    console.log(packet);
}

async function readTable2()
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

async function readTable3()
{
    const fileStream = fs.createReadStream('./src/res/something.txt');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let table = [];

    for await (const line of rl) {
        table.push(Number.parseInt(line, 16));
    }

    return Buffer.from(table);
}

async function readTables()
{
    const fileStream = fs.createReadStream('./src/res/lookupTables.txt');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let tables = [];

    let tableIndex = 0;
    for await (const line of rl) {
        if(line == "")
            continue;

        if(line.startsWith("Table"))
        {
            let split = line.split(" ");
            tableIndex = Number(split[1].substring(0, split[1].length - 1));

            tables.push(new Array<number>());
        }

        if(line.startsWith("  Index"))
        {
            let split = line.split(" ");

            let lineIndex = Number(split[3].substring(0, split[3].length - 1));
            let hex = split[8].substring(2, split[8].length);

            let hex1 = hex.substring(0, 2);
            let hex2 = hex.substring(2, 4);
            let hex3 = hex.substring(4, 6);
            let hex4 = hex.substring(6, 8);

            tables[tableIndex].push(Number.parseInt(hex4, 16));
            tables[tableIndex].push(Number.parseInt(hex3, 16));
            tables[tableIndex].push(Number.parseInt(hex2, 16));
            tables[tableIndex].push(Number.parseInt(hex1, 16));
        }
    }

    return tables;
}

EntryPoint();