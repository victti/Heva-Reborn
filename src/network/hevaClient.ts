import HevaServer from "../main/hevaServer";
import TCPClient from "./core/tcp/tcpClient";

export default class HevaClient
{
    #server: HevaServer;
    #client: TCPClient;

    constructor(server: HevaServer, client: TCPClient)
    {
        this.#server = server;
        this.#client = client;
    }

    async handleData(data: Buffer)
    {
        console.log("received data")
        console.log(data);

        let buffer = Buffer.from([140, 246, 135, 76, 154, 28, 171]);
        console.log("sending", buffer);
        this.#client.sendData(buffer);
    }
}