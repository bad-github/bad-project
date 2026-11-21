import {Suspense, useRef, useState} from 'react';
import {Outlet, useLocation} from 'react-router';
import Cookies from 'js-cookie';

import {Loading} from '@badnpm/ui';
import {SidebarProvider} from '@badnpm/ui';
import useRefreshRouterStore from '@/store/refresh-router-store';
import useFullScreenStore from '@/store/full-screen-store';
import useTabStore from '@/store/tab-store';
import MainHeader from '../main-header';
import Menu from './menu';
import NavTab from '../nav-tab';

export default function RouteMenu() {
  const location = useLocation();
  const refreshKey = useRefreshRouterStore((state) => state.refreshKey);
  const [collapsed, setCollapsed] = useState(false);

  const isFull = useFullScreenStore((s) => s.isFull);
  const activeRoute = useTabStore((state) => state.activeRoute);
  const defaultOpen = Cookies.get('sidebar_state') !== 'false';
  const headerCls = isFull ? 'hidden' : '';
  const sidebarStyle: React.CSSProperties =
    collapsed || isFull ? {'--sidebar-width': 0, '--sidebar-width-icon': 0} : {};

  const fullScreenRef = useRef<HTMLDivElement | null>(null);

  console.log('RouteMenu render', activeRoute);

  return (
    <SidebarProvider style={sidebarStyle} defaultOpen={defaultOpen} className="h-full overflow-hidden">
      <Menu />
      <div className="flex min-w-0 flex-1 flex-col">
        {activeRoute ? (
          <>
            <MainHeader toggleSidebar={() => setCollapsed(!collapsed)} className={headerCls} />
            <NavTab fullScreenRef={fullScreenRef} />
            <div
              ref={fullScreenRef}
              className="full-child min-h-0 flex-1 overflow-auto"
              key={location.key + refreshKey}
            >
              {/* 提供路由组件的刷新功能 */}
              <Suspense fallback={<Loading text="RouteMenu Loading..." />}>
                <Outlet />
              </Suspense>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-1 items-center justify-center">
              <Loading
                type="page"
                text={<div className="text-primary animate-pulse text-xl font-bold">React Vite Admin</div>}
              />
            </div>
          </>
        )}
      </div>
    </SidebarProvider>
  );
}
