import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer } from 'vite';
import { parse } from 'url';

const port = process.env.PORT || 9002;

async function startServer() {
    const app = express();

    // Proxy for n8n webhook
    app.use('/n8n-proxy', createProxyMiddleware({
        target: 'http://localhost:9002', // Placeholder target
        changeOrigin: true,
        proxyTimeout: 120000, // 2 minutes
        router: (req) => {
            const webhookUrl = req.headers['x-n8n-webhook-url'];
            if (webhookUrl) {
                return webhookUrl;
            }
            throw new Error('X-N8N-Webhook-Url header is missing');
        },
        pathRewrite: {
            '^/n8n-proxy': '',
        },
        logLevel: 'debug'
    }));

    // Create Vite server in middleware mode
    const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
    });

    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
    
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server listening on http://localhost:${port}`);
    });
}

startServer();
