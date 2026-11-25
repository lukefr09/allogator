import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { getQuote, allowQuoteRequest } from './server/quote.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      {
        name: 'local-quotes',
        configureServer(server) {
          server.middlewares.use('/api/quote', async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store');
            if (req.method !== 'GET') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Use GET to request a quote.' }));
              return;
            }
            if (!allowQuoteRequest(req.socket.remoteAddress ?? 'local')) {
              res.statusCode = 429;
              res.end(
                JSON.stringify({
                  error: 'Too many quote requests. Try again in a minute.',
                }),
              );
              return;
            }
            const symbol =
              new URL(req.url ?? '', 'http://localhost').searchParams.get(
                'symbol',
              ) ?? '';
            const result = await getQuote(symbol.trim().toUpperCase(), env);
            res.statusCode = result.status;
            res.end(JSON.stringify(result.body));
          });
        },
      },
    ],
    server: { host: '127.0.0.1' },
    build: { target: 'es2022' },
  };
});
