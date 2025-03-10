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

        let isValidFile = reader.readBytes(4).equals(Buffer.from("xTB1"));

        if (!isValidFile)
            throw new Error("Invalid XTB file");

        let unknown = reader.readInt32();
        let unknown2 = reader.readInt32();
        let columns = reader.readInt32();
        let unknown3 = reader.readInt32();
        let unknown4 = reader.readInt16();

        for(let i = 0; i < columns; i++)
        {
            let unknown5 = reader.readInt16();

        }

        let unknown6 = reader.readInt16();

        let breakAtEndFlag = false;
        for(let i = 0; i < columns; i++)
        {
            if(breakAtEndFlag && i == columns - 1)
                break;

            let unknown7 = reader.readInt16();

            if(i == 0 && unknown7 != 0)
                breakAtEndFlag = true;
        }

        let columnNames = [];

        for(let i = 0; i < columns; i++)
        {
            let columnName = this.#readString(reader);

            if(columnName == "")
                break;

            columnNames.push(columnName);
        }

        let rows: string[][] = [];

        let i = 0;
        while(reader.canRead(2))
        {
            let columnsRow = [];
            for(let j = 0; j < columnNames.length; j++)
            {
                let columnValue = this.#readString(reader);

                if(columnValue == "" && j == 0)
                    break;

                columnsRow.push(columnValue);
            }
            console.log(columnsRow)            
            rows.push(columnsRow);
            i++;
        }

        return new xtbFile(columnNames, rows);
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