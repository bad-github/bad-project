'use client';

import {Button} from '@badnpm/ui';
import {useTranslations} from 'next-intl';
import {useEffect} from 'react';

/**
 * error.tsx 必须是客户端组件。它捕获同层 page.tsx 及其子树中的渲染错误，但不会捕获同层 layout.tsx 的错误
 */

export default function Error({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  // Status 是翻译命名空间，对应各语言 index.ts 中的 Status: status；可以改名，但定义和调用必须同步。
  const t = useTranslations('Status');
  const retry = unstable_retry ?? reset;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col pt-2 gap-2 justify-center items-center">
      <div className="text-center">{t('error.title')}</div>
      <Button variant="destructive" onClick={() => retry?.()}>
        {t('error.retry')}
      </Button>
    </div>
  );
}
