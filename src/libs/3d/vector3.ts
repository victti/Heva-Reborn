export default class Vector3 
{
    x: number;
    y: number;
    z: number;

    static get zero() 
    {
        return new Vector3(0, 0, 0);
    }

    static get one() 
    {
        return new Vector3(1, 1, 1);
    }

    constructor(x: number, y: number, z: number) 
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}