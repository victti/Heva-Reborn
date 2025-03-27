import { PBAnimationReader } from '../libs/hevaReader/pbAnimation';
import { PBSkeletonReader } from '../libs/hevaReader/pbSkeleton';
import { PBMeshReader } from '../libs/hevaReader/pbMesh';

import HevaServer from './hevaServer';
import { My3DReader } from '../libs/hevaReader/my3d/my3d';
import { xtbReader } from '../libs/hevaReader/xtbReader';
import HevaProtocolWriter from '../network/hevaProtocolWriter';
import { deobfuscateServerPacket, deobfuscateServerPacketHeader } from '../network/packetDebug';

let server: HevaServer | null = null;

async function EntryPoint()
{
    //console.log(JSON.stringify(PBSkeletonReader.readFromPath("./src/res/decompile/pbs/test.pbs")));
    //console.log(PBSkeletonReader.readFromPath("./src/res/decompile/test/bg_stone_stand01/bg_stand01.pbs").points);
    //console.log(PBAnimationReader.readFromPath("./src/res/decompile/pba/fovtest.pba"));
    //let mesh = PBMeshReader.readFromPath("./src/res/decompile/pbm/sum_n30a_shoes.pbm");
    //let obj = mesh.exportToObj(true);
    //fs.writeFileSync("./test.obj", obj);

    //xtbReader.readFromPath("./src/res/decompiled/xtb/clone_tribe.xtb")
    //xtbReader.readFromPath("./src/res/decompiled/xtb/heva_zone_new.xtb")
    //xtbReader.readFromPath("./src/res/decompiled/xtb/file_face_skin.xtb")
    //xtbReader.readFromPath("./src/res/decompiled/xtb/dungeon_belonging.xtb")
    //xtbReader.readFromPath("./src/res/decompiled/xtb/file_body.xtb")

    //console.log("a")

    //My3DReader.readFromPath("./src/res/my3d/t_chico.my3d");
    //while(true);
    //return;

    if (server === null)
    {
        server = new HevaServer();
        await server.start();
    }
}

async function test()
{

}

EntryPoint();