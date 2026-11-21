import {StorageKeys} from '../utils/storage-keys';
import type {TRoute} from '@/router/types';
import {LS} from '@/utils/storage';
import {toast} from '@badnpm/ui';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

const labels = [
  'Tab',
  'Settings',
  'Profile',
  'My Dashboard',
  'Notifications',
  'Really Long Tab Label',
  'Short',
  'Theme Options',
  'Quick Access',
  'Reports',
  'Data View',
  'Admin Panel',
  'User Management',
  'Logs',
  'Billing Info',
  'Documentation',
  'System Settings',
  'Help',
  'Security',
  'Team',
];

// @ts-expect-error description
const _mockTabs = Array.from({length: 20}, (_, i) => {
  const label = `Tab ${i + 1} - ${labels[(i + 1) % labels.length]}`;
  return {title: label, key: i} as unknown as any;
});

// parents: 当前路由的所有父级路由，包含自己。（提供面包屑功能）
export type Tab = TRoute & {isPin?: boolean; parents?: Tab[]};

type State = {
  tabs: Tab[];
  activeRoute: Tab | null; // 即使没有tab这个功能，也要设置它
  openKeys: string[];
  allRoutes: TRoute[];
  tabsMap: Map<string, any>;
};

type Action = {
  addTab: (tab: Tab) => void;
  removeTab: (tab: Tab) => void;
  setActiveRoute: (tab: Tab | null) => void;
  updateTabPin: (tab: Tab) => void;
  setTabs: (tabs: Tab[]) => void;
  setOpenKeys: (keys: string[]) => void;
  addOpenKeys: (keys: string[]) => void;
  setAllRoutes: (routes: TRoute[]) => void;
  setTabsMap: (tabsMap: Map<string, any>) => void;
};

const initialState: State = {
  tabs: [],
  activeRoute: null,
  openKeys: [],
  allRoutes: [],
  tabsMap: new Map(),
};

/**
 * 若使用context那么左侧菜单也要包裹provider，于是选择使用store
 */
const useTabStore = create<State & Action>()(
  persist(
    (set, get) => ({
      ...initialState,
      // 使用get()拿到总state
      addTab: (tab) => {
        if (get().tabs.find((v) => v.key === tab.key)) return;
        delete tab.icon;
        set((state) => ({tabs: [...state.tabs, tab]}));
      },
      // 或者使用set的函数形式拿到总state
      /* addTab: (tab) => set((state) => {
        const tabs = [...state.tabs];
        if (tabs.find(v => v.key === tab.key)) return {tabs};
        delete tab.icon;
        return {tabs: [...tabs, tab]};
      }), */
      removeTab: (tab) => {
        const index = get().tabs.findIndex((v) => v.key === tab.key);
        if (index === -1) return;
        set((state) => ({tabs: [...state.tabs.slice(0, index), ...state.tabs.slice(index + 1)]}));
      },
      setActiveRoute: (tab) => {
        if (get().activeRoute?.key === tab?.key) return;
        delete tab?.icon;
        set({activeRoute: tab});
      },
      updateTabPin: (tab) => {
        const index = get().tabs.findIndex((v) => v.key === tab.key);
        if (index === -1) return;
        set((state) => {
          const tabs = [...state.tabs];
          tabs.splice(index, 1);
          if (tab.isPin) {
            tabs.unshift(tab);
          } else {
            const firstNotPin = tabs.findIndex((v) => !v.isPin);
            if (firstNotPin === -1) {
              // 放到末尾
              tabs.push(tab);
            } else {
              // 放到非Pin第一个
              tabs.splice(firstNotPin, 0, tab);
            }
          }
          return {tabs};
        });
      },
      setTabs: (tabs) => set({tabs}),
      setOpenKeys: (keys) => set({openKeys: keys}),
      addOpenKeys: (keys) => set((state) => ({openKeys: [...state.openKeys, ...keys]})),
      setAllRoutes: (routes) => set({allRoutes: routes}),
      setTabsMap: (tabsMap) => set({tabsMap}),
    }),
    {
      name: StorageKeys.tabs, // localStorage key
      version: 1, // 在重新发布版本后修改，可以避免使用错误的storage
      migrate(_persistedState, _version) {}, // 只有在version变化时才执行
      partialize(state) {
        // 只持久化以下值
        return {
          tabs: state.tabs,
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('注水出错:', error);
          return;
        }
        const lastBuildTime = LS.get(StorageKeys.lastBuildTime);
        try {
          // 不能用可选链操作符，否则会提示process is not defined
          if (import.meta.env.PROD && process.env.APP_BUILD_TIME && lastBuildTime !== process.env.APP_BUILD_TIME) {
            // alert('检测到新版本，执行强力清理...');
            toast.add({title: '检测到新版本，执行强力清理...', type: 'warning'});
            // 只能访问对应process定义的完整变量名，在打包时会被替换成具体变量
            console.warn('检测到新版本，执行强力清理...', process.env.APP_BUILD_TIME, lastBuildTime);
            LS.clear();
            LS.set(StorageKeys.lastBuildTime, process.env.APP_BUILD_TIME);
            // window.location.reload();
          }
          console.log('[tab-store] 持久化数据回填完成');
        } catch (err) {
          console.error('Error Zustand:', err);
        }
      },
      // 持久化默认是JSON序列化，其他数据类型需要转换
      storage: createJSONStorage(() => localStorage, {
        // JSON.stringify序列化时，如何转为JSON字符串
        replacer: (_key, value) => {
          // 还可以通过_key限制具体的属性
          if (value instanceof Map) {
            return {
              __type: 'Map',
              value: [...value.entries()],
            };
          }
          if (value instanceof Set) {
            return {
              __type: 'Set',
              value: Array.from(value),
            };
          }
          // 如果返回 undefined，该属性会被忽略，即不会被持久化
          if (_key.startsWith('_')) return undefined;
          return value;
        },
        // JSON.parse反序列化时，如何转为JSON对象
        reviver: (_key, value: any) => {
          // 根据数据类型
          if (value?.__type === 'Map') {
            return new Map(value.value);
          }
          if (value?.__type === 'Set') {
            return new Set(value.value);
          }
          return value;
        },
      }),
    }
  )
);

export default useTabStore;
