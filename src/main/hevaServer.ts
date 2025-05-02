import ItemsController from "../controllers/itemsController";
import NetworkController from "../controllers/networkController";
import { readTable2, readTables } from "../network/packetUtils";
import httpServer from "./httpServer";

export default class HevaServer
{
    static #instance: HevaServer;

    #devHtpp: httpServer;

    #itemsController: ItemsController;
    #networkController: NetworkController;

    #lookupTables: number[][];
    #validationTable: number[];

    static get lookupTables() { return HevaServer.#instance.#lookupTables; }
    static get validationTable() { return HevaServer.#instance.#validationTable; }

    constructor()
    {
        HevaServer.#instance = this;

        this.#devHtpp = new httpServer();

        this.#lookupTables = [];
        this.#validationTable = [];
        
        this.#itemsController = new ItemsController();
        this.#networkController = new NetworkController(this);
    }

    async start()
    {
        this.#lookupTables = await readTables();
        this.#validationTable = await readTable2();

        this.#devHtpp.start();
        
        await this.#itemsController.start();
        this.#networkController.start();
    }
}