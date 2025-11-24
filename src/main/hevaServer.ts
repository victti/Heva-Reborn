import ItemsController from "../controllers/itemsController";
import NetworkController from "../controllers/networkController";
import GameBoard from "../controllers/obfuscation/GameBoard";
import { readTable2 } from "../network/packetUtils";
import WinDivertProxy from "../network/windivertProxy";
import httpServer from "./httpServer";

export default class HevaServer
{
    static #instance: HevaServer;

    #devHtpp: httpServer;

    #itemsController: ItemsController;
    #networkController: NetworkController;

    #lookupTables: number[][];
    #validationTable: Buffer;
    #crcTable: number[];

    #windivert?: WinDivertProxy;

    static get lookupTables() { return HevaServer.#instance.#lookupTables; }
    static get validationTable() { return HevaServer.#instance.#validationTable; }    
    static get crcTable() { return HevaServer.#instance.#crcTable; }

    constructor()
    {
        HevaServer.#instance = this;

        this.#devHtpp = new httpServer();

        let gameBoard = new GameBoard();
        gameBoard.initializeGameBoard(0xabcdef12); // default seed for the initial connection

        this.#lookupTables = gameBoard.getRows();
        this.#validationTable = Buffer.from(gameBoard.getFinalArray());
        this.#crcTable = [];
        
        this.#itemsController = new ItemsController();
        this.#networkController = new NetworkController(this);

        if(false)
            this.#windivert = new WinDivertProxy("209.222.11.178", 50000, "192.168.18.6");
    }

    async start()
    {
        this.#crcTable = await readTable2();

        this.#devHtpp.start();
        
        await this.#itemsController.start();
        this.#networkController.start();

        if(this.#windivert)
            await this.#windivert.start();
    }
}