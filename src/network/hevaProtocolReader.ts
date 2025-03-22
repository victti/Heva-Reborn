import Quaternion from "../libs/3d/quaternion";
import Vector2 from "../libs/3d/vector2";
import Vector3 from "../libs/3d/vector3";
import BufferReader from "./core/bufferReader";

export default class HevaProtocolReader extends BufferReader
{
    constructor(buffer: Buffer);
    constructor(buffer: number[]);

    constructor(buffer: Buffer | number[])
    {
        super(Buffer.from(buffer));
        this.readUInt16(); // read length
    }

    readVector2()
    {
        return new Vector2(this.readSingle(), this.readSingle());
    }

    readVector3()
    {
        return new Vector3(this.readSingle(), this.readSingle(), this.readSingle());
    }

    readQuaternion()
    {
        return new Quaternion(this.readSingle(), this.readSingle(), this.readSingle(), this.readSingle());
    }
}