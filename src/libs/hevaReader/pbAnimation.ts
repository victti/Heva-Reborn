import fs from 'fs';
import BufferReader from "../../network/core/bufferReader";
import Vector3 from '../3d/vector3';
import Quaternion from '../3d/quaternion';

const textEncondig: BufferEncoding = "ascii";
const versions: {[key: string]: number} = {
    "070131": 1
}

export class PBAnimationReader
{
    static readFromPath(path: string)
    {
        let dataStr = fs.readFileSync(path);
        let buffer = Buffer.from(dataStr);

        let reader = new BufferReader(buffer);

        let signature = reader.readBytes(7);
        let sceneSig = signature.equals(Buffer.from("pbSANIM"));
        let boneSig = signature.equals(Buffer.from("pbBANIM"));
        let mSig = signature.equals(Buffer.from("pbMANIM"));
        let cameraSig = signature.equals(Buffer.from("pbCANIM"));

        let isValidFile = sceneSig || boneSig || mSig || cameraSig;

        if (!isValidFile)
            throw new Error("Invalid PBA file");

        let version = reader.readBytes(6).toString(textEncondig);

        if(versions[version] == undefined)
            throw new Error(`Unsupported version: ${version}`);

        let magicBytes = reader.readBytes(3);

        let framerate = reader.readInt32();
        let frameCount = reader.readInt32();

        let bonesLength = reader.readInt32();

        let bones = [];
        for(let i = 0; i < bonesLength; i++)
        {
            bones[i] = {
                dataType: reader.readInt32(),
                id: reader.readInt32()
            };
        }

        console.log(bones)

        let animBones = bones.reduce(function (p, c)
        {
            if (!p.some(function (el) { return el.boneId == c.id; }))
                p.push(new PBAnimationBone(c.id, []));

            return p;
        }, new Array<PBAnimationBone>());

        for(let b = 0; b < bonesLength; b++)
        {
            let boneId = bones[b].id;

            let animBone = animBones.find(bone => bone.boneId == boneId);

            if(!animBone)
                throw new Error(`Bone ${boneId} not found`);

            for(let i = 0; i < frameCount; i++)
            {
                if(!animBone.frames[i])
                {
                    animBone.frames.push(new PBAnimationFrame());
                }
                console.log("Reading data type", bones[b].dataType)
                switch(bones[b].dataType)
                {
                    case 2:
                        animBone.frames[i].position = new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());
                        break;
                    case 4:
                        animBone.frames[i].rotation = new Quaternion(reader.readSingle(), reader.readSingle(), reader.readSingle(), reader.readSingle());
                        break;
                    case 16:
                        reader.readSingle();
                        reader.readSingle();
                        break;
                    case 32:
                        reader.readSingle();
                        break;
                    case 1024:
                        reader.readSingle();
                        reader.readSingle();
                        reader.readSingle();
                        break;
                    default:
                        throw new Error(`Unsupported data type: ${bones[b].dataType}`);
                }
            }
        }

        return new PBAnimation(version, framerate, frameCount, animBones);
    }
}

export class PBAnimation
{
    version: string;
    framerate: number;
    totalFrames: number;
    bones: PBAnimationBone[];

    constructor(version: string, framerate: number, totalFrames: number, bones: PBAnimationBone[])
    {
        this.version = version;
        this.framerate = framerate;
        this.totalFrames = totalFrames;
        this.bones = bones;
    }
}

export class PBAnimationBone
{
    boneId: number;
    frames: PBAnimationFrame[];

    constructor(boneId: number, frames: PBAnimationFrame[])
    {
        this.boneId = boneId;
        this.frames = frames;
    }
}

export class PBAnimationFrame
{
    position: Vector3;
    rotation: Quaternion;

    constructor(position?: Vector3, rotation?: Quaternion)
    {
        this.position = position || Vector3.zero;
        this.rotation = rotation || Quaternion.identity;
    }
}