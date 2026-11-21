'use client';

import {hasLocale, useLocale, useTranslations} from 'next-intl';
import {useTransition} from 'react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@badnpm/ui';

import {usePathname, useRouter} from '@/i18n/navigation';
import {languageLabelKeys} from '@/i18n/locale-labels';
import {routing} from '@/i18n/routing';

export default function LocaleSwitcherSelect() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const items = routing.locales.map((value) => ({value, label: t(languageLabelKeys[value])}));

  function handleLocaleChange(nextLocale: string | null) {
    // Base UI Select 支持空值，切换前校验语言并跳过当前选项。
    if (nextLocale === null || !hasLocale(routing.locales, nextLocale) || nextLocale === locale) {
      return;
    }

    // 国际化 router 会保留当前站内路径，只替换 URL 中的语言前缀。
    startTransition(() => {
      router.replace(pathname, {locale: nextLocale});
    });
  }

  return (
    <Select items={items} disabled={isPending} value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger aria-label={t('selectLanguage')} className="bg-area h-9 rounded-full border-0 px-3">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="p-1">
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
