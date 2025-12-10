import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();

  // --- START: API Endpoints for Asynchronous Pige ---

  // Use JSON middleware for API endpoints
  app.use('/api', express.json());

  // In-memory storage. In a real production app, you'd use a database.
  const pigeResultsStore = new Map();

  // 1. Callback endpoint for n8n to post results to
  app.post('/api/pige-results', (req, res) => {
    // Set CORS headers to allow requests from any origin (like n8n)
    res.header('Access-Control-Allow-Origin', '*');
    
    const resultsData = req.body;
    const rechercheId = resultsData?.payload?.recherche_id || resultsData?.recherche_id;
    
    if (rechercheId) {
      pigeResultsStore.set(rechercheId, {
        receivedAt: new Date().toISOString(),
        data: resultsData
      });
      console.log(`[Server] Pige results received and stored for ID: ${rechercheId}`);
    } else {
      console.error('[Server] Received pige results without a recherche_id.');
    }
    
    // Acknowledge receipt to n8n
    res.status(200).json({ status: 'received' });
  });

  // 2. Endpoint for the frontend to poll for results
  app.get('/api/pige-results/:recherche_id', (req, res) => {
    const { recherche_id } = req.params;
    const results = pigeResultsStore.get(recherche_id);
    
    if (results) {
      console.log(`[Server] Frontend fetched results for ID: ${recherche_id}`);
      res.json(results);
    } else {
      console.log(`[Server] Frontend polled for ID: ${recherche_id}, but no results yet.`);
      res.status(404).json({ status: 'not_found', message: 'Résultats pas encore disponibles.' });
    }
  });

  // 3. Handle pre-flight CORS OPTIONS requests for the callback
  app.options('/api/pige-results', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
  });

  // --- END: API Endpoints ---


  // Proxy for the initial n8n webhook call
  app.use('/n8n-proxy', createProxyMiddleware({
    router: (req) => {
      const url = req.headers['x-n8n-webhook-url'];
      if (!url || typeof url !== 'string') {
        throw new Error('X-N8N-Webhook-Url header is missing or invalid');
      }
      return url;
    },
    changeOrigin: true,
    pathRewrite: {
        '^/n8n-proxy': ''
    },
    onProxyReq: (proxyReq, req, res) => {
      // The body is now handled by express.json() for other routes,
      // so we need to ensure it's available for the proxy.
      // We re-serialize it here.
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    proxyTimeout: 120000,
    timeout: 120000,
  }));
  
  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: __dirname,
  });

  // Use vite's connect instance as middleware for all other requests
  app.use(vite.middlewares);

  app.use('*', (req, res, next) => {
      res.sendFile(path.join(__dirname, 'index.html'));
  });

  const port = process.env.PORT || 9002;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Server] Listening at http://localhost:${port}`);
  });
}

createServer();
