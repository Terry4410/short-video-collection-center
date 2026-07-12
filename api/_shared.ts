export function response(request: Request, body: unknown, status = 200) {
  const allowed = process.env.ALLOWED_ORIGIN || 'https://terry4410.github.io';
  const origin = request.headers.get('origin') || '';
  const headers = new Headers({'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
  if (origin === allowed) headers.set('Access-Control-Allow-Origin', allowed);
  return new Response(JSON.stringify(body), {status, headers});
}
export function isAllowed(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || origin === (process.env.ALLOWED_ORIGIN || 'https://terry4410.github.io');
}
