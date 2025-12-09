import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import isoImport from 'vite-plugin-iso-import';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // The server config is now handled by server.js
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
