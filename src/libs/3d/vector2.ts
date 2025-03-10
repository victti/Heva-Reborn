export default class Vector2
{
    x: number;
    y: number;

    static get zero() 
    {
        return new Vector2(0, 0);
    }

    static get one() 
    {
        return new Vector2(1, 1);
    }

    constructor(x: number, y: number) 
    {
        this.x = x;
        this.y = y;
    }
}