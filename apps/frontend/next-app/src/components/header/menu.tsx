'use client';

import {useTranslations} from 'next-intl';
import {MENU_ITEMS} from './menu-items';
import {cn} from '@badnpm/ui';
import {Link, usePathname} from '@/i18n/navigation';

export default function Menu() {
  const pathname = usePathname();
  const t = useTranslations('Navigation');

  return (
    <div className="hidden gap-6 md:flex">
      {MENU_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? 'page' : undefined}
          className={cn(pathname === item.href ? 'text-foreground' : 'text-muted-foreground', 'whitespace-nowrap', 'font-bold')}
        >
          {t(item.labelKey)}
        </Link>
      ))}
    </div>
  );
}
