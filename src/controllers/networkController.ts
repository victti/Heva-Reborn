import * as env from '../env';
import HevaServer from '../main/hevaServer';
import type TCPClient from "../network/core/tcp/tcpClient";
import { TCPServer, TCPServerOptions } from "../network/core/tcp/tcpServer";
import HevaClient from '../network/hevaClient';

export default class NetworkController
{
    #server: HevaServer;
    #tcpServer: TCPServer;

    #clients: Map<TCPClient, HevaClient>;

    #id: number;

    constructor(server: HevaServer)
    {
        this.#server = server;
        this.#clients = new Map();
        this.#id = 1;

        this.#tcpServer = new TCPServer(new TCPServerOptions(env.PORT, '0.0.0.0', 65535, false));
        this.#tcpServer.onClientConnect((client: TCPClient) => this.#OnClientConnect(client));
        this.#tcpServer.onClientData((client: TCPClient, data: Buffer) => this.#OnClientData(client, data));
        this.#tcpServer.onClientClosed((client: TCPClient) => this.#OnClientClosed(client));
        this.#tcpServer.onClientError((client: TCPClient, err: Error) => this.#OnClientError(client, err));
    }

    public start()
    {
        this.#tcpServer.start();
    }

    #OnClientConnect(client: TCPClient)
    {
        let hevaClient = new HevaClient(this.#server, client, this.#id++);

        this.#clients.set(client, hevaClient);

        //LoginProtocol.getProtocol()?.sendConnectionOK(bgoClient);

        console.log(`A new connection was received. Total clients: ${this.#clients.size}`);
    }

    #OnClientData(client: TCPClient, data: Buffer)
    {
        let hevaClient = this.#clients.get(client);
        
        hevaClient?.handleData(data);
    }

    #OnClientClosed(client: TCPClient)
    {
        // TODO: handle the client disconnection, we should keep the BGOClient alive for 60 seconds if closed badly (something to fix on the TCPClient class)
        // handle it on a new class and when connecting check if the client its connecting is still alive
        let closedClient = this.#clients.get(client);

        this.#clients.delete(client);

        console.log(`A connection was closed. Total clients: ${this.#clients.size}`);
    }

    #OnClientError(client: TCPClient, err: Error)
    {
        let closedClient = this.#clients.get(client);

        this.#clients.delete(client);

        console.log(`A connection was crashed. Total clients: ${this.#clients.size}`);
        console.error(err);
    }
}