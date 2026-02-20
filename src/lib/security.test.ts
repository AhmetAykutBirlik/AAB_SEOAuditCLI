import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkSSRF, verifyTurnstile } from './security';
import axios from 'axios';
import dns from 'node:dns/promises';
import * as i18n from './i18n';

vi.mock('axios');
vi.mock('node:dns/promises');

// Mock getMessage to return the key itself for easy testing
vi.spyOn(i18n, 'getMessage').mockImplementation((lang, key) => key);

describe('Security - checkSSRF', () => {
    it('should allow public URLs', async () => {
        vi.mocked(dns.lookup).mockResolvedValue({ address: '8.8.8.8', family: 4 });
        await expect(checkSSRF('https://google.com')).resolves.not.toThrow();
    });

    it('should block localhost', async () => {
        await expect(checkSSRF('http://localhost:3000')).rejects.toThrow('blocked_ssrf');
    });

    it('should block private IP ranges (127.0.0.1)', async () => {
        vi.mocked(dns.lookup).mockResolvedValue({ address: '127.0.0.1', family: 4 });
        await expect(checkSSRF('http://local.test')).rejects.toThrow('blocked_ssrf');
    });

    it('should block private IP ranges (192.168.1.1)', async () => {
        vi.mocked(dns.lookup).mockResolvedValue({ address: '192.168.1.1', family: 4 });
        await expect(checkSSRF('http://router.test')).rejects.toThrow('blocked_ssrf');
    });

    it('should block non-http protocols', async () => {
        await expect(checkSSRF('ftp://example.com')).rejects.toThrow('invalid_url');
    });
});

describe('Security - verifyTurnstile', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv, TURNSTILE_SECRET_KEY: 'test-secret' };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should pass if Cloudflare returns success', async () => {
        vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });
        await expect(verifyTurnstile('valid-token', '1.2.3.4')).resolves.not.toThrow();
    });

    it('should throw if Cloudflare returns failure', async () => {
        vi.mocked(axios.post).mockResolvedValue({ data: { success: false } });
        await expect(verifyTurnstile('invalid-token', '1.2.3.4')).rejects.toThrow('turnstile_failed');
    });
});
