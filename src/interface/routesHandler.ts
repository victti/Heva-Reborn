import { Router } from 'express';

import rootRoute from './routes/root';

import { type IncomingMessage } from 'http';

export function htmlRoutesHandler(): Router
{
    const router = Router();

    router.use('/', rootRoute);

    return router;
}