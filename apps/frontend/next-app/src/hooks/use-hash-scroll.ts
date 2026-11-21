'use client';

import {useEffect} from 'react';

function scrollToHash() {
  const hash = window.location.hash.slice(1);

  if (!hash) {
    return;
  }

  const id = decodeURIComponent(hash);
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  // 让浏览器在布局稳定后再滚动，避免刷新时被恢复位置覆盖。
  requestAnimationFrame(() => {
    element.scrollIntoView({block: 'start'});
  });
}

export function useHashScroll() {
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;

    // 这页只需要 hash 定位，不需要浏览器自动恢复旧滚动位置。
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    scrollToHash();
    window.addEventListener('load', scrollToHash);
    window.addEventListener('hashchange', scrollToHash);

    return () => {
      window.removeEventListener('load', scrollToHash);
      window.removeEventListener('hashchange', scrollToHash);

      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, []);
}
