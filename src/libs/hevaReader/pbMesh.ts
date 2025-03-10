import fs from 'fs';
import BufferReader from "../../network/core/bufferReader";
import Vector2 from '../3d/vector2';
import Vector3 from '../3d/vector3';
import Quaternion from '../3d/quaternion';
import ObjExporter from '../objExporter/main';
import Color from '../3d/color';

const textEncondig: BufferEncoding = "ascii";
const versions: {[key: string]: number} = {
    "20060901": 1
}

export class PBMeshReader
{
    static readFromPath(path: string)
    {
        let dataStr = fs.readFileSync(path);
        let buffer = Buffer.from(dataStr);

        let reader = new BufferReader(buffer);

        let isValidFile = reader.readBytes(6).equals(Buffer.from("pbMESH"));

        if (!isValidFile)
            throw new Error("Invalid PBM file");

        let version = reader.readBytes(8).toString(textEncondig);

        if(versions[version] == undefined)
            throw new Error(`Unsupported version: ${version}`);

        let magicBytes = reader.readBytes(3);

        let unknown1 = reader.readInt32(); // this barely ever changes

        let verticesLength = reader.readInt32();

        let unknown2 = reader.readInt32();

        let materialLength = reader.readInt32();

        if(materialLength > 1)
            throw new Error("Only one material per mesh is supported at the moment!");

        let materials = new Array<PBMaterial>(materialLength);
        for(let i = 0; i < materialLength; i++)
        {
            let color = new Color(reader.readByte(), reader.readByte(), reader.readByte(), reader.readByte());
            let unknown3 = reader.readInt32();
            let unknown4 = reader.readInt32();
            let unknown5 = reader.readInt32();
            let unknown6 = reader.readInt32();
            let unknown7 = reader.readByte();

            let materialId = reader.readInt32();
            let materialName = this.#readString(reader);
            let shaderName = this.#readString(reader);

            let texturesLength = reader.readInt32();
            let textures = new Array<PBTexture>(texturesLength);
            for(let i = 0; i < texturesLength; i++)
            {
                let textureId = reader.readInt32();
                let textureType = reader.readInt32();
                let textureName = this.#readString(reader);
                let texturePosition = new Vector2(reader.readSingle(), reader.readSingle());
                let textureScale = new Vector2(reader.readSingle(), reader.readSingle());

                textures[i] = new PBTexture(textureId, textureType, textureName, texturePosition, textureScale);
            }

            let unknown11 = new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());
            let unknown12 = new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());
            let unknown13 = new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());
            let unknown14 = new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());

            materials[i] = new PBMaterial(materialId, color, materialName, shaderName, textures.find(texture => texture.textureType == 1), textures.find(texture => texture.textureType == 6));
        }

        let unknownLength = reader.readInt16();
        for(let i = 0; i < unknownLength; i++)
            reader.readInt16();

        let vertexIds = new Array<number>(verticesLength);
        for(let i = 0; i < vertexIds.length; i++)
        {
            vertexIds[i] = reader.readInt16();
        }

        let vertices = new Array<Vector3>(verticesLength);
        let normals = new Array<Vector3>(verticesLength);
        let uvs = new Array<Vector2>(verticesLength * (unknown1 == 134 ? 1 : 4));

        for(let i = 0; i < vertices.length; i++)
        {
            vertices[i] = new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());
        }

        for(let i = 0; i < normals.length; i++)
        {
            normals[i] = new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());
        }

        for(let i = 0; i < uvs.length; i++)
        {
            uvs[i] = new Vector2(reader.readSingle(), reader.readSingle());
        }

        let endMeshStr = this.#readString(reader);

        if(endMeshStr.localeCompare("EndMesh") != 0)
            throw new Error("Invalid PBM file");

        return new PBMesh(version, materials, vertexIds, vertices, normals, uvs);
    }

    static #readString(reader: BufferReader)
    {
        let length = 0;

        while(!reader.peekBytes(length).includes(0))
            length++;

        return reader.readBytes(length).toString(textEncondig);
    }
}

export class PBMesh
{
    version: string;
    materials: PBMaterial[];
    verticesIds: number[];
    vertices: Vector3[];
    normals: Vector3[];
    uvs: Vector2[];
    #uvsSplitCount: number;

    constructor(version: string, materials: PBMaterial[], verticesIds: number[], vertices: Vector3[], normals: Vector3[], uvs: Vector2[])
    {
        this.version = version;
        this.materials = materials;
        this.verticesIds = verticesIds;
        this.vertices = vertices;
        this.normals = normals;
        this.uvs = uvs;
        this.#uvsSplitCount = this.uvs.length / this.vertices.length;
    }

    exportToObj(flipUVs: boolean = true, uvIndex?: number): string
    {
        const uvIndexToUse = uvIndex == undefined ? this.#uvsSplitCount - 1 : uvIndex;
        const uvsToUse = this.uvs.slice(uvIndexToUse * this.vertices.length, (uvIndexToUse + 1) * this.vertices.length);
        const processedUVs = flipUVs ? uvsToUse.map(uv => new Vector2(uv.x, uv.y * -1)) : uvsToUse;
        return ObjExporter.toObj(this.vertices, this.normals, processedUVs);
    }
}

export class PBMaterial
{
    materialId: number;
    color: Color;
    name: string;
    shader: string;
    albedoTexture?: PBTexture;
    normalTexture?: PBTexture;

    constructor(materialId: number, color: Color, name: string, shader: string, albedoTexture?: PBTexture, normalTexture?: PBTexture)
    {
        this.materialId = materialId;
        this.color = color;
        this.name = name;
        this.shader = shader;
        this.albedoTexture = albedoTexture;
        this.normalTexture = normalTexture;
    }
}

export class PBTexture
{
    id: number;
    textureType: number;
    name: string;
    position: Vector2;
    size: Vector2;

    constructor(id: number, textureType: number, name: string, position: Vector2, size: Vector2)
    {
        this.id = id;
        this.textureType = textureType;
        this.name = name;
        this.position = position;
        this.size = size;
    }
}