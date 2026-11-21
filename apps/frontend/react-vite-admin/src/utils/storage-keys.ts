/** 后台应用的 localStorage 键统一使用应用前缀，与同源的其他工程隔离。 */
export const StorageKeys = {
  theme: 'react-vite-admin:theme',
  preference: 'react-vite-admin:preference',
  language: 'react-vite-admin:language',
  user: 'react-vite-admin:user',
  tabs: 'react-vite-admin:tabs',
  lastBuildTime: 'react-vite-admin:last-build-time',
  token: 'react-vite-admin:token',
  accessToken: 'react-vite-admin:access-token',
  refreshToken: 'react-vite-admin:refresh-token',
  supabaseAuth: 'react-vite-admin:supabase-auth',
  sharedSsePing: 'react-vite-admin:shared-sse-ping',
  flowDemo: 'react-vite-admin:demo:flow',
  externalStoreDemo: 'react-vite-admin:demo:external-store-token',
  memoryStore: 'react-vite-admin:memory-store',
} as const;
