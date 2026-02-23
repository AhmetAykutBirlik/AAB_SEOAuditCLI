import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(__dirname, '../../logs');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const RETENTION_DAYS = 30;

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

export function logAudit(data: any) {
    const shouldLogToDisk = process.env.LOG_TO_DISK === 'true';
    const isDebug = process.env.DEBUG_LOGS === 'true';

    if (isDebug) {
        console.info(`[Audit] ${data.domain || data.site} - Score: ${data.score}`);
    }

    if (!shouldLogToDisk) return;

    try {
        const date = new Date().toISOString().split('T')[0];
        const baseLogFile = path.join(LOG_DIR, `audits-${date}.jsonl`);

        // Check if we need to rotate within the same day due to size
        let logFile = baseLogFile;
        let counter = 0;

        while (fs.existsSync(logFile) && fs.statSync(logFile).size > MAX_LOG_SIZE) {
            counter++;
            logFile = path.join(LOG_DIR, `audits-${date}-${counter}.jsonl`);
        }

        const logEntry = JSON.stringify({
            timestamp: new Date().toISOString(),
            ...data,
            email: data.email ? '***masked***' : undefined,
            ip: data.ip ? maskIp(data.ip) : undefined
        }) + '\n';

        fs.appendFileSync(logFile, logEntry);
    } catch (err) {
        console.error('Logging to disk failed:', err);
    }
}

function maskIp(ip: string): string {
    if (ip.includes('.')) {
        return ip.split('.').slice(0, 3).join('.') + '.0';
    }
    if (ip.includes(':')) {
        return ip.split(':').slice(0, 3).join(':') + '::';
    }
    return '***';
}

export function cleanupOldLogs() {
    try {
        const files = fs.readdirSync(LOG_DIR);
        const now = Date.now();
        const maxAge = RETENTION_DAYS * 24 * 60 * 60 * 1000;

        files.forEach(file => {
            const filePath = path.join(LOG_DIR, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old log file: ${file}`);
            }
        });
    } catch (err) {
        console.error('Log cleanup failed:', err);
    }
}
