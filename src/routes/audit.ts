import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { verifyTurnstile, checkSSRF } from '../lib/security';
import { Crawler } from '../lib/crawler';
import { sendTelegramReport } from '../lib/telegram';
import { getMessage } from '../lib/i18n';
import fs from 'fs';
import path from 'path';

const AuditSchema = z.object({
    url: z.string().url(),
    turnstileToken: z.string(),
    lang: z.enum(['tr', 'en']).default('en'),
});

const LeadSchema = z.object({
    requestId: z.string().uuid(),
    email: z.string().email(),
    lang: z.enum(['tr', 'en']).default('en'),
});

interface AuditSession {
    site: string;
    score: number;
    errors: number;
    warnings: number;
    pagesAudited: number;
    durationMs: number;
    timestamp: number;
    ip: string;
}

// Temporary in-memory store for sessions to handle /lead call (In production, use Redis/DB)
const sessionStore = new Map<string, AuditSession>();

function logAudit(data: any) {
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(logDir, `audits-${date}.jsonl`);

    const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        ...data,
        email: data.email ? '***masked***' : undefined
    }) + '\n';

    fs.appendFileSync(logFile, logEntry);
}

export async function auditRoutes(fastify: FastifyInstance) {

    fastify.post('/audit', async (req, reply) => {
        const requestId = uuidv4();
        try {
            const body = AuditSchema.parse(req.body);
            const ip = req.ip;

            // 1. Verify Turnstile
            await verifyTurnstile(body.turnstileToken, ip, body.lang);

            // 2. SSRF Check & Get Safe IP
            const safeIp = await checkSSRF(body.url, body.lang);

            // 3. Start Audit
            const crawler = new Crawler({
                maxDepth: 2,
                maxPages: 50,
                concurrency: 3,
                timeoutMs: 15000,
                maxHtmlSize: 5 * 1024 * 1024, // 5MB
            });

            const results = await crawler.start(body.url);

            const totalScore = Math.round(results.reduce((acc, r) => acc + r.score, 0) / (results.length || 1));
            const totalErrors = results.reduce((acc, r) => acc + r.issues.filter(i => i.type === 'error').length, 0);
            const totalWarnings = results.reduce((acc, r) => acc + r.issues.filter(i => i.type === 'warning').length, 0);

            const session: AuditSession = {
                site: new URL(body.url).hostname,
                score: totalScore,
                errors: totalErrors,
                warnings: totalWarnings,
                pagesAudited: results.length,
                durationMs: results.reduce((a, b) => a + b.durationMs, 0),
                timestamp: Date.now(),
                ip
            };

            sessionStore.set(requestId, session);

            // Cleanup old sessions (basic)
            if (sessionStore.size > 1000) {
                const firstKey = sessionStore.keys().next().value;
                if (firstKey) sessionStore.delete(firstKey);
            }

            logAudit({ requestId, site: session.site, score: totalScore, duration: session.durationMs, ip });

            return {
                success: true,
                requestId,
                site: session.site,
                score: totalScore,
                summary: {
                    errors: totalErrors,
                    warnings: totalWarnings,
                    info: results.reduce((acc, r) => acc + r.issues.filter(i => i.type === 'info').length, 0)
                },
                pagesAudited: results.length,
                durationMs: session.durationMs,
                preview: {
                    topIssues: results.flatMap(r => r.issues).filter(i => i.type === 'error').slice(0, 5)
                },
                report: results // Full report included but frontend shows preview first
            };

        } catch (err: any) {
            req.log.error(err);
            if (err instanceof z.ZodError) {
                return reply.status(400).send({ success: false, message: 'Invalid input', errors: err.issues });
            }
            return reply.status(err.status || 400).send({ success: false, message: err.message || 'Internal Server Error' });
        }
    });

    fastify.post('/lead', async (req, reply) => {
        try {
            const body = LeadSchema.parse(req.body);
            const session = sessionStore.get(body.requestId);

            if (!session) {
                return reply.status(404).send({ success: false, message: 'Session expired or not found' });
            }

            // Send Telegram Notification
            sendTelegramReport({
                domain: session.site,
                pagesAudited: session.pagesAudited,
                avgScore: session.score,
                durationMs: session.durationMs,
                errors: session.errors,
                warnings: session.warnings,
                clientIp: session.ip,
                email: body.email
            }).catch(e => fastify.log.error(e));

            logAudit({ requestId: body.requestId, email: body.email, action: 'lead_captured' });

            return {
                success: true,
                message: getMessage(body.lang, 'lead_saved')
            };

        } catch (err: any) {
            req.log.error(err);
            return reply.status(400).send({ success: false, message: err.message });
        }
    });

    fastify.get('/health', async () => {
        return { status: 'ok', version: '3.0.0', timestamp: new Date().toISOString() };
    });
}

