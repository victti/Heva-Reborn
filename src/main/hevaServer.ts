import NetworkController from "../controllers/networkController";

export default class HevaServer
{
    #networkController: NetworkController;

    constructor()
    {
        this.#networkController = new NetworkController(this);
    }

    async start()
    {
        this.#networkController.start();
    }
}