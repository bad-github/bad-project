import {Button} from '@badnpm/ui';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';

export default function NotFound() {
  // Status 是翻译命名空间，对应各语言 index.ts 中的 Status: status；可以改名，但定义和调用必须同步。
  const t = useTranslations('Status');

  return (
    <main className="bg-background text-foreground mx-auto flex max-w-3xl items-center px-6 py-16">
      <section className="border-border/60 bg-card w-full rounded-3xl border p-8 shadow-lg">
        <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">{t('notFound.title')}</h1>
        <p className="text-muted-foreground mt-4 max-w-xl text-base leading-7">{t('notFound.description')}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button render={<Link href="/" />} nativeButton={false}>
            {t('notFound.goHome')}
          </Button>
        </div>

        <div className="bg-muted/40 mt-10 grid gap-3 rounded-2xl p-4 text-sm">
          <div className="font-medium">{t('notFound.suggestionTitle')}</div>
          <div>{t('notFound.checkUrl')}</div>
          <div>{t('notFound.goHomeSuggestion')}</div>
        </div>
      </section>
    </main>
  );
}
