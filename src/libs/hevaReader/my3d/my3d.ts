import fs from 'fs';
import BufferReader from "../../../network/core/bufferReader";
import Vector2 from '../../3d/vector2';
import Vector3 from '../../3d/vector3';
import ObjExporter from '../../objExporter/main';
import Color from '../../3d/color';

const sceneHeader = [0x00, 0x10];

const materialListHeader = [0x00, 0x20];
const materialHeader = [0x00, 0x21];

const textureNameID = [0x01, 0x22];

const meshListHeader = [0x00, 0x30];
const meshHeader = [0x00, 0x31];

const verticesListHeader = [0x01, 0x31];
const facesListHeader = [0x02, 0x31];
const tverticesHeader = [0x03, 0x31];
const tfacesHeader = [0x04, 0x31];

const fileEndID = [0xFF, 0xFF];

export class My3DReader 
{
    static readFromPath(path: string)
    {
        let dataStr = fs.readFileSync(path);
        let buffer = Buffer.from(dataStr);

        let reader = new BufferReader(buffer);

        let isValidFile = reader.readBytes(4).equals(Buffer.from("D3YM"));

        if (!isValidFile)
            throw new Error("Invalid MY3D file");

        let workPath = path.substring(0, path.lastIndexOf("/"));

        let version = reader.readUInt16();

        reader.readInt32();

        let isValidScene = reader.readBytes(2).equals(Buffer.from(sceneHeader));

        if(!isValidScene)
            throw new Error("Invalid MY3D scene");

        let BackgrColor = new Color(reader.readInt32(), reader.readInt32(), reader.readInt32(), reader.readInt32());
        let AmbientColor = new Color(reader.readInt32(), reader.readInt32(), reader.readInt32(), reader.readInt32());
        let materialCount = reader.readInt32();
        let meshCount = reader.readInt32();

        let isValidMaterialList = reader.readBytes(2).equals(Buffer.from(materialListHeader));

        if(!isValidMaterialList)
            throw new Error("Invalid MY3D material list");

        for(let m = 0; m < materialCount; m++)
        {
            let isValidMaterial = reader.readBytes(2).equals(Buffer.from(materialHeader));

            if(!isValidMaterial)
                throw new Error("Invalid MY3D material");

            let name = reader.readBytes(256).toString("utf-8").replace("\0", "");
            let index = reader.readUInt32();
            let ambientColor = new Color(reader.readInt32(), reader.readInt32(), reader.readInt32(), reader.readInt32());
            let diffuseColor = new Color(reader.readInt32(), reader.readInt32(), reader.readInt32(), reader.readInt32());
            let emissiveColor = new Color(reader.readInt32(), reader.readInt32(), reader.readInt32(), reader.readInt32());
            let specularColor = new Color(reader.readInt32(), reader.readInt32(), reader.readInt32(), reader.readInt32());
            let shininess = reader.readSingle();
            let transparency = reader.readSingle();
            let textureCount = reader.readUInt32();

            reader.readByte();

            let gotLightMap = false;
            let gotMainMap = false;
            for(let t = 0; t < textureCount; t++)
            {
                let id = reader.readBytes(2);

                let name: string;
                if(id.equals(Buffer.from(textureNameID)))
                {
                    name = reader.readBytes(256).toString("utf-8").replace("\0", "");
                } else {
                    name = "";

                    gotLightMap = true;
                }

                let split = name.split(".");
                let isSubString = split[split.length - 1].endsWith("LightingMap") || split[split.length - 1].endsWith("l_m");

                if(isSubString && !gotLightMap)
                {
                    let texture2 = workPath + "/lightmaps/" + name;

                    gotLightMap = true;
                    // materialType = EMT_LIGHTMAP_M2
                } else if(!gotLightMap && gotMainMap)
                {
                    let texture2 = workPath + "/map/" + name;

                    // materialType = EMT_REFLECTION_2_LAYER
                } else if(!gotLightMap && !gotMainMap)
                {
                    let texture1 = workPath + "/" + name;

                    gotMainMap = true;
                    // materialType = EMT_SOLID
                } else {
                    // materialType = EMT_LIGHTMAP_M2
                }

                reader.readInt32();
            }
        }

        let isValidMeshList = reader.readBytes(2).equals(Buffer.from(meshListHeader));
       
        if(!isValidMeshList)
            throw new Error("Invalid MY3D mesh list");

        let objects = new Array<Object3D>();

        for(let meshId = 0; meshId < meshCount; meshId++)
        {
            if(!reader.peekBytes(2).equals(Buffer.from(meshHeader)))
                break;

            let id = reader.readBytes(2);

            if(!id.equals(Buffer.from(meshHeader)))
                throw new Error("Invalid MY3D mesh");

            let name = reader.readBytes(256).toString("utf-8").replace("\0", "");
            let materialIndex = reader.readUInt32();
            let tchannelCount = reader.readUInt32();

            let vertsNum = 0;
            let facesNum = 0;

            let vertices = new Array<Vertex>();
            let faces = new Array<Face>();
            let tvertex1 = new Array<TVertex>();
            let tvertex2 = new Array<TVertex>();
            let tface1 = new Array<Face>();
            let tface2 = new Array<Face>();

            reader.readInt16();

            let isValidVerticesList = reader.readBytes(2).equals(Buffer.from(verticesListHeader));
       
            if(!isValidVerticesList)
                throw new Error("Invalid MY3D vertices");

            vertsNum = reader.readInt32();

            for(let v = 0; v < vertsNum; v++)
            {
                let position = new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());
                let color = new Color(reader.readInt32(), reader.readInt32(), reader.readInt32(), reader.readInt32());
                let normal = new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());

                vertices.push(new Vertex(position, color, normal));
            }

            let isValidFacesList = reader.readBytes(2).equals(Buffer.from(facesListHeader));
       
            if(!isValidFacesList)
                throw new Error("Invalid MY3D faces");

            facesNum = reader.readInt32();

            for(let f = 0; f < facesNum; f++)
            {
                let a = reader.readInt32();
                let b = reader.readInt32();
                let c = reader.readInt32();

                faces.push(new Face(a, b, c));
            }

            for(let tex = 0; tex < tchannelCount; tex++)
            {
                let tVertsNum = 0;
                let tFacesNum = 0;

                let isValidTVerticesList = reader.readBytes(2).equals(Buffer.from(tverticesHeader));

                if(!isValidTVerticesList)
                    throw new Error("Invalid MY3D tvertices");

                tVertsNum = reader.readInt32();

                if(tex == 0)
                {
                    tvertex1 = new Array<TVertex>(tVertsNum);

                    for(let v = 0; v < tVertsNum; v++)
                        tvertex1.push(new TVertex(new Vector2(reader.readSingle(), reader.readSingle())));
                } else if (tex == 1)
                {
                    tvertex2 = new Array<TVertex>(tVertsNum);

                    for(let v = 0; v < tVertsNum; v++)
                        tvertex2.push(new TVertex(new Vector2(reader.readSingle(), reader.readSingle())));
                } else
                {
                    for(let v = 0; v < tVertsNum; v++)
                    {
                        reader.readSingle();
                        reader.readSingle();
                    }
                }

                let isValidTFacesList = reader.readBytes(2).equals(Buffer.from(tfacesHeader));

                if(!isValidTFacesList)
                    throw new Error("Invalid MY3D tfaces");

                tFacesNum = reader.readInt32();

                if(tex == 0)
                {
                    tface1 = new Array<Face>(tFacesNum);

                    for(let f = 0; f < tFacesNum; f++)
                        tface1.push(new Face(reader.readInt32(), reader.readInt32(), reader.readInt32()));
                } else if (tex == 1)
                {
                    tface2 = new Array<Face>(tFacesNum);

                    for(let f = 0; f < tFacesNum; f++)
                        tface2.push(new Face(reader.readInt32(), reader.readInt32(), reader.readInt32()));
                } else
                {
                    for(let v = 0; v < tFacesNum; v++)
                    {
                        reader.readInt32();
                        reader.readInt32();
                        reader.readInt32();
                    }
                }
            }

            objects.push(new Object3D(name, new Mesh(vertices, faces, tvertex1, tvertex2, tface1, tface2)));
        }

        let isValidFileEnd = reader.readBytes(2).equals(Buffer.from(fileEndID));

        console.log(reader.peekBytes(10))

        if(!isValidFileEnd)
            throw new Error("Invalid MY3D file end");

        console.log("completely read the file");

        let obj = new Scene(objects).toObj();

        fs.writeFileSync("test.obj", obj);

        while(true){}
    }
}

export class Scene
{
    objects: Array<Object3D>;

    constructor(objects: Array<Object3D>)
    {
        this.objects = objects;
    }

    toObj()
    {
        let output = new Array<string>();

        let vCount = 0;
        for(let i = 0; i < this.objects.length; i++)
        {
            output.push(this.objects[i].toObj(vCount));
            vCount += this.objects[i].mesh.vertices.length;
        }

        return output.join("\n");
    }
}

export class Object3D
{
    name: string;
    mesh: Mesh;

    constructor(name: string, mesh: Mesh)
    {
        this.name = name;
        this.mesh = mesh;
    }

    toObj(nOffset: number = 0)
    {
        let output = new Array<string>();

        output.push(`o ${this.name}`);
        output.push(this.mesh.toObj(nOffset));

        return output.join("\n");
    }
}

export class Mesh
{
    vertices: Array<Vertex>;
    faces: Array<Face>;
    tvertices1: Array<TVertex>;
    tvertices2: Array<TVertex>;
    tfaces1: Array<Face>;
    tfaces2: Array<Face>;

    constructor(vertices: Array<Vertex>, faces: Array<Face>, tvertices1: Array<TVertex>, tvertices2: Array<TVertex>, tfaces1: Array<Face>, tfaces2: Array<Face>)
    {
        this.vertices = vertices;
        this.faces = faces;
        this.tvertices1 = tvertices1;
        this.tvertices2 = tvertices2;
        this.tfaces1 = tfaces1;
        this.tfaces2 = tfaces2;
    }

    toObj(nOffset: number = 0)
    {
        let output = new Array<string>();

        for(let vertex of this.vertices)
            output.push(`v ${vertex.position.x} ${vertex.position.y} ${vertex.position.z}`);

        for(let normal of this.vertices)
            output.push(`vn ${normal.normal.x} ${normal.normal.y} ${normal.normal.z}`);

        for(let face of this.faces)
            output.push(`f ${face.a + 1 + nOffset}/${face.a + 1 + nOffset}/${face.a + 1 + nOffset} ${face.b + 1 + nOffset}/${face.b + 1 + nOffset}/${face.b + 1 + nOffset} ${face.c + 1 + nOffset}/${face.c + 1 + nOffset}/${face.c + 1 + nOffset}`);

        return output.join("\n");
    }
}

export class Vertex
{
    position: Vector3;
    color: Color;
    normal: Vector3;

    constructor(position: Vector3, color: Color, normal: Vector3)
    {
        this.position = position;
        this.color = color;
        this.normal = normal;
    }
}

export class Face
{
    a: number;
    b: number;
    c: number;

    constructor(a: number, b: number, c: number)
    {
        this.a = a;
        this.b = b;
        this.c = c;
    }
}

export class TVertex
{
    position: Vector2;

    constructor(position: Vector2)
    {
        this.position = position;
    }
}