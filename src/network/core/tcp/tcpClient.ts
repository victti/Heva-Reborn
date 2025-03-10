import * as net from 'net';

export default class TCPClient {
    #socket: net.Socket;

    constructor(socket: net.Socket)
    {
        this.#socket = socket;
    }

    get remoteAddress(): string
    {
        return this.#socket.remoteAddress || "";
    }

    isPrivateConnection()
    {
        return TCPClient.#isPrivateIP(this.remoteAddress);
    }

    sendData(data: Buffer)
    {
        return this.#socket.write(data);
    }

    closeConnection()
    {
        this.#socket.end();
    }

    static #isPrivateIP(ip: string) {
        var parts = ip.split('.');
        return parts[0] == '127' || parts[0] == '10' || 
           (parts[0] == '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) || 
           (parts[0] == '192' && parts[1] == '168');
    }
}