import fs from 'fs';

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
    //let mesh = PBMeshReader.readFromPath("./src/res/decompiled/pbm/m_warrior_up_rare_30.pbm");
    //let obj = mesh.exportToObj(true);
    //fs.writeFileSync("./test.obj", obj);

    // let xtbs = fs.readdirSync("./src/res/decompiled/xtb");

    // xtbs = ["str_message.xtb"]

    // for(let xtb of xtbs)
    // {
    //     let xtbFile = xtbReader.readFromPath(`./src/res/decompiled/xtb/${xtb}`); // "./src/res/decompiled/xtb/heva_armor.xtb"

    //     for(let i = 0; i < xtbFile.columns.length; i++)
    //     {
    //         console.log(xtbFile.columns[i])
    //     }
    
    //     for(let r = 0; r < xtbFile.rows.length; r++)
    //     {
    //         let rowFound = false;

    //         for(let c = 0; c < xtbFile.columns.length; c++)
    //         {
    //             xtbFile.rows[r].data[c] = xtbFile.rows[r].data[c].replaceAll('\x00', "");
    
    //             if(xtbFile.rows[r].data[c].toLowerCase().includes("STRID_CHAR_CANT_MOVE".toLowerCase()) || xtbFile.rows[r].data[c].toLowerCase().includes("m_warrior_up_rare_30".toLowerCase()) || xtbFile.rows[r].data[c].toLowerCase().includes("BODY_403".toLowerCase()))
    //             {
    //                 rowFound = true;
    //             }
    //         }

    //         if(rowFound)
    //             console.log(xtbFile.rows[r]);
    
    //         //if(r > -1 && r < 20)
    //         //   console.log(xtbFile.rows[r])
    //     }
    // }

    //xtbReader.readFromPath("./src/res/decompiled/xtb/heva_zone_new.xtb")
    //console.log(xtbReader.readFromPath("./src/res/decompiled/xtb/job_list.xtb"))
    //xtbReader.readFromPath("./src/res/decompiled/xtb/dungeon_belonging.xtb")
    //console.log(xtbReader.readFromPath("./src/res/decompiled/xtb/file_body.xtb").rows)

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