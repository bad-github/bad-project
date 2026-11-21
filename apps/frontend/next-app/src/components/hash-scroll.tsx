'use client';

import {useHashScroll} from '@/hooks';

// 封装为客户端组件，不一定所有地方都直接使用hook
export default function HashScroll() {
  useHashScroll();
  return null;
}
