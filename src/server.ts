import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const server = Fastify({
    logger: {
        level: 'info',
        transport: {
            target: 'pino-pretty'
        }
    },
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

import { auditRoutes } from './routes/audit';

// Register plugins
server.register(cors, {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
});

server.register(require('@fastify/static'), {
    root: path.join(__dirname, '../public'),
    prefix: '/',
});

// Configure Rate Limiting (Default policy)
server.register(rateLimit);

// Register routes
server.register(async (instance) => {
    await auditRoutes(instance);
}, { prefix: '/api' });

const start = async () => {
    try {
        await server.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`🚀 AAB SEO Audit API v4.0.0 listening on port ${PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();

