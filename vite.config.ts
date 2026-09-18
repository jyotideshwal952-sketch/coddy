import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { askTutorAI, getHintAI, explainErrorAI, reviewCodeAI } from './src/server/geminiService.ts';

function apiServerPlugin(): Plugin {
  return {
    name: 'ujala-api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = body ? JSON.parse(body) : {};
            res.setHeader('Content-Type', 'application/json');

            if (req.url === '/api/ai/ask' && req.method === 'POST') {
              const answer = await askTutorAI(data);
              res.end(JSON.stringify({ answer }));
            } else if (req.url === '/api/ai/hint' && req.method === 'POST') {
              const hint = await getHintAI(data);
              res.end(JSON.stringify({ hint }));
            } else if (req.url === '/api/ai/explain' && req.method === 'POST') {
              const explanation = await explainErrorAI(data);
              res.end(JSON.stringify({ explanation }));
            } else if (req.url === '/api/ai/review' && req.method === 'POST') {
              const review = await reviewCodeAI(data);
              res.end(JSON.stringify({ review }));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Endpoint not found' }));
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
