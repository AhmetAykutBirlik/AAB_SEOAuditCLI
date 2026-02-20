import { FastifyInstance } from 'fastify';
import { z } from 'zod';
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
    email: z.string().email(),
    lang: z.enum(['tr', 'en']).default('en'),
    site: z.string(),
    score: z.number(),
    errors: z.number(),
    warnings: z.number(),
    pagesAudited: z.number(),
    durationMs: z.number(),
    healthLevel: z.string()
});

const DISPOSABLE_DOMAINS = [
    'mailinator.com', '10minutemail.com', 'temp-mail.org', 'yopmail.com',
    'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'yopmail.net', 'temp-mail.io'
];

function isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return DISPOSABLE_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
}

function getHealthLevel(score: number): string {
    if (score < 60) return "Critical";
    if (score < 80) return "Needs Optimization";
    return "High Potential";
}

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

    fastify.post('/audit', {
        config: {
            rateLimit: {
                max: 10,
                timeWindow: '10 minutes'
            }
        }
    }, async (req, reply) => {
        try {
            const body = AuditSchema.parse(req.body);
            const ip = req.ip;

            // 1. Verify Turnstile
            await verifyTurnstile(body.turnstileToken, ip, body.lang);

            // 2. SSRF Check & Get Safe IP
            await checkSSRF(body.url, body.lang);

            // 3. Start Quick Audit (v4.1 Defaults)
            const crawler = new Crawler({
                maxDepth: 1,      // Requirement: maxDepth 1
                maxPages: 8,      // Requirement: maxPages 8
                concurrency: 2,   // Requirement: concurrency 2
                timeoutMs: 9000,  // Requirement: timeoutPerPageMs 9000
                maxHtmlSize: 2000000, // Requirement: maxHtmlBytes 2000000
            });

            const results = await crawler.start(body.url);

            const totalScore = Math.round(results.reduce((acc, r) => acc + r.score, 0) / (results.length || 1));
            const totalErrors = results.reduce((acc, r) => acc + r.issues.filter(i => i.type === 'error').length, 0);
            const totalWarnings = results.reduce((acc, r) => acc + r.issues.filter(i => i.type === 'warning').length, 0);
            const totalDuration = results.reduce((a, b) => a + b.durationMs, 0);
            const site = new URL(body.url).hostname;

            logAudit({ site, score: totalScore, duration: totalDuration, ip });

            return {
                success: true,
                site,
                score: totalScore,
                healthLevel: getHealthLevel(totalScore),
                summary: {
                    errors: totalErrors,
                    warnings: totalWarnings,
                    info: results.reduce((acc, r) => acc + r.issues.filter(i => i.type === 'info').length, 0)
                },
                pagesAudited: results.length,
                durationMs: totalDuration,
                preview: {
                    topIssues: results.flatMap(r => r.issues).filter(i => i.type === 'error').slice(0, 5)
                },
                report: results // Full report sent to client, client handles gate
            };

        } catch (err: any) {
            req.log.error(err);
            if (err instanceof z.ZodError) {
                return reply.status(400).send({ success: false, message: 'Invalid input', errors: err.issues });
            }
            return reply.status(err.status || 400).send({ success: false, message: err.message || 'Internal Server Error' });
        }
    });

    fastify.post('/lead', {
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '10 minutes'
            }
        }
    }, async (req, reply) => {
        try {
            const body = LeadSchema.parse(req.body);

            // Email validation v4.1
            const cleanEmail = body.email.trim();
            if (cleanEmail.length > 100) throw new Error('Email too long');
            if (isDisposableEmail(cleanEmail)) throw new Error('Please use a permanent email address');

            // Send Telegram Notification (All data provided by client)
            sendTelegramReport({
                domain: body.site,
                pagesAudited: body.pagesAudited,
                avgScore: body.score,
                durationMs: body.durationMs,
                errors: body.errors,
                warnings: body.warnings,
                clientIp: req.ip,
                email: cleanEmail,
                healthLevel: body.healthLevel
            }).catch(e => fastify.log.error(e));

            logAudit({ site: body.site, email: cleanEmail, action: 'lead_captured' });

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
        return { status: 'ok', version: '4.1.0', timestamp: new Date().toISOString() };
    });
}

