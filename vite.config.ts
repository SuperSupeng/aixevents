import { Buffer } from 'node:buffer'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

type LocalFunctionEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_PUBLIC_SITE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  REVIEW_ADMIN_TOKEN?: string;
  ADMIN_ALLOWED_ORIGINS?: string;
  IP_HASH_SALT?: string;
};

function createLocalFunctionsPlugin(env: LocalFunctionEnv): Plugin {
  return {
    name: 'aixevents-local-functions',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/admin/submissions', async (req, res) => {
        try {
          const request = await toFetchRequest(req);
          const handler = await server.ssrLoadModule('/functions/api/admin/submissions.ts') as {
            onRequestOptions?: (context: { request: Request; env: LocalFunctionEnv }) => Promise<Response>;
            onRequestGet?: (context: { request: Request; env: LocalFunctionEnv }) => Promise<Response>;
            onRequestPost?: (context: { request: Request; env: LocalFunctionEnv }) => Promise<Response>;
          };

          const context = { request, env };
          const method = request.method.toUpperCase();
          const response = method === 'OPTIONS'
            ? await handler.onRequestOptions?.(context)
            : method === 'GET'
              ? await handler.onRequestGet?.(context)
              : method === 'POST'
                ? await handler.onRequestPost?.(context)
                : new Response(JSON.stringify({ error: 'Method not allowed' }), {
                    status: 405,
                    headers: { 'Content-Type': 'application/json; charset=utf-8' },
                  });

          await sendFetchResponse(res, response || new Response(JSON.stringify({ error: 'Handler not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          }));
        } catch (error) {
          console.error('Local admin function error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Local admin function failed' }));
        }
      });
    },
  };
}

async function toFetchRequest(req: any): Promise<Request> {
  const method = String(req.method || 'GET').toUpperCase();
  const host = req.headers.host || '127.0.0.1:5173';
  const originalUrl = req.originalUrl || req.url || '/';
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers || {})) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else if (value !== undefined) {
      headers.set(key, String(value));
    }
  }

  const body = method === 'GET' || method === 'HEAD' ? undefined : await readRequestBody(req);
  return new Request(`http://${host}${originalUrl}`, {
    method,
    headers,
    body,
  });
}

async function readRequestBody(req: any): Promise<Uint8Array> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function sendFetchResponse(res: any, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = Buffer.from(await response.arrayBuffer());
  res.end(body);
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const localEnv = { ...loadEnv(mode, process.cwd(), ''), ...process.env };

  return {
    plugins: [react(), createLocalFunctionsPlugin(localEnv)],
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            motion: ['framer-motion'],
            supabase: ['@supabase/supabase-js'],
            query: ['@tanstack/react-query'],
            date: ['date-fns'],
            icons: ['lucide-react'],
          },
        },
      },
    },
  };
})
