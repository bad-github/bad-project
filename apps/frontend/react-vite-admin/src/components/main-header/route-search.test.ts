import {describe, expect, test} from 'vitest';
import type {TRoute} from '@/router/types';
import {buildRouteSearchItems, filterRouteSearchItems} from './route-search';

const routes: TRoute[] = [
  {
    key: 'react-api',
    path: 'react-api',
    title: 'react.api',
    children: [
      {key: 'transition', path: 'use-transition', title: 'react.transition', fullPath: '/stale-path'},
      {key: 'deferred', path: 'use-deferred-value', title: 'react.deferred'},
    ],
  },
  {
    key: 'system',
    path: 'system',
    title: 'system.title',
    children: [{key: 'user', path: 'user', title: 'system.user'}],
  },
];

const labels: Record<string, string> = {
  'react.api': 'React API',
  'react.transition': '过渡更新',
  'react.deferred': '延迟值',
  'system.title': '系统管理',
  'system.user': '用户管理',
};
const translate = (key: string) => labels[key] ?? key;

describe('路由搜索', () => {
  test('独立计算叶子路径和菜单层级，不使用旧 fullPath，也不修改原路由', () => {
    const before = structuredClone(routes);
    const items = buildRouteSearchItems(routes, translate);

    expect(items.map(({path, title, breadcrumb}) => ({path, title, breadcrumb}))).toEqual([
      {path: '/react-api/use-transition', title: '过渡更新', breadcrumb: 'React API'},
      {path: '/react-api/use-deferred-value', title: '延迟值', breadcrumb: 'React API'},
      {path: '/system/user', title: '用户管理', breadcrumb: '系统管理'},
    ]);
    expect(routes).toEqual(before);
  });

  test('按名称、父级名称、翻译键和路径匹配，忽略大小写和首尾空格，支持多个关键词', () => {
    const items = buildRouteSearchItems(routes, translate);
    expect(filterRouteSearchItems(items, '   ')).toEqual(items);
    expect(filterRouteSearchItems(items, '过渡')[0]?.path).toBe('/react-api/use-transition');
    expect(filterRouteSearchItems(items, 'REACT API')).toHaveLength(2);
    expect(filterRouteSearchItems(items, '系统管理 用户')[0]?.path).toBe('/system/user');
    expect(filterRouteSearchItems(items, 'react.deferred')[0]?.path).toBe('/react-api/use-deferred-value');
    expect(filterRouteSearchItems(items, ' /REACT-API/USE-TRANSITION ')[0]?.title).toBe('过渡更新');
    expect(filterRouteSearchItems(items, '不存在')).toEqual([]);
  });

  test('排除索引重定向、目录、参数路由、通配符和外链，处理无路径布局、绝对路径和重复目标', () => {
    const items = buildRouteSearchItems(
      [
        {key: 'index', index: true, title: '重定向'},
        {key: 'dynamic', path: 'users/:id', title: '用户详情'},
        {key: 'optional', path: 'users/:id?', title: '可选用户'},
        {key: 'wildcard', path: '*', title: '未找到'},
        {key: 'external', path: 'https://example.com', title: '外链'},
        {key: 'external-relative', path: '//example.com', title: '外链'},
        {key: 'untitled', path: 'untitled'},
        {
          key: 'layout',
          children: [
            {
              key: 'parent',
              path: 'parent',
              title: '目录',
              children: [{key: 'absolute', path: '/absolute', title: '绝对路径'}],
            },
          ],
        },
        {key: 'duplicate', path: 'absolute/', title: '重复路径'},
      ],
      (key) => key
    );
    expect(items.map(({path, breadcrumb}) => ({path, breadcrumb}))).toEqual([{path: '/absolute', breadcrumb: '目录'}]);
  });

  test('切换翻译后重新生成匹配文本，空路由列表安全返回空结果', () => {
    const items = buildRouteSearchItems(routes, (key) => (key === 'system.user' ? 'Users' : key));
    expect(filterRouteSearchItems(items, 'users')[0]?.path).toBe('/system/user');
    expect(filterRouteSearchItems(items, '用户管理')).toEqual([]);
    expect(filterRouteSearchItems(buildRouteSearchItems([], translate), 'anything')).toEqual([]);
  });
});
