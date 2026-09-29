// The Suno API requires a callBackUrl on every task. The app polls for results
// instead, so this endpoint simply acknowledges callbacks with a 200.
export default async () =>
  new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });

export const config = { path: '/api/callback' };
