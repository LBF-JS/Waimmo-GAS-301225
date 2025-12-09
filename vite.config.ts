import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import isoImport from 'vite-plugin-iso-import';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/n8n-proxy': {
            target: env.VITE_N8N_WEBHOOK_URL,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/n8n-proxy/, ''),
            secure: false,
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
