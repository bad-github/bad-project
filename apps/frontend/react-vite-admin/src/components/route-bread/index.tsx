import {Fragment} from 'react';
import {useNavigate} from 'react-router';
import {useTranslation} from 'react-i18next';
import {useShallow} from 'zustand/shallow';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@badnpm/ui';
import useTabStore from '@/store/tab-store';
import type {TRoute} from '@/router/types';
import {findOpenRoutes} from '../route-menu/tool';

type TProps = {
  className?: string;
};
export default function RouteBread(props: TProps) {
  const {className} = props;
  const {t} = useTranslation();
  const {activeRoute, setActiveRoute, addOpenKeys, allRoutes} = useTabStore(
    useShallow((state) => ({
      activeRoute: state.activeRoute,
      setActiveRoute: state.setActiveRoute,
      addOpenKeys: state.addOpenKeys,
      allRoutes: state.allRoutes,
    }))
  );
  const navigate = useNavigate();

  // 跳转到第一个子路由
  const handleClickLink = (route: TRoute) => {
    console.log(route, 'handleClickLink');
    const findFirstRoute = (routes: TRoute[]) => {
      const result = routes[0];
      if (!result.children) return result;
      return findFirstRoute(result.children);
    };
    if (!route.children || !route.children.length) return;
    const firstRoute = findFirstRoute(route.children);
    if (firstRoute.fullPath) {
      const parents = findOpenRoutes(firstRoute.fullPath, allRoutes);
      addOpenKeys(parents.map((v) => v.key));
      setActiveRoute({...firstRoute, parents});
    }
    navigate(firstRoute?.fullPath || '/');
  };

  if (!activeRoute?.parents?.length) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="flex-nowrap">
        {activeRoute?.parents?.map((v, index) => (
          <Fragment key={index}>
            {index === Number(activeRoute?.parents?.length) - 1 ? (
              <BreadcrumbItem>
                <BreadcrumbPage title={v.title} className="max-w-35 truncate">
                  {t(v.title!)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink title={v.title} className="max-w-35 truncate" onClick={() => handleClickLink(v)}>
                    {t(v.title!)}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
