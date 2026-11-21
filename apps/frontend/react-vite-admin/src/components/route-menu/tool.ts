import type {TRoute} from '@/router/types';
/**
 * 当引用整个包的命名空间时，Vite 会认为你可能会用到 lodash-es 里的多个工具。为了性能会把整个 lodash-es 库预构建成一个单一的、巨大的 ESM 文件
 * 不管后面引入 lodash-es 的其他函数，浏览器都只需要请求这一个 lodash-es.js（已经缓存在内存/磁盘中），不会再产生新的 HTTP 请求
 */
import {cloneDeep} from 'lodash-es';
// 每个具体导入是一个单独的 HTTP 请求
// import cloneDeep from 'lodash-es/cloneDeep';


// todo：动态路由
export const findOpenRoutes = (path: string, routes: TRoute[]): TRoute[] => {
  const pathArr = path.split('/').filter(Boolean);
  const openRoutes: TRoute[] = [];
  const search = (segments: string[], routes: TRoute[]) => {
    if (segments.length === 0) return;
    const segment = segments[0];
    for (const route of routes) {
      // 根据路径找菜单
      if (route.path === segment) {
        // 还剩的路由集合
        const nextSegments = segments.slice(1);
        const success = route.children ? search(nextSegments, route.children) : nextSegments.length === 0;
        // 路由集合全都被找到了，才算匹配
        if (success) {
          openRoutes.push(route);
          return true;
        }
      }
    }
    return false;
  };
  // 拷贝防止副作用
  search([...pathArr], routes);
  return openRoutes.reverse();
};

export const stripRouteRuntimeFields = (routes: TRoute[]): TRoute[] => {
  const process = (data: TRoute[]): TRoute[] => {
    return data.reduce<TRoute[]>((prev, cur) => {
      // 过滤掉 index=true 的项
      if (cur.index) return prev;
      // 删除不需要的字段
      const {Component: _component, element: _element, loader: _loader, ...rest} = cur;
      const route: TRoute = {...rest};
      if (cur.children?.length) {
        // 递归处理子节点
        route.children = process(cur.children);
      }
      prev.push(route);
      return prev;
    }, []);
  };

  const clone = cloneDeep(routes);
  return process(clone);
};
