import {afterEach, describe, expect, it, vi} from 'vitest';
import worker from '../cloudflare/worker';

const origin = 'https://admin.example';
function setup() {
  const assets = vi.fn(async (request: Request) => {
    const path = new URL(request.url).pathname;
    return path === '/g/index.html' ? new Response('<html>admin</html>') :
      path === '/g/js/app.js' ? new Response('script') : new Response('missing', {status: 404});
  });
  return {ASSETS: {fetch: assets}, API_ORIGIN: 'https://backend.example'};
}
afterEach(() => vi.unstubAllGlobals());
describe('Cloudflare admin routing', () => {
  it('redirects entry paths and preserves query parameters', async () => {
    for (const path of ['/', '/g']) {
      const response = await worker.fetch(new Request(`${origin}${path}?from=test`), setup());
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe(`${origin}/g/?from=test`);
    }
  });
  it('serves assets and falls back for page navigation', async () => {
    const env = setup();
    expect(await (await worker.fetch(new Request(`${origin}/g/js/app.js`), env)).text()).toBe('script');
    for (const path of ['/g/', '/g/users/42']) {
      const response = await worker.fetch(new Request(`${origin}${path}`, {headers: {Accept: 'text/html'}}), env);
      expect(await response.text()).toBe('<html>admin</html>');
    }
  });
  it('does not turn missing scripts or unrelated paths into the SPA', async () => {
    expect((await worker.fetch(new Request(`${origin}/g/js/missing.js`), setup())).status).toBe(404);
    expect((await worker.fetch(new Request(`${origin}/other`, {headers: {Accept: 'text/html'}}), setup())).status).toBe(404);
  });
  it('forwards API method, query, body and auth without following redirects', async () => {
    const upstream = vi.fn(async (request: Request, options: RequestInit) => {
      expect(request.url).toBe('https://backend.example/api/users?page=2');
      expect(request.method).toBe('POST');
      expect(await request.text()).toBe('payload');
      expect(request.headers.get('Authorization')).toBe('Bearer test');
      expect(request.headers.get('Host')).toBeNull();
      expect(options.redirect).toBe('manual');
      return new Response('API missing', {status: 404});
    });
    vi.stubGlobal('fetch', upstream);
    const env = setup();
    const response = await worker.fetch(new Request(`${origin}/g/api/users?page=2`, {
      method: 'POST', body: 'payload', headers: {Authorization: 'Bearer test', Host: 'admin.example'},
    }), env);
    expect(response.status).toBe(404);
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });
  it('returns an error when the API is unconfigured or unreachable', async () => {
    const request = new Request(`${origin}/g/api/users`);
    expect((await worker.fetch(request, {...setup(), API_ORIGIN: ''})).status).toBe(503);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    expect((await worker.fetch(request, setup())).status).toBe(502);
  });
});
