import fs from 'fs';
import BufferReader from "../../network/core/bufferReader";
import Vector3 from '../3d/vector3';
import Quaternion from '../3d/quaternion';
import iconv from 'iconv-lite';

const textEncondig: BufferEncoding = "ascii";

export class xtbReader
{
    static readFromPath(path: string)
    {
        let dataStr = fs.readFileSync(path);
        let buffer = Buffer.from(dataStr);

        let reader = new BufferReader(buffer);

        let isValidFile = reader.readBytes(4).equals(Buffer.from("xTB1")); // 0-3 - local_1c / pcVar9

        if (!isValidFile)
            throw new Error("Invalid XTB file");

        let unknown1 = reader.readInt32(); // 4-7
        let rowCount = reader.readInt32(); // 8-11
        let columnCount = reader.readInt32(); // 12-15

        reader.seek(4, "relative");
        reader.seek((2 * columnCount) + 2, "relative");

        // 20 - sub_655DD9 - readBytes (buffer, destination, length)
        // 32 - sub_655E90 - moveCursor (buffer, position, mode) | 0 - absolut | 1 - relative | 2 - end
        // 36 - sub_6561C1 - buffer

        let unknown2 = reader.readUInt16();

        if(columnCount > 1)
        {
            for(let i = 0; i < columnCount - 1; i++)
            {
                let unknown2 = reader.readUInt16();
                //console.log(unknown2)
            }
        }

        if(columnCount > 0)
        {
            for(let i = 0; i < columnCount; i++)
            {
                let columnName = this.#readString(reader);

                console.log(i, "column -", columnName)
            }
        }

        let unknown3 = reader.readInt16();
        reader.seek(unknown3, "relative");

        if(rowCount - 1 > 1)
        {
            for(let i = 1; i < rowCount - 1; i++)
            {
                let comment = this.#readString(reader);
    
                console.log("row comment -", i - 1, "|", comment);
            }
        }

        rowCount -= 2;
        columnCount -= 1;

        for(let r = 0; r < rowCount; r++)
        {
            for(let i = 0; i < columnCount; i++)
            {
                let data = this.#readString(reader);
        
                //console.log("row -", r, "| column -", i, "|", data);
            }
        }

        //return new xtbFile(columnNames, rows);
    }

    static #readString(reader: BufferReader)
    {
        let length = reader.readInt16();

        return iconv.decode(reader.readBytes(length), "euc-kr");
    }

    static #readStringNull(reader: BufferReader)
    {
        let length = 0;

        while(!reader.peekBytes(length).includes(0))
            length++;

        return reader.readBytes(length).toString(textEncondig);
    }
}

export class xtbFile
{
    columns: string[];
    rows: string[][];

    constructor(columns: string[], rows: string[][])
    {
        this.columns = columns;
        this.rows = rows;
    }
}