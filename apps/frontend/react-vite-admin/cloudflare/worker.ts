/** wrangler.jsonc 中声明的静态资源绑定和运行时变量。 */
interface Env {
  // 对应 dist/，包含 dist/g/index.html、JS、CSS 等构建产物。
  ASSETS: {fetch(request: Request): Promise<Response>};
  // Nginx 对外可访问的源站地址，例如 https://api.example.com，不带 /api。
  // 应指向实际源站，不能指回当前 Worker 域名，否则会产生循环请求。
  API_ORIGIN: string;
}

/**
 * Cloudflare 部署入口：浏览器始终访问同一个前端域名。
 *
 * 静态资源：浏览器 → Cloudflare Worker → ASSETS 中的 dist/ 文件。
 * API 请求：浏览器 → Cloudflare Worker → API_ORIGIN（Nginx）→ 后端服务。
 * Worker 负责把同域 API 请求送到源站，Nginx 继续负责源站内部的反向代理。
 * 前端保留 /g/api/* 相对地址，无需直接请求另一个 API 域名。
 *
 * wrangler.jsonc 设置 run_worker_first: true，所有请求先经过这里，再按下面的顺序分流
 * 
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // 统一页面入口为 /g/，保留查询参数；307 保留原请求方法和请求体。
    if (url.pathname === '/' || url.pathname === '/g') {
      url.pathname = '/g/';
      return Response.redirect(url.toString(), 307);
    }

    // 先处理 API，避免把接口请求当成静态资源或 SPA 页面。
    // 转发后直接返回上游响应，包括 401、404、500，不执行下面的页面回退。
    if (url.pathname === '/g/api' || url.pathname.startsWith('/g/api/')) {
      if (!env.API_ORIGIN) return new Response('API_ORIGIN is not configured', {status: 503});
      // 例如 /g/api/users?page=2 → https://api.example.com/api/users?page=2。
      // 仅移除前端应用前缀 /g，保留后端的 /api 前缀和查询参数。
      const target = new URL(env.API_ORIGIN);
      target.pathname = url.pathname.slice('/g'.length);
      target.search = url.search;
      // 继承方法、请求体及 Authorization、Cookie 等请求头。
      // 移除浏览器请求中的 Host，让运行时按目标 URL 设置源站主机名。
      const upstream = new Request(target, request);
      upstream.headers.delete('host');
      try {
        // 保留上游重定向，避免携带 Authorization/Cookie 自动跟随至其他域名。
        return await fetch(upstream, {redirect: 'manual'});
      } catch {
        // 网络连接失败属于网关错误，不代表后端主动返回的业务状态码。
        return new Response('API upstream unavailable', {status: 502});
      }
    }

    // API 以外只提供静态内容；GET 获取文件，HEAD 仅获取响应头。
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', {status: 405, headers: {Allow: 'GET, HEAD'}});
    }
    // 优先按原始路径查找文件，例如 /g/js/app.js 对应 dist/g/js/app.js。
    // 命中资源就返回；只有找不到文件时才考虑 SPA 页面回退。
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;

    // React Router 的深层页面通常没有对应的 HTML 文件。
    // /g/ 或 /g/ 下 Accept 包含 text/html 的请求，统一返回 dist/g/index.html，
    // 由浏览器端路由决定显示哪个页面，因此直接访问、刷新深层页面都能工作。
    // 普通 JS/CSS 资源请求不满足页面条件时，以及 /g/ 以外的路径，保持 404。
    if (url.pathname.startsWith('/g/') &&
        (url.pathname === '/g/' || request.headers.get('Accept')?.includes('text/html'))) {
      url.pathname = '/g/index.html';
      // 页面查询参数仍保留在浏览器地址中；这里只清空内部读取入口文件的 URL。
      url.search = '';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return asset;
  },
};
