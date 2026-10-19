Minimal serverless proxy & local test

Purpose
- Keep your GenAI API key on the server (not in the browser) and forward chat requests from the frontend.

Files added
- `api/ai-proxy.ts` — example Vercel serverless function (reads `process.env.API_KEY`).
- `server/proxy.js` — small Express server for local testing.

Quick local test
1. Install dependencies for the local proxy:

```bash
npm install express
```

2. Start the proxy (set your server API key as `API_KEY`):

```bash
export API_KEY="your_real_api_key"
npm run start-proxy
```

3. In another terminal, run the app with your frontend pointing to the proxy. For local testing you can set in the browser fetch target to `http://localhost:8787/api/ai-proxy`.

Example curl request to test proxy:

```bash
curl -X POST http://localhost:8787/api/ai-proxy \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from test"}'
```

Deploying serverless (Vercel)
- Add `API_KEY` as a project environment variable in Vercel (or your hosting provider).
- Deploy — the `api/ai-proxy.ts` function will be available at `/api/ai-proxy`.

Using the proxy from the frontend
- Update your client to POST to `/api/ai-proxy` instead of calling GenAI directly.
- If you want to keep both modes, you can use an env flag like `VITE_USE_PROXY=true` during build.
