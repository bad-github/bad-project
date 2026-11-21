/**
 * 网站对外公开的正式地址，供 robots、sitemap、canonical 等 SEO 配置共同使用。
 * 这个文件本身不会生成网页，它只是集中保存多个 SEO 文件都要使用的基础地址，
 * 避免在不同文件中重复写域名，减少更换域名时遗漏修改的风险。
 *
 * 部署域名变化时，优先在部署平台设置 SITE_URL 环境变量并重新构建
 * 例如：https://example.com。不要在末尾添加 `/`。
 * replace 会移除误填的末尾 `/`，防止拼接路径时出现 `//sitemap.xml`。
 */
const siteUrl = process.env.SITE_URL;

if (!siteUrl) {
  throw new Error('缺少 SITE_URL：请在 next-app/.env.local 或部署平台中配置。');
}

const parsedSiteUrl = new URL(siteUrl);
if (!['http:', 'https:'].includes(parsedSiteUrl.protocol) || parsedSiteUrl.origin !== siteUrl.replace(/\/$/, '')) {
  throw new Error('SITE_URL 必须是完整站点源地址，例如 https://example.com，不能包含路径或查询参数。');
}

export const SITE_URL = parsedSiteUrl.origin;
