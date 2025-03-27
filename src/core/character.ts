export default class Character
{
    #id: number;
    #name: string;
    #gender: number;
    #hairType: number;
    #hairColor: number;
    #faceType: number;
    #top: number;
    #bottom: number;

    #level: number;
    #class: number;

    get id(): number { return this.#id; }
    get name(): string { return this.#name; }
    get gender(): number { return this.#gender; }

    get hair(): number { return this.#hairType + this.#hairColor; }
    get hairType(): number { return this.#hairType; }
    get hairColor(): number { return this.#hairColor; }

    get faceType(): number { return this.#faceType; }
    get top(): number { return this.#top; }
    get bottom(): number { return this.#bottom; }
    get level(): number { return this.#level; }
    get class(): number { return this.#class; }

    constructor(id: number, name: string, gender: number, hairType: number, hairColor: number, faceType: number, top: number, bottom: number, level: number, classId: number)
    {
        this.#id = id;
        this.#name = name;
        this.#gender = gender;
        this.#hairType = hairType;
        this.#hairColor = hairColor;
        this.#faceType = faceType;
        this.#top = top;
        this.#bottom = bottom;
        this.#level = level;
        this.#class = classId;
    }
}