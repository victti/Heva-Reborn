import * as env from '../env';

import { Express } from 'express';
import express from 'express'

import { htmlRoutesHandler } from '../interface/routesHandler';
import type { IncomingMessage, Server, ServerResponse } from 'http';

export default class httpServer
{
    #app: Express;
    #port: number;

    #httpServer?: Server<typeof IncomingMessage, typeof ServerResponse>;

    constructor(port: number = 3000)
    {
        this.#app = express();
        this.#port = port;

        this.#app.disable('x-powered-by');
        this.#app.use(express.json({ limit: '50mb' }));

        this.#app.use((req, res, next) => {
            console.log(req.method, req.url);
            next();
        })

        this.#app.use('/', htmlRoutesHandler());
    }

    start()
    {
        this.#httpServer = this.#app.listen(this.#port, () => console.log(`Debug http server running on port ${this.#port}`));
    }

    /**
     * Attaches the given listener to the given event on the internal HTTP server.
     * @param event the event to listen for
     * @param listener the listener function
     * @returns the internal HTTP server
     */
    on(event: string, listener: (...args: any[]) => void): Server<typeof IncomingMessage, typeof ServerResponse> | undefined
    {
        return this.#httpServer?.on(event, listener);
    }
}