import {createBrowserRouter} from 'react-router';
import type {TRoute} from './types';
import {routes} from './routes';

function generateRoute(routes: TRoute[]) {
  return routes.map((route) => {
    if (route.children) {
      route.children = generateRoute(route.children);
    }
    return route;
  });
}

/**
 * 配置了publicPath,就必须配置basename
 * 但配置了basename,不一定要配置publicPath
 */
export const defaultRoutes = routes[0]?.children?.[0]?.children || [];
export const createRouter = (basename: string) => createBrowserRouter(generateRoute(routes), {basename});
export const router = createRouter(`/${import.meta.env.VITE_APP_NAME}/`);
