import type {RouteObject} from 'react-router';

export type TRouteInfo = {
  title?: string;
  key: string;
  icon?: React.ReactNode;
  children?: TRoute[];
  fullPath?: string;
};
export type TRoute = RouteObject & TRouteInfo;
