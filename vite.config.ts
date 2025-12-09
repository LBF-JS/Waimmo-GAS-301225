import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import isoImport from 'vite-plugin-iso-import';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 9002,
        host: '0.0.0.0', // This is the correct way to set the host
        proxy: {
            '/n8n-proxy': {
              target: 'https://n8n.wa-master.fr', // Default, will be overridden by header
              changeOrigin: true,
              proxyTimeout: 120000, // 2 minutes timeout
              rewrite: (path) => path.replace(/^\/n8n-proxy/, ''),
              configure: (proxy, options) => {
                proxy.on('proxyReq', (proxyReq, req, res) => {
                   if (req.headers['x-n8n-webhook-url']) {
                        const targetUrl = new URL(req.headers['x-n8n-webhook-url'] as string);
                        proxyReq.setHeader('host', targetUrl.hostname);
                        // The target is dynamically set by the 'host' header,
                        // so we can leave the main target as a default.
                   }
                   // The body is not parsed by default on proxied requests, so we need to handle it.
                   // Based on the 'body-parser' logic inside Vite's dev server.
                   if (req.body) {
                        const bodyData = JSON.stringify(req.body);
                        proxyReq.setHeader('Content-Type', 'application/json');
                        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                        proxyReq.write(bodyData);
                   }
                });
              }
            }
        },
      },
      plugins: [react(), isoImport()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
