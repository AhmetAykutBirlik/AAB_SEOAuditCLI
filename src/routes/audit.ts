import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyTurnstile, checkSSRF, incrementAudits, decrementAudits } from '../lib/security';
import { Crawler } from '../lib/crawler';
import { sendTelegramReport } from '../lib/telegram';
import { getMessage } from '../lib/i18n';
import { logAudit } from '../lib/logger';
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

function getHealthLevel(score: number, lang: string): string {
    if (score < 60) return getMessage(lang, 'health_critical');
    if (score < 80) return getMessage(lang, 'health_needs_optimization');
    return getMessage(lang, 'health_high_potential');
}

export async function auditRoutes(fastify: FastifyInstance) {

    fastify.post('/audit', {
        config: {
            rateLimit: {
                max: 5, // Reduced for weak server
                timeWindow: '10 minutes'
            }
        }
    }, async (req, reply) => {
        try {
            const body = AuditSchema.parse(req.body);
            const ip = req.ip;

            console.log(`[Audit Request] URL: ${body.url}, IP: ${ip}, Lang: ${body.lang}`);

            // 1. Concurrency Check (Protect Server Load)
            if (!incrementAudits()) {
                return reply.status(503).send({
                    success: false,
                    message: getMessage(body.lang, 'rate_limited')
                });
            }

            try {
                // 2. Verify Turnstile
                await verifyTurnstile(body.turnstileToken, ip, body.lang);

                // 3. SSRF Check & Get Safe IP
                await checkSSRF(body.url, body.lang);

                // 4. Start Quick Audit
                const crawler = new Crawler({
                    maxDepth: 1,
                    maxPages: 12, // Increased from 8 to 12
                    concurrency: 3, // Increased from 2 to 3
                    timeoutMs: 12000, // Increased from 9s to 12s
                    maxHtmlSize: 3000000, // Increased from 2MB to 3MB
                });

                const results = await crawler.start(body.url);

                const totalScore = Math.round(results.reduce((acc: number, r: any) => acc + r.score, 0) / (results.length || 1));
                const totalErrors = results.reduce((acc: number, r: any) => acc + r.issues.filter((i: any) => i.type === 'error').length, 0);
                const totalWarnings = results.reduce((acc: number, r: any) => acc + r.issues.filter((i: any) => i.type === 'warning').length, 0);
                const totalDuration = results.reduce((a: number, b: any) => a + b.durationMs, 0);
                const site = new URL(body.url).hostname;
                const healthLevel = getHealthLevel(totalScore, body.lang);

                logAudit({ site, score: totalScore, duration: totalDuration, ip });

                return {
                    success: true,
                    site,
                    score: totalScore,
                    healthLevel,
                    summary: {
                        errors: totalErrors,
                        warnings: totalWarnings,
                        info: results.reduce((acc: number, r: any) => acc + r.issues.filter((i: any) => i.type === 'info').length, 0)
                    },
                    pagesAudited: results.length,
                    durationMs: totalDuration,
                    preview: {
                        topIssues: results.flatMap((r: any) => r.issues).filter((i: any) => i.type === 'error').slice(0, 5)
                    },
                    report: results
                };
            } finally {
                decrementAudits();
            }

        } catch (err: any) {
            req.log.error(err);
            if (err instanceof z.ZodError) {
                return reply.status(400).send({ success: false, message: 'Invalid input', errors: err.issues });
            }
            return reply.status(err.status || 400).send({ success: false, message: err.message || 'Error' });
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

    fastify.get('/locales/:lang', async (req) => {
        const { lang } = req.params as { lang: string };
        const { locales } = require('../lib/i18n');
        return locales[lang] || locales['en'];
    });
}
