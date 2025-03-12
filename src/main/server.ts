import { PBAnimationReader } from '../libs/hevaReader/pbAnimation';
import { PBSkeletonReader } from '../libs/hevaReader/pbSkeleton';
import { PBMeshReader } from '../libs/hevaReader/pbMesh';

import HevaServer from './hevaServer';
import { My3DReader } from '../libs/hevaReader/my3d/my3d';
import { xtbReader } from '../libs/hevaReader/xtbReader';

import { testThings } from './debug';
import { deobfuscatePacket, deobfuscatePacketHeader, obfuscatePacket, encryptPacketInternal, readTables, readTable2 } from '../network/packetUtils';

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

    //The server is not responding. Please try again later

    //await test();

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
    //let someTable = await readTable3();

    //testThings(lookupTables);

    //let packet = Buffer.from([140, 246, 135, 76, 154, 28, 171, 0x00, 0x00, 0x00]);

    let packet = Buffer.from([0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01, 0x00]);

    //console.log("original", packet)

    packet = obfuscatePacket(lookupTables, validationTable, packet, 0);
    console.log("obfuscated part 1", packet);

    //console.log();

    deobfuscatePacketHeader(lookupTables, packet);
    console.log("deobfuscated part 1", packet);

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

    //console.log(packet);
}

EntryPoint();