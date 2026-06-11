function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Actor, X-Admin-Token',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return jsonResponse({}, 200);
}

export async function onRequest(context: { request: Request }) {
  const { request } = context;
  if (request.method === 'OPTIONS') return onRequestOptions();

  const currentUrl = new URL(request.url);
  const targetUrl = new URL('/api/admin/submissions', currentUrl.origin);
  targetUrl.search = currentUrl.search;

  return new Response(null, {
    status: 307,
    headers: {
      Location: targetUrl.toString(),
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
