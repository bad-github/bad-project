'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@badnpm/ui';
import {Languages} from 'lucide-react';
import {hasLocale, useLocale, useTranslations} from 'next-intl';
import {useTransition} from 'react';

import {languageLabelKeys} from '@/i18n/locale-labels';
import {usePathname, useRouter} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Common');
  const [isPending, startTransition] = useTransition();

  function handleLocaleChange(nextLocale: string) {
    // 切换前验证回调值属于受支持的语言。
    if (!hasLocale(routing.locales, nextLocale) || nextLocale === locale) {
      return;
    }

    // 保持当前站内路径，仅替换 URL 中的语言前缀。
    startTransition(() => {
      router.replace(pathname, {locale: nextLocale});
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label={t('selectLanguage')}
            title={t('selectLanguage')}
          />
        }
      >
        <Languages />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={locale} onValueChange={handleLocaleChange}>
          {/* 单选菜单项默认不关闭，语言选择完成后需要显式关闭菜单。 */}
          {routing.locales.map((item) => (
            <DropdownMenuRadioItem key={item} value={item} closeOnClick>
              {t(languageLabelKeys[item])}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
