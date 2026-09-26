import { ipAddress } from '@vercel/functions/headers';
import { next } from '@vercel/functions/middleware';

// Vercel provides process.env to Routing Middleware; this project has no Node type definitions.
declare const process: { env: Record<string, string | undefined> };

/**
 * Vercel Routing Middleware for the `/api` rewrite to the Railway backend (see `vercel.json`).
 *
 * Every browser reaches the API through this proxy, so the API sees one connecting address for
 * everybody and its per-IP rate limits collapse into a single shared bucket. This forwards the
 * visitor's address in `x-shoppy-client-ip`, together with a shared secret the API checks before
 * believing it (`EdgeClientAddress` in shoppy-shop-api). Both headers are always removed first and
 * then set, never appended, so a value a browser sends itself never reaches the API.
 *
 * `SHOPPY_EDGE_SECRET` must match the API's `Proxy__EdgeSecret`. When it is missing the headers
 * are simply not sent and the API falls back to its shared bucket — nothing breaks.
 */
export const config = { matcher: '/api/:path*' };

export default function middleware(request: Request): Response {
  const headers = new Headers(request.headers);
  headers.delete('x-shoppy-client-ip');
  headers.delete('x-shoppy-edge-secret');

  const clientIp = ipAddress(request);
  const edgeSecret = process.env['SHOPPY_EDGE_SECRET'];
  if (clientIp && edgeSecret) {
    headers.set('x-shoppy-client-ip', clientIp);
    headers.set('x-shoppy-edge-secret', edgeSecret);
  }

  return next({ request: { headers } });
}
