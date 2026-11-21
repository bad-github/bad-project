import Image from 'next/image';
import LocaleSwitcher from '@/components/locale-switcher';
import {Link} from '@/i18n/navigation';
import ThemeSwitchClient from '../theme-switch/client';
import Menu from './menu';
import MobileMenu from './mobile-menu';
import Search from './search';

export default function Header() {
  return (
    <header className="bg-background px-fluid-sm-lg sticky top-0 z-10 h-16 w-full border-b md:h-18">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-6 lg:gap-12">
          <Link href="/" className="flex shrink-0 items-end">
            <Image
              className="size-8 object-contain md:size-10 dark:invert"
              src="/kitty.png"
              alt="Kitty logo"
              width={32}
              height={32}
              priority
            />
          </Link>
          <Menu />
        </div>
        <div className="flex shrink-0 items-center gap-1 md:gap-3">
          <Search />
          <div className="hidden items-center gap-3 md:flex">
            <LocaleSwitcher />
            <ThemeSwitchClient />
          </div>
          <div className="flex items-center md:hidden">
            <MobileMenu variant="panel" />
          </div>
        </div>
      </div>
    </header>
  );
}
