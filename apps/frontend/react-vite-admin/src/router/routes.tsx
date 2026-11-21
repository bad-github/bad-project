import {redirect} from 'react-router';
import {
  ChartAreaIcon,
  CogIcon,
  HomeIcon,
  RouteIcon,
  Rows4Icon,
  UserIcon,
  WaypointsIcon,
  ComponentIcon,
  SparklesIcon,
  SquareFunction,
} from 'lucide-react';
import IconGitHub from '@/assets/svg/github.svg?react';
import type {TRoute} from './types';
import NotFound from '@/components/not-found';
import ErrorRoute from '@/components/route/error-route';
import BaseRoute from '@/components/route/base-route';
import RouteMenu from '@/components/route-menu';
import {RouterAction, RouterErrorBoundary, RouterLoader} from '@/page/router-api/config/component';
import {lazy, type ComponentType, type LazyExoticComponent} from 'react';

export function lazyWithDelay<T extends ComponentType<any>>(
  factory: () => Promise<{default: T}>,
  delay = 1000
): LazyExoticComponent<T> {
  delay = import.meta.env.DEV ? delay : 0;
  return lazy(() => Promise.all([factory(), new Promise((r) => setTimeout(r, delay))]).then(([module]) => module));
}

export const routes: TRoute[] = [
  {
    key: 'error-route',
    ErrorBoundary: ErrorRoute,
    Component: BaseRoute,
    children: [
      {
        path: '/',
        key: 'root-route',
        Component: RouteMenu,
        children: [
          // 父路由通过Outlet渲染，索引路由不能有子路由
          {
            index: true,
            key: 'dashboard-index',
            title: 'common.redirect',
            icon: <ChartAreaIcon />,
            loader: () => {
              /**
               * token:这儿只作同步操作，判断本地是否存在token
               * 校验用户是否合法
               *    (1)去顶层组件作（尽可能只在页面初始化时调用一次，不要在路由切换时调用），不合法跳转到登录页
               *    (2)任意页面的api若返回401，则跳转到登录页
               */
              return redirect('/dashboard');
            },
          },
          {
            path: 'dashboard',
            // 重定向路由需要fullPath
            fullPath: '/dashboard',
            key: 'dashboard',
            title: 'dashboard.dashboard',
            icon: <ChartAreaIcon />,
            Component: lazyWithDelay(() => import('@/page/dashboard')),
          },
          {
            path: 'system',
            key: 'system',
            title: 'system.system',
            icon: <CogIcon />,
            children: [
              {
                path: 'user',
                key: 'user',
                title: 'system.user',
                icon: <UserIcon />,
                // 默认取default导出，若是具名导出可以手动包一层
                // import('./MyComponent').then(module => ({
                //   default: module.MyComponent
                // }))
                Component: lazy(() => import('@/page/system/user')),
              },
            ],
          },
          {
            path: 'form',
            key: 'form',
            title: 'form.form',
            icon: <Rows4Icon />,
            children: [
              {path: 'basic', key: 'basic', title: 'form.basic', Component: lazy(() => import('@/page/form/basic'))},
              {
                path: 'advanced',
                key: 'advanced',
                title: 'form.advanced',
                Component: lazy(() => import('@/page/form/advanced')),
              },
              {
                path: 'dynamic',
                key: 'dynamic',
                title: 'form.dynamic',
                Component: lazy(() => import('@/page/form/dynamic')),
              },
              {path: 'tree', key: 'tree', title: 'form.tree', Component: lazy(() => import('@/page/form/tree'))},
            ],
          },
          {
            path: 'network',
            key: 'network',
            title: 'request.request',
            icon: <WaypointsIcon />,
            Component: lazy(() => import('@/page/network')),
            children: [
              {path: 'http', key: 'http', title: 'request.http', Component: lazy(() => import('@/page/network/http'))},
              {
                path: 'eventsource',
                key: 'eventsource',
                title: 'request.eventsource',
                Component: lazy(() => import('@/page/network/eventsource')),
              },
              {
                path: 'web-socket',
                key: 'web-socket',
                title: 'request.websocket',
                Component: lazy(() => import('@/page/network/websocket')),
              },
              {
                path: 'graphql',
                key: 'graphql',
                title: 'request.graphql',
                children: [
                  {
                    path: 'query',
                    key: 'query',
                    title: 'request.query',
                    Component: lazy(() => import('@/page/network/graphql/query')),
                  },
                  {
                    path: 'mutation',
                    key: 'mutation',
                    title: 'request.mutation',
                    Component: lazy(() => import('@/page/network/graphql/mutation')),
                  },
                  {
                    path: 'subscription',
                    key: 'subscription',
                    title: 'request.subscription',
                    children: [
                      {
                        path: 'full',
                        key: 'full',
                        title: 'request.fullSub',
                        Component: lazy(() => import('@/page/network/graphql/subscription/full')),
                      },
                      {
                        path: 'increment',
                        key: 'increment',
                        title: 'request.incrementSub',
                        Component: lazy(() => import('@/page/network/graphql/subscription/increment')),
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            path: 'react-api',
            key: 'react-api',
            title: 'react.reactApi',
            icon: <SquareFunction />,
            children: [
              {
                path: 'suspense',
                key: 'suspense',
                title: 'react.suspense',
                Component: lazy(() => import('@/page/react-api/suspense')),
              },
              {
                path: 'SyntheticEvent',
                key: 'SyntheticEvent',
                title: 'react.syntheticEvent',
                Component: lazy(() => import('@/page/react-api/synthetic-event')),
              },
              {
                path: 'use-deferred-value',
                key: 'use-deferred-value',
                title: 'react.useDeferredValue',
                Component: lazy(() => import('@/page/react-api/use-deferred-value')),
              },
              {
                path: 'use-sync-external-store',
                key: 'use-sync-external-store',
                title: 'react.useSyncExternalStore',
                Component: lazy(() => import('@/page/react-api/use-sync-external-store')),
              },
              {
                path: 'use-transition',
                key: 'use-transition',
                title: 'react.useTransition',
                Component: lazy(() => import('@/page/react-api/use-transition')),
              }
            ],
          },
          {
            path: 'feature-demo',
            key: 'feature-demo',
            title: 'feature.feature',
            icon: <SparklesIcon />,
            children: [
              {
                path: 'chunk-upload',
                key: 'chunk-upload',
                title: 'feature.chunkUpload',
                Component: lazy(() => import('@/page/feature-demo/chunk-upload')),
              },
              {
                path: 'web-worker',
                key: 'web-worker',
                title: 'feature.webWorker',
                Component: lazy(() => import('@/page/feature-demo/web-worker')),
              },
              {
                path: 'indexed-db',
                key: 'indexed-db',
                title: 'feature.indexedDb',
                Component: lazy(() => import('@/page/feature-demo/indexed-db')),
              },
              {
                path: 'dispatch-event',
                key: 'dispatch-event',
                title: 'feature.dispatchEvent',
                Component: lazy(() => import('@/page/feature-demo/dispatch-event')),
              },
              {
                path: 'producer-consumer',
                key: 'producer-consumer',
                title: 'feature.producerConsumer',
                Component: lazy(() => import('@/page/feature-demo/producer-consumer')),
              },
            ],
          },
          {
            path: 'open-source-lib',
            key: 'open-source-lib',
            title: 'lib.open-source-lib',
            icon: <IconGitHub />,
            children: [
              // 父路由通过Outlet渲染，索引路由不能有子路由
              {
                index: true,
                key: 'open-source-lib-index',
                title: 'common.redirect',
                loader: () => {
                  return redirect('@dnd-kit');
                },
              },
              {
                path: '@dnd-kit',
                key: '@dnd-kit',
                title: 'lib.@dnd-kit',
                Component: lazy(() => import('@/page/open-source-lib/dnd-kit')),
                children: [
                  {
                    index: true,
                    key: 'open-source-lib-@dnd-kit-index',
                    title: 'common.redirect',
                    loader: () => {
                      return redirect('drag');
                    },
                  },
                  {
                    path: 'drag',
                    key: 'drag',
                    title: 'lib.drag',
                    Component: lazy(() => import('@/page/open-source-lib/dnd-kit/drag')),
                  },
                  {
                    path: 'drop',
                    key: 'drop',
                    title: 'lib.drop',
                    Component: lazy(() => import('@/page/open-source-lib/dnd-kit/drop')),
                  },
                  {
                    path: 'sort',
                    key: 'sort',
                    title: 'lib.sort',
                    children: [
                      {
                        path: 'vertical',
                        key: 'vertical',
                        title: 'lib.vertical',
                        Component: lazy(() => import('@/page/open-source-lib/dnd-kit/sort/vertical')),
                      },
                      {
                        path: 'grid',
                        key: 'grid',
                        title: 'lib.grid',
                        Component: lazy(() => import('@/page/open-source-lib/dnd-kit/sort/grid')),
                      },
                      {
                        path: 'multiple-vertical',
                        key: 'multiple-vertical',
                        title: 'lib.multiple-vertical',
                        Component: lazy(() => import('@/page/open-source-lib/dnd-kit/sort/multiple-vertical')),
                      },
                    ],
                  },
                ],
              },
              {
                path: '@tanstack-react-table',
                key: '@tanstack/react-table',
                title: 'lib.@tanstack/react-table',
                children: [
                  {
                    path: 'basic',
                    key: 'table-basic',
                    title: 'ui.basic',
                    Component: lazy(() => import('@/page/open-source-lib/tanstack-table/basic')),
                  },
                  {
                    path: 'headerGroup',
                    key: 'headerGroup',
                    title: 'lib.headerGroup',
                    Component: lazy(() => import('@/page/open-source-lib/tanstack-table/header-group')),
                  },
                  {
                    path: 'column-filter',
                    key: 'column-filter',
                    title: 'lib.columnFilter',
                    Component: lazy(() => import('@/page/open-source-lib/tanstack-table/column-filter')),
                  },
                  {
                    path: 'multiple-feature',
                    key: 'multiple-feature',
                    title: 'lib.multipleFeature',
                    Component: lazy(() => import('@/page/open-source-lib/tanstack-table/multiple-feature')),
                  },
                ],
              },
              {
                path: '@uiw-react-codemirror',
                key: '@uiw/react-codemirror',
                title: 'lib.@uiw/react-codemirror',
                Component: lazy(() => import('@/page/open-source-lib/react-codemirror')),
              },
              // path不能包含/
              {
                path: '@xyflow-react',
                key: '@xyflow/react',
                title: 'lib.@xyflow/react',
                children: [
                  {
                    path: 'demo1',
                    key: 'demo1',
                    title: 'lib.demo1',
                    Component: lazy(() => import('@/page/open-source-lib/xy-flow/demo1')),
                  },
                  {
                    path: 'demo2',
                    key: 'demo2',
                    title: 'lib.demo2',
                    Component: lazy(() => import('@/page/open-source-lib/xy-flow/demo2')),
                  },
                  {
                    path: 'demo3',
                    key: 'demo3',
                    title: 'lib.demo3',
                    Component: lazy(() => import('@/page/open-source-lib/xy-flow/demo3')),
                  },
                ],
              },
              {
                path: 'css',
                key: 'tailwindcss',
                title: 'lib.tailwindcss',
                Component: lazy(() => import('@/page/open-source-lib/tailwindcss')),
              },
              {
                path: 'dockview',
                key: 'dockview',
                title: 'lib.dockview',
                Component: lazy(() => import('@/page/open-source-lib/dockview')),
              },
              {
                path: 'echarts',
                key: 'echarts',
                title: 'lib.echarts',
                children: [
                  {
                    path: 'line',
                    key: 'line',
                    title: 'lib.lineChart',
                    Component: lazy(() => import('@/page/open-source-lib/echarts/line')),
                  },
                  {
                    path: 'bar',
                    key: 'bar',
                    title: 'lib.barChart',
                    Component: lazy(() => import('@/page/open-source-lib/echarts/bar')),
                  },
                  {
                    path: 'pie',
                    key: 'pie',
                    title: 'lib.pieChart',
                    Component: lazy(() => import('@/page/open-source-lib/echarts/pie')),
                  },
                ],
              },
              // {
              //   path: 'lucide',
              //   key: 'lucide',
              //   title: 'lib.lucide',
              //   Component: lazy(() => import('@/page/open-source-lib/lucide')),
              // },
              {
                path: 'react-arborist',
                key: 'react-arborist',
                title: 'lib.react-arborist',
                Component: lazy(() => import('@/page/open-source-lib/react-arborist')),
              },
              {
                path: 'react-d3-tree',
                key: 'react-d3-tree',
                title: 'lib.react-d3-tree',
                Component: lazy(() => import('@/page/open-source-lib/d3-tree')),
              },
              {
                path: 'react-error-boundary',
                key: 'react-error-boundary',
                title: 'lib.reactErrorBoundary',
                Component: lazy(() => import('@/page/open-source-lib/react-error-boundary')),
              },
              {
                path: 'react-querybuilder',
                key: 'react-querybuilder',
                title: 'lib.reactQueryBuilder',
                Component: lazy(() => import('@/page/open-source-lib/react-querybuilder')),
              },
              {
                path: 'react-resizable-panels',
                key: 'react-resizable-panels',
                title: 'lib.reactResizablePanels',
                Component: lazy(() => import('@/page/open-source-lib/resizable-panel')),
              },
              {
                path: 'react-syntax-highlighter',
                key: 'react-syntax-highlighter',
                title: 'lib.reactSyntaxHighlighter',
                Component: lazy(() => import('@/page/open-source-lib/react-syntax-highlighter')),
              },
              {
                path: 'react-window',
                key: 'react-window',
                title: 'lib.react-window',
                children: [
                  {
                    path: 'fixed',
                    key: 'fixed',
                    title: 'lib.fixed',
                    Component: lazy(() => import('@/page/open-source-lib/react-window/fixed')),
                  },
                  {
                    path: 'variable',
                    key: 'variable',
                    title: 'lib.variable',
                    Component: lazy(() => import('@/page/open-source-lib/react-window/variable')),
                  },
                  {
                    path: 'grid',
                    key: 'grid',
                    title: 'lib.grid',
                    Component: lazy(() => import('@/page/open-source-lib/react-window/grid')),
                  },
                  {
                    path: 'infinite-fixed',
                    key: 'infinite-fixed',
                    title: 'lib.infinite-fixed',
                    Component: lazy(() => import('@/page/open-source-lib/react-window/infinite-fixed')),
                  },
                  {
                    path: 'infinite-scroll',
                    key: 'infinite-scroll',
                    title: 'lib.infinite-scroll',
                    Component: lazy(() => import('@/page/open-source-lib/react-window/infinite-scroll')),
                  },
                ],
              },
              {
                path: 'tiptap',
                key: 'tiptap',
                title: 'lib.tiptap',
                Component: lazy(() => import('@/page/open-source-lib/tiptap')),
              },
              {
                path: 'zustand',
                key: 'zustand',
                title: 'lib.zustand',
                Component: lazy(() => import('@/page/open-source-lib/zustand')),
              },
            ],
          },
          {
            path: 'ui-component',
            key: 'ui-component',
            title: 'ui.ui-component',
            icon: <ComponentIcon />,
            children: [
              {
                path: 'pagination',
                key: 'pagination',
                title: 'ui.pagination',
                Component: lazy(() => import('@/page/ui/pagination')),
              },
              {
                path: 'loading',
                key: 'loading',
                title: 'ui.loading',
                Component: lazy(() => import('@/page/ui/loading')),
              },
              {path: 'empty', key: 'empty', title: 'ui.empty', Component: lazy(() => import('@/page/ui/empty'))},
              {
                path: 'tree-select',
                key: 'tree-select',
                title: 'ui.tree-select',
                Component: lazy(() => import('@/page/ui/tree-select')),
              },
              {path: 'dialog', key: 'dialog', title: 'ui.dialog', Component: lazy(() => import('@/page/ui/dialog'))},
              {path: 'sheet', key: 'sheet', title: 'ui.sheet', Component: lazy(() => import('@/page/ui/sheet'))},
            ],
          },
          {
            path: 'router',
            key: 'router',
            title: 'router.router',
            icon: <RouteIcon />,
            children: [
              {
                path: 'config',
                key: 'config',
                title: 'router.config',
                action: RouterAction,
                loader: RouterLoader,
                // 控制已有路由的 loader 是否重新执行，不影响首次进入时加载。
                // 下例取消 POST 提交后的重新校验，保留原有 loader 数据，action 仍正常执行。
                // 如果提交修改了 loader 对应的数据，应允许重新校验，以免展示旧数据。
                // 当前注释掉，保留默认的「action 完成后重新执行 loader」行为。
                // shouldRevalidate: ({formMethod, defaultShouldRevalidate}) => {
                //   if (formMethod?.toUpperCase() === 'POST') {
                //     return false;
                //   }
                //   return defaultShouldRevalidate; // 其他情况沿用 React Router 的默认判断。
                // },
                ErrorBoundary: RouterErrorBoundary,
                /**
                 * lazy作用
                 * 独立 chunk（打包成单独的文件），只有访问路由才加载，减少首屏体积。
                 */
                lazy: () => import('@/page/router-api/config').then((m) => ({Component: m.default})),
              },
              {
                path: 'block',
                key: 'block',
                title: 'router.block',
                lazy: () => import('@/page/router-api/block').then((m) => ({Component: m.default})),
              },
            ],
          },
          // {
          //   path: 'menu',
          //   key: 'menu',
          //   title: '示例菜单1超长超长超长超长超长超长超长超长',
          //   icon: <HomeIcon />,
          //   element: (
          //     <div>
          //       示例菜单1
          //       <Outlet />
          //     </div>
          //   ),
          //   children: [
          //     {
          //       path: 'menu-1',
          //       key: 'menu-1',
          //       title: '菜单1-1超长超长超长超长超长超长超长',
          //       icon: <HomeIcon />,
          //       element: (
          //         <div>
          //           示例菜单1-1
          //           <Outlet />
          //         </div>
          //       ),
          //       children: [
          //         {path: 'menu-1-1', key: 'menu-1-1', title: '菜单1-1-1', element: <div>示例菜单1-1-1</div>},
          //         {path: 'menu-1-2', key: 'menu-1-2', title: '菜单1-1-2', element: <div>示例菜单1-1-2</div>},
          //       ],
          //     },
          //     {path: 'menu-2', key: 'menu-2', title: '菜单1-2', icon: <HomeIcon />, element: <div>示例菜单1-2</div>},
          //   ],
          // },
        ],
      },
    ],
  },
  {
    path: '/sign-in',
    key: 'sign-in',
    title: 'sign in',
    icon: <HomeIcon />,
    Component: lazy(() => import('@/page/sign/sign-in')),
  },
  {
    path: '/sign-up',
    key: 'sign-up',
    title: 'sign up',
    icon: <HomeIcon />,
    Component: lazy(() => import('@/page/sign/sign-up')),
  },
  {
    path: '/forget-password',
    key: 'forget-password',
    title: 'forget password',
    icon: <HomeIcon />,
    Component: lazy(() => import('@/page/sign/forget-password')),
  },
  {
    path: '/reset-password',
    key: 'reset-password',
    title: 'reset password',
    icon: <HomeIcon />,
    Component: lazy(() => import('@/page/sign/reset-password')),
  },
  {
    path: '/update-password',
    key: 'update-password',
    title: 'update password',
    icon: <HomeIcon />,
    Component: lazy(() => import('@/page/sign/update-password')),
  },
  {
    path: '*', // 通配符路由必须放最后
    key: '404',
    title: 'NotFound',
    Component: NotFound,
  },
];
