import {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link, useLocation} from 'react-router';
import {ChevronRightIcon, ListChevronsDownUp, ListChevronsUpDown} from 'lucide-react';
import {useQuery} from '@tanstack/react-query';
import {useShallow} from 'zustand/shallow';

import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  toast,
  Skeleton,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from '@badnpm/ui';
import IconKitty from '@/assets/svg/hello-kitty-color.svg?react';
import type {TRoute} from '@/router/types';
import useTabStore from '@/store/tab-store';
import {getRoutes} from '@/request/route';
import {stripRouteRuntimeFields, findOpenRoutes} from './tool';
import Dropdown from './dropdown';
import {tree} from '@workspace/utils';

export default function Menu() {
  const {t} = useTranslation();
  const {state} = useSidebar();
  const {pathname} = useLocation();
  const {tabs, activeRoute, addTab, openKeys, allRoutes, setActiveRoute, setOpenKeys, setAllRoutes} = useTabStore(
    useShallow((state) => ({
      tabs: state.tabs,
      activeRoute: state.activeRoute,
      openKeys: state.openKeys,
      allRoutes: state.allRoutes,
      addTab: state.addTab,
      setActiveRoute: state.setActiveRoute,
      setOpenKeys: state.setOpenKeys,
      setAllRoutes: state.setAllRoutes,
    }))
  );
  const [isExpandAll, setIsExpandAll] = useState(false);

  const {isLoading, data, isSuccess, isError, error, isRefetching} = useQuery({
    queryKey: ['dynamicRoutes'],
    queryFn: getRoutes,
  });
  useEffect(() => {
    if (!isRefetching) return;
    // 此时数据还是有的，只是使用的上一次的。这个就是表示正在刷新缓存数据
    toast.add({title: t('common.refresh')});
  }, [isRefetching]);

  const initActiveTab = (path: string, routes: TRoute[]) => {
    if (!path) return;
    const openRoutes = findOpenRoutes(path, routes);
    if (!openRoutes.length) return;
    setOpenKeys(Array.from(new Set([...openKeys, ...openRoutes.map((v) => v.key)])));
    if (!tabs.length || !activeRoute || activeRoute.fullPath !== path) {
      const openRoute = openRoutes[openRoutes.length - 1];
      // 面包屑功能需要当前路由的所有上级菜单，如果没有面包屑功能，就不需要寻找openRoutes
      const tmp = {...openRoute, parents: openRoutes};
      addTab(tmp);
      setActiveRoute(tmp);
    }
  };
  useEffect(() => {
    if (isSuccess && data) {
      const result = stripRouteRuntimeFields(data as TRoute[]);
      console.log('初始化路由数据', result);
      setAllRoutes(result);
      // 只作初始化逻辑
      initActiveTab(pathname, result);
    }
  }, [isSuccess, data]);

  // 考虑浏览器前进后退及手动改变url
  useEffect(() => {
    if (pathname) {
      initActiveTab(pathname, allRoutes);
    }
  }, [pathname]);

  useEffect(() => {
    if (isError) {
      console.error(error?.message);
    }
  }, [isError]);

  const handleClickLink = useCallback(
    (route: TRoute) => {
      if (!route.fullPath) return;
      const tab = {...route, parents: findOpenRoutes(route.fullPath, allRoutes)};
      addTab(tab);
      setActiveRoute(tab);
    },
    [allRoutes, addTab, setActiveRoute]
  );

  const handleExpandAll = () => {
    setIsExpandAll((pre) => {
      setOpenKeys(pre ? [] : tree.findExpandKeys(allRoutes, {uniqueKey: 'key', childrenKey: 'children'}));
      return !pre;
    });
  };

  const buildMenus = (menus: TRoute[], parent?: TRoute) => {
    const buildMenuItem = (menu: TRoute) => {
      return (
        <>
          {menu.icon && menu.icon}
          <span className="truncate">{t(menu.title!)}</span>
        </>
      );
    };
    return menus.map((v) => {
      const fullParentPath = parent?.fullPath || '';
      // index: 重定向路由
      const fullPath = v.index ? fullParentPath : `${fullParentPath}/${v.path}`.replace(/\/+/g, '/');
      v.fullPath = fullPath;
      return (
        <Collapsible
          key={v.key}
          open={openKeys.includes(v.key)}
          onOpenChange={(open) => {
            setOpenKeys(open ? [...openKeys, v.key] : openKeys.filter((key) => key !== v.key));
          }}
        >
          {v.children?.length ? (
            <>
              <SidebarMenuItem>
                {state === 'collapsed' ? (
                  <Dropdown menu={v} handleClickLink={handleClickLink} />
                ) : (
                  // 有子菜单的导航是没有路由跳转的
                  <CollapsibleTrigger
                    render={<SidebarMenuButton className="h-9" tooltip={t(v.title!)} title={t(v.title!)} />}
                  >
                    {buildMenuItem(v)}
                    <ChevronRightIcon
                      className={cn(
                        'ml-auto transition-transform duration-200',
                        openKeys.includes(v.key) && 'rotate-90'
                      )}
                    />
                  </CollapsibleTrigger>
                )}
              </SidebarMenuItem>
              <CollapsibleContent className="CollapsibleContent">
                <SidebarMenuSub className="mr-0 overflow-x-hidden pr-0">{buildMenus(v.children, v)}</SidebarMenuSub>
              </CollapsibleContent>
            </>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-9"
                tooltip={t(v.title!)}
                title={t(v.title!)}
                isActive={pathname === v.fullPath}
                render={<Link to={v.fullPath || '/'} onClick={() => handleClickLink(v)} />}
              >
                {buildMenuItem(v)}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </Collapsible>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="hidden w-64 space-y-4 overflow-hidden border-r px-4 py-8 md:block">
        {Array.from({length: 8}).map((_, i) => (
          <Skeleton key={i} className="h-16 flex-shrink-0" />
        ))}
      </div>
    );
  }
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu className="overflow-hidden">
          <SidebarMenuItem>
            <SidebarMenuButton
              className="hover:bg-transparent focus:bg-transparent active:bg-transparent"
              render={<Link to="/" aria-label="Back to home" />}
            >
              <IconKitty
                className={cn('size-7! rounded-full transition-all', state === 'collapsed' && '-translate-x-1')}
              />
              <h1 className="truncate text-lg font-semibold">Hello Kitty</h1>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">{buildMenus(allRoutes)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="mx-0" />
      <SidebarFooter className="overflow-hidden py-2">
        <SidebarMenu className="overflow-hidden">
          <SidebarMenuItem className="flex justify-between">
            <SidebarTrigger title="切换侧边栏" />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-md"
              title={isExpandAll ? '收起所有菜单' : '展开所有菜单'}
              onClick={handleExpandAll}
            >
              {isExpandAll ? <ListChevronsDownUp className="size-4" /> : <ListChevronsUpDown className="size-4" />}
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
