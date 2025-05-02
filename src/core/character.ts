import { ItemType } from "../enum/itemType";
import HevaProtocolWriter from "../network/hevaProtocolWriter";
import Item from "../type/item";

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
    #job: number;

    #items: {[type: number]: Item};

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
    get job(): number { return this.#job; }

    constructor(id: number, name: string, gender: number, hairType: number, hairColor: number, faceType: number, top: number, bottom: number, level: number, jobId: number)
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
        this.#job = jobId;

        this.#items = [];

        this.equipItem(ItemType.Helmet, 0);
        this.equipItem(ItemType.Eye, 0);
        this.equipItem(ItemType.Unknown, 0);
        this.equipItem(ItemType.Body, top);
        this.equipItem(ItemType.Pants, bottom);
        this.equipItem(ItemType.Hand, 0);
        this.equipItem(ItemType.Shoes, 0);
        this.equipItem(ItemType.Back, 0);
        this.equipItem(ItemType.RWeapon, 2);
        this.equipItem(ItemType.LWeapon, 0);
        this.equipItem(ItemType.Face, faceType);
        this.equipItem(ItemType.Hair, hairType + hairColor);
    }

    equipItem(itemType: ItemType, itemId: number)
    {
        this.#items[itemType] = new Item(itemId);
    }

    writeCharacterLightData(w: HevaProtocolWriter)
    {
        w.writeUInt32(this.id);
        w.writeByte(this.gender);
        w.writeUInt16(this.level);
        w.writeUInt16(this.job);
        w.writeByte(0);
        w.writeByte(0);
        w.writeByte(0);
        w.writeByte(0);
        w.writeUInt16(15); // map id
        w.writeByte(0);

        for(let itemType in this.#items)
        {
            w.write(this.#items[itemType]);
        }

        w.writeStringNT(this.name);
    }
}