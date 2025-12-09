
import express from 'express';
import { createServer } from 'vite';
import cors from 'cors';
import { request } from 'http'; // Use http or https depending on the webhook URL

const app = express();

// Enable CORS for all routes
app.use(cors());
// Middleware to parse JSON bodies, necessary for webhook proxy
app.use(express.json());

// Proxy endpoint for n8n webhook
app.post('/', (clientReq, clientRes) => {
    const webhookUrl = clientReq.header('X-N8N-Webhook-Url');
    
    if (!webhookUrl) {
        return clientRes.status(400).send('X-N8N-Webhook-Url header is missing.');
    }

    try {
        const url = new URL(webhookUrl);

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(clientReq.body)),
            },
        };

        const proxyReq = request(options, (proxyRes) => {
            clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(clientRes, { end: true });
        });

        proxyReq.on('error', (err) => {
            console.error('Proxy request error:', err);
            clientRes.status(502).send('Error connecting to the webhook server.');
        });
        
        // Handle long-running requests
        proxyReq.setTimeout(120000); // 2 minutes timeout

        proxyReq.write(JSON.stringify(clientReq.body));
        proxyReq.end();

    } catch (error) {
        console.error('Invalid webhook URL:', error);
        return clientRes.status(400).send('Invalid webhook URL provided.');
    }
});


// Create Vite server in middleware mode
async function startServer() {
    const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
    });

    // Use Vite's middleware
    app.use(vite.middlewares);

    const port = 9002;
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server listening at http://0.0.0.0:${port}`);
    });
}

startServer();
