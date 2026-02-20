import { Telegraf } from 'telegraf';

interface TelegramReportData {
    domain: string;
    pagesAudited: number;
    avgScore: number;
    durationMs: number;
    errors: number;
    warnings: number;
    clientIp: string;
    email?: string;
}

export async function sendTelegramReport(data: TelegramReportData): Promise<void> {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token || !chatId) {
        console.warn('Telegram credentials missing.');
        return;
    }

    try {
        const bot = new Telegraf(token);

        const text = `
🚀 *New SEO Audit Lead*

🌐 *Site:* \`${data.domain}\`
📧 *Email:* ${data.email ? `\`${data.email}\`` : '_Not provided_'}
📊 *Score:* ${data.avgScore}/100
❌ *Errors:* ${data.errors}
⚠ *Warnings:* ${data.warnings}
📄 *Pages:* ${data.pagesAudited}
⏱ *Duration:* ${data.durationMs} ms

#WebFine #SEOAudit
`.trim();

        await bot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('Failed to send Telegram message:', err);
    }
}

