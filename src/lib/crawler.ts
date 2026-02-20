import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import https from 'https';

interface AuditIssue {
    type: 'error' | 'warning' | 'info';
    message: string;
    points: number;
}

interface PageAudit {
    url: string;
    status: number;
    score: number;
    issues: AuditIssue[];
    data: {
        title?: string;
        description?: string;
        canonical?: string;
        h1Count: number;
        imagesTotal: number;
        imagesMissingAlt: number;
        internalLinks: number;
        externalLinks: number;
        htmlSizeKb: number;
        ttfbMs: number;
    };
    durationMs: number;
}

interface CrawlerOptions {
    maxDepth: number;
    maxPages: number;
    concurrency: number;
    timeoutMs: number;
    maxHtmlSize: number; // in bytes
}

const USER_AGENT = 'AAB-SEO-Audit-Bot/3.0 (Premium Analysis)';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

export class Crawler {
    private visited = new Set<string>();
    private queue: { url: string; depth: number }[] = [];
    private results: PageAudit[] = [];
    private options: CrawlerOptions;
    private domain: string = '';
    private startTime: number = 0;
    private totalCrawlTimeout = 60000; // 60s cap

    constructor(options: CrawlerOptions) {
        this.options = options;
    }

    async start(startUrl: string): Promise<PageAudit[]> {
        this.startTime = Date.now();
        const urlObj = new URL(startUrl);
        this.domain = urlObj.hostname;

        this.queue.push({ url: startUrl, depth: 0 });
        this.visited.add(startUrl);

        const running = new Set<Promise<void>>();

        while (this.queue.length > 0 || running.size > 0) {
            // Check limits
            if (this.results.length >= this.options.maxPages) break;
            if (Date.now() - this.startTime > this.totalCrawlTimeout) break;

            while (running.size < this.options.concurrency && this.queue.length > 0) {
                const item = this.queue.shift();
                if (!item) break;

                const p = this.processPage(item.url, item.depth).then(() => {
                    running.delete(p);
                });
                running.add(p);
            }

            if (running.size > 0) {
                await Promise.race(running);
            } else {
                break;
            }
        }

        return this.results;
    }

    private async processPage(url: string, depth: number) {
        const start = Date.now();
        const issues: AuditIssue[] = [];
        let score = 100;

        try {
            const res = await axios.get(url, {
                headers: { 'User-Agent': USER_AGENT },
                timeout: this.options.timeoutMs,
                maxContentLength: this.options.maxHtmlSize,
                validateStatus: () => true,
                httpsAgent: httpsAgent,
                // Use a stream or check headers for size before downloading fully if possible, 
                // but axios maxContentLength handles this well for basic cases.
            });

            const html = res.data;
            const ttfb = Date.now() - start;
            const htmlSizeKb = Buffer.byteLength(typeof html === 'string' ? html : '') / 1024;

            if (res.status >= 400) {
                issues.push({ type: 'error', message: `Page returned HTTP ${res.status}`, points: 20 });
            }

            const $ = cheerio.load(html);

            // 1. Meta & Title
            const title = $('title').text().trim();
            const desc = $('meta[name="description"]').attr('content')?.trim();
            const canonical = $('link[rel="canonical"]').attr('href');
            const robots = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';

            if (!title) {
                issues.push({ type: 'error', message: 'Missing Title tag', points: 10 });
            } else if (title.length < 30 || title.length > 70) {
                issues.push({ type: 'warning', message: `Title length (${title.length}) is not optimal (30-70)`, points: 2 });
            }

            if (!desc) {
                issues.push({ type: 'error', message: 'Missing Meta Description', points: 10 });
            } else if (desc.length < 120 || desc.length > 160) {
                issues.push({ type: 'warning', message: `Description length (${desc.length}) is not optimal (120-160)`, points: 2 });
            }

            if (!canonical) {
                issues.push({ type: 'warning', message: 'Missing Canonical tag', points: 5 });
            }

            if (robots.includes('noindex')) {
                issues.push({ type: 'info', message: 'Page has noindex directive', points: 0 });
            }

            // 2. Headings
            const h1s = $('h1');
            if (h1s.length === 0) {
                issues.push({ type: 'error', message: 'Missing H1 tag', points: 10 });
            } else if (h1s.length > 1) {
                issues.push({ type: 'warning', message: `Multiple H1 tags found (${h1s.length})`, points: 5 });
            }

            // 3. Images
            const images = $('img');
            let missingAlt = 0;
            images.each((_, el) => {
                if (!$(el).attr('alt')) missingAlt++;
            });
            if (missingAlt > 0) {
                issues.push({ type: 'warning', message: `${missingAlt} images missing alt attributes`, points: Math.min(10, missingAlt * 2) });
            }

            // 4. Performance
            if (ttfb > 1000) {
                issues.push({ type: 'warning', message: `Slow TTFB: ${(ttfb / 1000).toFixed(2)}s`, points: 5 });
            }
            if (htmlSizeKb > 500) {
                issues.push({ type: 'warning', message: `Large HTML size: ${htmlSizeKb.toFixed(1)}KB`, points: 2 });
            }

            // 5. Links & Discovery
            let internalLinks = 0;
            let externalLinks = 0;
            $('a').each((_, el) => {
                const href = $(el).attr('href');
                if (!href) return;

                try {
                    const absolute = new URL(href, url).href;
                    const isInternal = new URL(absolute).hostname === this.domain;

                    if (isInternal) {
                        internalLinks++;
                        if (depth < this.options.maxDepth && !this.visited.has(absolute) && this.results.length < this.options.maxPages) {
                            this.visited.add(absolute);
                            this.queue.push({ url: absolute, depth: depth + 1 });
                        }
                    } else {
                        externalLinks++;
                    }
                } catch (e) { }
            });

            // Calculate final score
            issues.forEach(issue => {
                score -= issue.points;
            });
            score = Math.max(0, score);

            this.results.push({
                url,
                status: res.status,
                score,
                issues,
                data: {
                    title,
                    description: desc,
                    canonical,
                    h1Count: h1s.length,
                    imagesTotal: images.length,
                    imagesMissingAlt: missingAlt,
                    internalLinks,
                    externalLinks,
                    htmlSizeKb,
                    ttfbMs: ttfb
                },
                durationMs: Date.now() - start
            });

        } catch (err: any) {
            console.error(`Failed to crawl ${url}:`, err.message);
            this.results.push({
                url,
                status: 0,
                score: 0,
                issues: [{ type: 'error', message: `Failed to fetch page: ${err.message}`, points: 100 }],
                data: { h1Count: 0, imagesTotal: 0, imagesMissingAlt: 0, internalLinks: 0, externalLinks: 0, htmlSizeKb: 0, ttfbMs: 0 },
                durationMs: Date.now() - start
            });
        }
    }
}


