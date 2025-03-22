import NetworkController from "../controllers/networkController";
import { readTable2, readTables } from "../network/packetUtils";

export default class HevaServer
{
    static instance: HevaServer;
    #networkController: NetworkController;

    #lookupTables: number[][];
    #validationTable: number[];

    static get lookupTables() { return HevaServer.instance.#lookupTables; }
    static get validationTable() { return HevaServer.instance.#validationTable; }

    constructor()
    {
        HevaServer.instance = this;

        this.#lookupTables = [];
        this.#validationTable = [];
        
        this.#networkController = new NetworkController(this);
    }

    async start()
    {
        this.#lookupTables = await readTables();
        this.#validationTable = await readTable2();
        
        this.#networkController.start();
    }
}