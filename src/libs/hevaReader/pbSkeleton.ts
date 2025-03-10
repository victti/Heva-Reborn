import fs from 'fs';
import BufferReader from "../../network/core/bufferReader";
import Vector3 from '../3d/vector3';
import Quaternion from '../3d/quaternion';

const textEncondig: BufferEncoding = "ascii";
const versions: {[key: string]: number} = {
    "20060831": 1,
    "20081119": 2
}

export class PBSkeletonReader
{
    static readFromPath(path: string): PBSkeleton
    {
        let dataStr = fs.readFileSync(path);
        let buffer = Buffer.from(dataStr);

        let reader = new BufferReader(buffer);

        let isValidFile = reader.readBytes(6).equals(Buffer.from("pbSKEL"));

        if (!isValidFile)
            throw new Error("Invalid PBS file");

        let version = reader.readBytes(8).toString(textEncondig);

        if(versions[version] == undefined)
            throw new Error(`Unsupported version: ${version}`);

        let magicBytes = reader.readBytes(3);

        let num = reader.readInt32();

        let bones = new Array<PBBone>(num);
        for(let i = 0; i < num; i++)
        {
            let parentId = reader.readInt32();

            let boneName = this.#readString(reader).replace("\0", "");

            let position = new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());

            let rotation = new Quaternion(reader.readSingle(), reader.readSingle(), reader.readSingle(), reader.readSingle());

            let scale = Vector3.one;

            if(versions[version] > 1)
            {
                scale = new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());
            }

            bones[i] = new PBBone(i, boneName, position, rotation, parentId, scale);
        }

        num = reader.readInt32();

        let points = new Array<PBPPoint>(num);
        for(let i = 0; i < num; i++)
        {
            let pointName = this.#readString(reader).replace("\0", "");

            let boneId = reader.readInt32();
            let position = new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());
            let rotation = new Quaternion(reader.readSingle(), reader.readSingle(), reader.readSingle(), reader.readSingle());

            points[i] = new PBPPoint(pointName, boneId, position, rotation);
        }

        for(let i = bones.length - 1; i > 0; i--)
        {
            bones.find(bone => bone.id == bones[i].parentId)?.children.push(bones[i]);

            bones.pop();
        }

        return new PBSkeleton(version, bones, points);
    }

    static #readString(reader: BufferReader)
    {
        let length = 0;

        while(!reader.peekBytes(length).includes(0))
            length++;

        return reader.readBytes(length).toString(textEncondig);
    }
}

export class PBSkeleton
{
    version: string;
    bones: PBBone[];
    points: PBPPoint[];

    constructor(version: string, bones?: PBBone[], points?: PBPPoint[])
    {
        this.version = version;
        this.bones = bones || [];
        this.points = points || [];
    }
}

export class PBBone
{
    id: number;
    parentId: number;
    name: string;
    position: Vector3;
    rotation: Quaternion;
    scale: Vector3;
    children: PBBone[];

    constructor(id: number, name: string, position: Vector3, rotation: Quaternion, parentId: number, scale?: Vector3)
    {
        this.id = id;
        this.parentId = parentId;
        this.name = name;
        this.position = position;
        this.rotation = rotation;
        this.parentId = parentId;
        this.scale = scale || Vector3.one;
        this.children = [];
    }
}

export class PBPPoint
{
    name: string;
    boneId: number;
    position: Vector3;
    rotation: Quaternion;

    constructor(name: string, boneId: number, position: Vector3, rotation: Quaternion)
    {
        this.name = name;
        this.boneId = boneId;
        this.position = position;
        this.rotation = rotation;
    }
}