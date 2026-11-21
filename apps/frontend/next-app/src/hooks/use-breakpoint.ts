'use client';

import {useMemo, useSyncExternalStore} from 'react';

export const BREAKPOINTS = {
  sm: 40 * 16, // 640px
  md: 48 * 16, // 768px，< 768px是手机
  lg: 64 * 16, // 1024px，768px–1023px是平板
  xl: 80 * 16, // 1280px，>1024px是电脑
  '2xl': 96 * 16, // 1536px
} as const;

export type Breakpoint = 'base' | keyof typeof BREAKPOINTS;

export type BreakpointState = {
  breakpoint: Breakpoint;
  isSmUp: boolean;
  isMdUp: boolean;
  isLgUp: boolean;
  isXlUp: boolean;
  is2XlUp: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
};

const QUERY_LIST = [
  ['sm', `(min-width: ${BREAKPOINTS.sm}px)`],
  ['md', `(min-width: ${BREAKPOINTS.md}px)`],
  ['lg', `(min-width: ${BREAKPOINTS.lg}px)`],
  ['xl', `(min-width: ${BREAKPOINTS.xl}px)`],
  ['2xl', `(min-width: ${BREAKPOINTS['2xl']}px)`],
] as const;

function getBreakpointFromWidth(width: number): Breakpoint {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'base';
}

function getStateFromWidth(width: number): BreakpointState {
  const breakpoint = getBreakpointFromWidth(width);
  const isSmUp = width >= BREAKPOINTS.sm;
  const isMdUp = width >= BREAKPOINTS.md;
  const isLgUp = width >= BREAKPOINTS.lg;
  const isXlUp = width >= BREAKPOINTS.xl;
  const is2XlUp = width >= BREAKPOINTS['2xl'];

  return {
    breakpoint,
    isSmUp,
    isMdUp,
    isLgUp,
    isXlUp,
    is2XlUp,
    isMobile: !isMdUp,
    isTablet: isMdUp && !isLgUp,
    isDesktop: isLgUp,
  };
}

function subscribe(onStoreChange: () => void) {
  const cleanups = QUERY_LIST.map(([, query]) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener('change', onStoreChange);
    return () => mediaQuery.removeEventListener('change', onStoreChange);
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

function getSnapshot() {
  return window.innerWidth;
}

// SSR 和客户端水合首帧使用同一快照，避免根据真实屏宽渲染出不同的 DOM。
// 水合完成后，useSyncExternalStore 会自动读取客户端快照并订阅断点变化。
function getServerSnapshot() {
  return 0;
}

export function useBreakpoint() {
  const width = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(() => getStateFromWidth(width), [width]);
}
