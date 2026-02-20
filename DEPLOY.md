# Deployment Guide (cPanel Node.js App)

1.  **Create Node.js App**:
    - Go to cPanel > **Setup Node.js App**.
    - Click **Create Application**.
    - **Node.js Version**: 20 (or 18+).
    - **Application Mode**: Production.
    - **Application Root**: `seo-audit-service` (or your preferred path).
    - **Application URL**: Select your domain.
    - **Application Startup File**: `dist/server.js` (We will build TypeScript first).

2.  **Upload Files**:
    - Upload the project files to the Application Root.
    - **Exclude**: `node_modules`, `.git`, `src/**/*.test.ts`.

3.  **Install Dependencies**:
    - Click **Run NPM Install** in the cPanel Node.js interface.
    - OR run manually via terminal: `npm install --omit=dev`.

4.  **Build TypeScript**:
    - Since cPanel might not run `tsc`, it's best to build locally and upload the `dist` folder.
    - Run `npm run build` locally.
    - Upload the `dist` folder to the server.
    - Change **Application Startup File** to `dist/server.js`.

5.  **Environment Variables**:
    - In cPanel Node.js App settings, add the variables:
        - `TURNSTILE_SECRET_KEY`
        - `TELEGRAM_BOT_TOKEN`
        - `TELEGRAM_CHAT_ID`
        - `ALLOWED_ORIGINS`
    - `PORT` is automatically handled by cPanel (Passenger).

6.  **Restart**:
    - Click **Restart Application**.
