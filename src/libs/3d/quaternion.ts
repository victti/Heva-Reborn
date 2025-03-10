export default class Quaternion 
{
    x: number;
    y: number;
    z: number;
    w: number;

    static get identity() 
    {
        return new Quaternion(0, 0, 0, 1);
    }
    
    constructor(x: number, y: number, z: number, w: number = 0) 
    {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}