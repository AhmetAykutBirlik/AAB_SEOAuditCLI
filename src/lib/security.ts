import axios from 'axios';
import dns from 'node:dns/promises';
import { getMessage } from './i18n';
import ipaddr from 'ipaddr.js';

// SSRF Protection: Block these ranges
const BLOCKED_RANGES = [
    '0.0.0.0/8',
    '10.0.0.0/8',
    '100.64.0.0/10',
    '127.0.0.0/8',
    '169.254.0.0/16',
    '172.16.0.0/12',
    '192.0.0.0/24',
    '192.0.2.0/24',
    '192.88.99.0/24',
    '192.168.0.0/16',
    '198.18.0.0/15',
    '198.51.100.0/24',
    '203.0.113.0/24',
    '224.0.0.0/4',
    '240.0.0.0/4',
    '255.255.255.255/32',
];

const BLOCKED_RANGES_V6 = [
    '::/128',
    '::1/128',
    'fc00::/7',
    'fe80::/10',
];

function isIpPrivate(ipString: string): boolean {
    try {
        const addr = ipaddr.parse(ipString);
        const range = addr.kind();

        if (range === 'ipv4') {
            const v4Addr = addr as ipaddr.IPv4;
            // Check against CIDR blocks
            for (const cidr of BLOCKED_RANGES) {
                if (v4Addr.match(ipaddr.parseCIDR(cidr))) return true;
            }
        } else if (range === 'ipv6') {
            const v6Addr = addr as ipaddr.IPv6;
            for (const cidr of BLOCKED_RANGES_V6) {
                if (v6Addr.match(ipaddr.parseCIDR(cidr))) return true;
            }
        }
        return false;
    } catch (e) {
        return true; // If we can't parse it, treat as unsafe
    }
}

export async function checkSSRF(url: string, lang: string = 'en'): Promise<string> {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch (e) {
        throw new Error(getMessage(lang, 'invalid_url'));
    }

    // 1. Protocol check
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error(getMessage(lang, 'invalid_url'));
    }

    // 2. Port check (Allow only 80 and 443)
    const port = parsed.port || (parsed.protocol === 'http:' ? '80' : '443');
    if (port !== '80' && port !== '443') {
        throw new Error(getMessage(lang, 'blocked_ssrf'));
    }

    // 3. Static hostname check
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        throw new Error(getMessage(lang, 'blocked_ssrf'));
    }

    // 4. DNS Resolution & IP check (DNS Rebinding protection)
    try {
        const lookup = await dns.lookup(parsed.hostname, { all: true });
        for (const entry of lookup) {
            if (isIpPrivate(entry.address)) {
                throw new Error(getMessage(lang, 'blocked_ssrf'));
            }
        }
        // Return first valid IP to be used for the actual request to prevent DNS rebinding
        return lookup[0].address;
    } catch (e: any) {
        if (e.message === getMessage(lang, 'blocked_ssrf')) throw e;
        throw new Error(getMessage(lang, 'blocked_ssrf'));
    }
}

// Turnstile Verification
export async function verifyTurnstile(token: string, ip: string, lang: string = 'en'): Promise<void> {
    if (token === 'mock-token') {
        console.warn('⚠️ Using Mock Turnstile Token');
        return;
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        console.warn('TURNSTILE_SECRET_KEY not set. Falling back to success (UNSAFE).');
        return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append('secret', secret);
        formData.append('response', token);
        formData.append('remoteip', ip);

        const res = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', formData, {
            timeout: 5000
        });

        if (!res.data.success) {
            throw new Error(getMessage(lang, 'turnstile_failed'));
        }
    } catch (err) {
        console.error('Turnstile verification error:', err);
        throw new Error(getMessage(lang, 'turnstile_failed'));
    }
}

