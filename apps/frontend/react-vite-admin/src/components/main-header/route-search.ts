import type {TRoute} from '@/router/types';

export type RouteSearchItem = {
  path: string;
  title: string;
  breadcrumb: string;
  searchText: string;
};

export function buildRouteSearchItems(routes: TRoute[], translate: (key: string) => string): RouteSearchItem[] {
  const items: RouteSearchItem[] = [];
  const paths = new Set<string>();

  function visit(nodes: TRoute[], parentPath = '', ancestors: string[] = []) {
    for (const route of nodes) {
      if (route.index) continue;

      // 根据路由配置计算路径，不依赖菜单渲染时写入的 fullPath。
      const routePath = route.path ?? route.fullPath ?? '';
      if (/^[a-z][a-z\d+.-]*:/i.test(routePath) || routePath.startsWith('//')) continue;
      const path =
        (routePath.startsWith('/') ? routePath : `${parentPath}/${routePath}`)
          .replace(/\/+/g, '/')
          .replace(/\/$/, '') || '/';
      // 参数、可选段和通配符需要额外信息，不能直接作为导航目标。
      if (/[:*?#]/.test(path)) continue;

      const title = route.title ? translate(route.title) : '';
      const titles = title ? [...ancestors, title] : ancestors;
      if (route.children?.length) {
        visit(route.children, path, titles);
        continue;
      }
      if (!title || !routePath || paths.has(path)) continue;

      paths.add(path);
      items.push({
        path,
        title,
        breadcrumb: ancestors.join(' / '),
        searchText: [...titles, route.title, path].join(' ').toLowerCase(),
      });
    }
  }

  visit(routes);
  return items;
}

export function filterRouteSearchItems(items: RouteSearchItem[], query: string): RouteSearchItem[] {
  const keywords = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((item) => keywords.every((keyword) => item.searchText.includes(keyword)));
}
