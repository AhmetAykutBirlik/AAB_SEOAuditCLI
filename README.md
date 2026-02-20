# AAB SEO Audit API v3 (Lead Funnel Edition)

A premium, production-grade SEO Audit service built with Node.js and Fastify, featuring a built-in lead generation funnel.

## Features (v3.0.0)

- **Advanced SEO Audit**:
  - Full technical analysis (Meta, Canonical, Robots, H1-H6, Images, Links).
  - Performance metrics (TTFB, HTML Size).
  - Score-based reporting (0-100).
- **Lead Funnel UX**:
  - Preview-first analysis.
  - Optional email capture via `/api/lead`.
  - Instant Telegram notifications for new leads.
- **Hardened Security**:
  - **Full SSRF Protection**: Blocks private IP ranges (IPv4/v6) and DNS rebinding.
  - **Port Filtering**: Only allows ports 80 and 443.
  - **Response Limits**: 5MB max HTML size, 15s per request timeout.
  - **Rate Limiting**: 10 requests / 10 min per IP.
- **Enterprise Ready**:
  - JSONL Logging (`/logs`).
  - TR/EN i18n support.
  - cPanel Node.js App compatible.

## Quick Start

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configuration**:
    Create a `.env` file:
    ```env
    TURNSTILE_SECRET_KEY=...
    TELEGRAM_BOT_TOKEN=...
    TELEGRAM_CHAT_ID=...
    ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
    PORT=3000
    ```

3.  **Run**:
    ```bash
    npm run dev
    ```

## API Endpoints

### `POST /api/audit`
Runs a full audit.
**Body:** `{ "url": "...", "turnstileToken": "...", "lang": "tr|en" }`

### `POST /api/lead`
Captures user email for a specific audit.
**Body:** `{ "requestId": "...", "email": "...", "lang": "tr|en" }`

### `GET /health`
Service health status.

## Deployment
Optimized for cPanel Node.js Selector. Ensure `PORT` environment variable is set by the hosting provider.

