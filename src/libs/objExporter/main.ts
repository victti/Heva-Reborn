import Vector2 from "../3d/vector2";
import Vector3 from "../3d/vector3";

export default class ObjExporter
{
    static toObj(vertices: Vector3[], normals: Vector3[], uvs: Vector2[])
    {
        let output = new Array<string>();

        output.push(`# Made for Heva Reader`)
        output.push(``);

        for(let vertex of vertices)
            output.push(`v ${vertex.x} ${vertex.y} ${vertex.z}`);

        for(let normal of normals)
            output.push(`vn ${normal.x} ${normal.y} ${normal.z}`);

        for(let uv of uvs)
            output.push(`vt ${uv.x} ${uv.y}`);

        for(let i = 0; i < vertices.length; i += 3)
        {
            output.push(`f ${i + 1}/${i + 1}/${i + 1} ${i + 2}/${i + 2}/${i + 2} ${i + 3}/${i + 3}/${i + 3}`);
        }

        return output.join("\n");
    }
}