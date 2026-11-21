'use client';

import {useTranslations} from 'next-intl';
import LocaleSwitcher from '@/components/locale-switcher';
import {Link} from '@/i18n/navigation';

import ThemeSwitchClient from '../../theme-switch/client';
import {MENU_ITEMS} from '../menu-items';
import type {MenuSurfaceProps} from './types';

type MenuContentProps = Pick<MenuSurfaceProps, 'pathname' | 'onNavigate'>;

export default function MenuContent({pathname, onNavigate, compact = false}: MenuContentProps & {compact?: boolean}) {
  const t = useTranslations('Navigation');

  return (
    <div
      className={`mx-auto flex min-h-0 w-full max-w-7xl flex-col ${
        compact ? 'max-h-[min(70dvh,var(--available-height))]' : 'h-full'
      }`}
    >
      <div className="px-fluid-sm-lg flex shrink-0 items-center justify-end gap-2 border-b py-4">
        <LocaleSwitcher />
        <ThemeSwitchClient />
      </div>
      <nav className="px-fluid-sm-lg flex min-h-0 flex-1 flex-col items-start gap-1 overflow-y-auto overscroll-contain pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? 'page' : undefined}
            className="text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground inline-flex min-h-9 shrink-0 items-center text-base font-medium transition-colors"
            onClick={onNavigate}
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
