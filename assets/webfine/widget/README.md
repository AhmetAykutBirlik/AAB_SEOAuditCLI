# SEO Audit Widget

A Next.js/React component to integrate the SEO Audit service into your website.

## Usage

1.  Copy `SeoAuditWidget.tsx` to your project.
2.  Install dependencies:
    ```bash
    npm install react-turnstile
    ```
3.  Add Environment Variables to your Next.js project:
    ```env
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...
    NEXT_PUBLIC_SEO_AUDIT_API_BASE=https://api.yourdomain.com
    ```
4.  Import and use:
    ```tsx
    import SeoAuditWidget from './SeoAuditWidget';

    export default function Page() {
      return <SeoAuditWidget />;
    }
    ```
