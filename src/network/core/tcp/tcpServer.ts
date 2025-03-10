import * as net from 'net';
import TCPClient from './tcpClient';

export class TCPServerOptions {
    port: number;
    host: string;
    receiveBufferSize: number;
    noDelay: boolean;

    constructor(port: number, host: string, receiveBufferSize?: number, noDelay?: boolean) {
        this.port = port;
        this.host = host;
        this.receiveBufferSize = receiveBufferSize || 65536;
        this.noDelay = noDelay || false;
    }
}

interface ConnectionEntry {
    timestamp: number;
}

export class RateLimiting {
    connectionRateLimit: number;
    connectionTimeout: number;
    connectionEntryTimeout: number;

    constructor(connectionRateLimit?: number, connectionTimeout?: number, connectionEntryTimeout?: number) {
        this.connectionRateLimit = connectionRateLimit || 60;
        this.connectionTimeout = connectionTimeout || 30000;
        this.connectionEntryTimeout = connectionEntryTimeout || 30000;
    }
}

export class TCPServer {
    #options: TCPServerOptions;
    #server: net.Server;

    #rateLimiting?: RateLimiting;
    #connections: Map<string, ConnectionEntry[]>;

    #onClientConnectHandlers: ((client: TCPClient) => void)[] = [];
    #onClientDataHandlers: ((client: TCPClient, data: Buffer) => void)[] = [];
    #onClientClosedHandlers: ((client: TCPClient) => void)[] = [];
    #onClientErrorHandlers: ((client: TCPClient, err: Error) => void)[] = [];

    public constructor(options: TCPServerOptions, rateLimiting?: RateLimiting)
    {
        this.#options = options;
        this.#server = net.createServer({highWaterMark: options.receiveBufferSize, noDelay: options.noDelay});
        this.#rateLimiting = rateLimiting;
        this.#connections = new Map();
    }

    start()
    {
        this.#server.listen(this.#options.port, this.#options.host, () => {
            console.log(`TCP Server listening on ${this.#options.host}:${this.#options.port}`);
        });

        this.#server.on('connection', (socket: net.Socket) => {
            const client = new TCPClient(socket);
            const ip = client.remoteAddress;
            const now = Date.now();

            if (this.#connectionRateLimitExceeded(ip, now))
            {
                socket.destroy();
                return;
            }

            this.#addConnectionEntry(ip, now);

            if(this.#rateLimiting)
            {
                socket.setTimeout(this.#rateLimiting.connectionTimeout);
            }

            socket.on('data', (data: Buffer) => this.#emitClientData(client, data));
    
            socket.on('end', () => this.#emitClientClosed(client));
    
            socket.on('error', (err) => this.#emitClientError(client, err));
    
            socket.on('close', () => this.#emitClientClosed(client));

            this.#emitClientConnected(client);
        });

        this.#server.on('error', (err) => {
            console.error(`Server error: ${err}`);
        });
    }

    onClientConnect(handler: (client: TCPClient) => void): void {
        this.#onClientConnectHandlers.push(handler);
    }

    onClientData(handler: (client: TCPClient, data: Buffer) => void): void {
        this.#onClientDataHandlers.push(handler);
    }

    onClientClosed(handler: (client: TCPClient) => void): void {
        this.#onClientClosedHandlers.push(handler);
    }

    onClientError(handler: (client: TCPClient, err: Error) => void): void {
        this.#onClientErrorHandlers.push(handler);
    }
    
    #emitClientConnected(client: TCPClient): void {
        this.#onClientConnectHandlers.forEach((handler) => handler(client));
    }

    #emitClientData(client: TCPClient, data: Buffer): void {
        this.#onClientDataHandlers.forEach((handler) => handler(client, data));
    }

    #emitClientClosed(client: TCPClient): void {
        this.#onClientClosedHandlers.forEach((handler) => handler(client));
    }

    #emitClientError(client: TCPClient, err: Error): void {
        this.#onClientErrorHandlers.forEach((handler) => handler(client, err));
    }

    #addConnectionEntry(ip: string, timestamp: number) {
        if(this.#rateLimiting == undefined) return;

        const connections = this.#connections.get(ip);
        if (!connections) {
            this.#connections.set(ip, [{ timestamp }]);
        } else {
            connections.push({ timestamp });
        }
    }

    #connectionRateLimitExceeded(ip: string, now: number): boolean {
        if(this.#rateLimiting == undefined) return false;

        const connections = this.#connections.get(ip);
        if (!connections) return false;
    
        // Remove old connection entries
        connections.forEach((entry, index) => {
            if (now - entry.timestamp > this.#rateLimiting!.connectionEntryTimeout) {
                connections.splice(index, 1);
            }
        });
    
        const rate = connections.length / (now - connections[0].timestamp);
        return rate > this.#rateLimiting!.connectionRateLimit;
    }
}