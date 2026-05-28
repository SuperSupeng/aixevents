import { createClient } from '@supabase/supabase-js';

type Env = {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  STATS_API_KEY?: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return jsonResponse({}, 200);
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const apiKey = request.headers.get('x-api-key') || url.searchParams.get('key');

  if (!env.STATS_API_KEY || apiKey !== env.STATS_API_KEY) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.rpc('get_ics_download_stats');

    if (error) {
      console.error('Cloudflare stats error:', error);
      return jsonResponse({ error: 'Failed to fetch stats' }, 500);
    }

    return jsonResponse({
      success: true,
      generated_at: new Date().toISOString(),
      stats: data,
    });
  } catch (error) {
    console.error('Cloudflare stats handler error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
