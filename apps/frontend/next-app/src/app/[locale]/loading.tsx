import {LoadingPage} from '@badnpm/ui';
import {useTranslations} from 'next-intl';

export default function Loading() {
  // Status 是翻译命名空间，对应各语言 index.ts 中的 Status: status；可以改名，但定义和调用必须同步。
  const t = useTranslations('Status');

  return (
    <div className="mt-16 flex justify-center">
      <div className="text-muted-foreground inline-flex flex-col items-center gap-2 text-xs" role="status" aria-live="polite">
        <LoadingPage />
        <span>{t('loading')}</span>
      </div>
    </div>
  );
}
