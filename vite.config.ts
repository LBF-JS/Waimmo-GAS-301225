import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import isoImport from 'vite-plugin-iso-import';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Ignorer les options inconnues passées en ligne de commande (comme --hostname)
      allowUnknownFlags: true,
      server: {
        host: '0.0.0.0', // S'assurer que Vite écoute sur la bonne interface
        proxy: {
          // Proxy les requêtes de /n8n-proxy vers l'URL du webhook n8n
          '/n8n-proxy': {
            // La cible sera déterminée dynamiquement par le router
            target: 'http://placeholder.target.com', 
            changeOrigin: true,
            proxyTimeout: 120000, // 2 minutes timeout
            router: (req) => {
              const webhookUrl = req.headers['x-n8n-webhook-url'] as string;
              if (webhookUrl) {
                return webhookUrl;
              }
              // Cette erreur ne devrait pas se produire si l'en-tête est toujours envoyé
              throw new Error('X-N8N-Webhook-Url header is missing');
            },
            rewrite: (path) => path.replace(/^\/n8n-proxy/, ''), // Enlève /n8n-proxy de l'URL
            logLevel: 'debug',
          },
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
