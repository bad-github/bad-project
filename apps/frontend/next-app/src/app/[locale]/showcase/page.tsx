import {useTranslations} from 'next-intl';

export default function ShowcasePage() {
  const t = useTranslations('Showcase');

  return (
    <section aria-labelledby="showcase-heading" className="mx-auto w-full max-w-7xl">
      <h1 id="showcase-heading" className="text-2xl font-semibold">
        {t('title')}
      </h1>
      <p className="text-muted-foreground mt-3">{t('description')}</p>
    </section>
  );
}
