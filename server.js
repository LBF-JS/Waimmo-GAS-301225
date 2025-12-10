
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer } from 'vite';

const port = process.env.PORT || 9002;

async function startServer() {
    const app = express();

    // Proxy pour le webhook n8n
    app.use('/n8n-proxy', createProxyMiddleware({
        target: 'http://localhost:9002', // Cible temporaire, sera remplacée par le router
        changeOrigin: true,
        proxyTimeout: 120000, // 2 minutes
        router: (req) => {
            const webhookUrl = req.headers['x-n8n-webhook-url'] as string;
            if (webhookUrl) {
                return webhookUrl;
            }
            throw new Error('X-N8N-Webhook-Url header is missing');
        },
        pathRewrite: {
            '^/n8n-proxy': '', // Supprime /n8n-proxy du chemin
        },
        logLevel: 'debug',
    }));

    // Crée un serveur Vite en mode middleware
    const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa', // Important pour les Single Page Applications
    });

    // Utilise les middlewares de Vite pour servir les fichiers de l'application
    app.use(vite.middlewares);

    // Démarrage du serveur Express
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server listening on http://localhost:${port}`);
    });
}

startServer();
