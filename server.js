import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();

  // Proxy for n8n webhook
  app.use('/n8n-proxy', createProxyMiddleware({
    // The target will be dynamically set based on the header
    router: (req) => {
      const url = req.headers['x-n8n-webhook-url'];
      if (!url || typeof url !== 'string') {
        throw new Error('X-N8N-Webhook-Url header is missing or invalid');
      }
      return url;
    },
    changeOrigin: true,
    pathRewrite: {
        '^/n8n-proxy': '' // remove /n8n-proxy from the forwarded path
    },
    onProxyReq: (proxyReq, req, res) => {
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    proxyTimeout: 120000, // 2 minutes timeout
    timeout: 120000,
  }));
  
  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: __dirname, // Set the root to the current directory
  });

  // Use vite's connect instance as middleware for all other requests
  app.use(vite.middlewares);

  app.use('*', (req, res, next) => {
      res.sendFile(path.join(__dirname, 'index.html'));
  });

  const port = process.env.PORT || 9002;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

createServer();
