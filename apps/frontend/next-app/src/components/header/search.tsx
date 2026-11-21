'use client';
import {
  Button,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  Kbd,
} from '@badnpm/ui';
import {ArrowRight, CornerDownLeft, Search as SearchIcon} from 'lucide-react';
import {useState} from 'react';
import {useHotkeys} from 'react-hotkeys-hook';
import {useTranslations} from 'next-intl';
import {shortcut} from '@workspace/utils';
import {ClientOnly} from '../client-only';
import {useRouter} from '@/i18n/navigation';

const SEARCH_ROUTES = [
  {href: '/', labelKey: 'home'},
  {href: '/portfolio', labelKey: 'portfolio'},
  {href: '/skill', labelKey: 'skill'},
  {href: '/showcase', labelKey: 'showcase'},
  {href: '/demo', labelKey: 'demo'},
] as const;

export default function Search() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('Navigation');
  const router = useRouter();
  const label = shortcut.getShortcutLabel('globalSearch');

  useHotkeys(
    shortcut.getHotkey('globalSearch'),
    (e) => {
      e.preventDefault();
      setOpen((currentOpen) => !currentOpen);
    },
    {
      // 即使焦点在 CommandInput 里，快捷键也能继续切换 open 状态
      enableOnFormTags: true,
      preventDefault: true,
    }
  );

  const handleCommandSelect = (href: (typeof SEARCH_ROUTES)[number]['href']) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <div className="flex items-center">
        <div className="hidden max-md:flex">
          <Button
            variant="ghost"
            className="size-11 p-0"
            aria-label={t('openSearch')}
            onClick={() => setOpen(true)}
          >
            <SearchIcon className="size-5" />
          </Button>
        </div>
        <div className="hidden md:flex">
          <Button
            onClick={() => setOpen(true)}
            variant="secondary"
            className="text-muted-foreground h-9 w-fit rounded-full px-3 "
          >
            <SearchIcon />
            <span className="hidden lg:block">{t('searchWebsite')}</span>
            <span className="hidden max-lg:block">{t('search')}</span>
           
            <CommandShortcut className="ml-6 rounded-md">
              <ClientOnly fallback={<Kbd className="bg-background">K</Kbd>}>
                <Kbd className="bg-background">{label}</Kbd>
              </ClientOnly>
            </CommandShortcut>
          </Button>
        </div>
      </div>
      <CommandDialog
        title={t('searchWebsite')}
        description={t('searchRoutes')}
        open={open}
        onOpenChange={setOpen}
        className="w-[min(92vw,720px)] max-w-none sm:w-[min(90vw,720px)] sm:max-w-5xl top-[15%]"
      >
        <Command>
          <CommandInput placeholder={t('searchWebsite')} className="relative inset-0" />
          <CommandList>
            <CommandEmpty>{t('noSearchResults')}</CommandEmpty>
            <CommandGroup heading={t('routes')}>
              {SEARCH_ROUTES.map((item) => (
                <CommandItem
                  key={item.href}
                  value={item.href}
                  keywords={[t(item.labelKey)]}
                  onSelect={() => handleCommandSelect(item.href)}
                >
                  <ArrowRight />
                  <span>{t(item.labelKey)}</span>
                  <CommandShortcut className="font-mono tracking-normal">{item.href}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="bg-muted flex gap-4 px-4 py-2 text-xs">
          <span className="flex items-center gap-2">
            <span className="flex gap-1" aria-hidden="true">
              <Kbd className="bg-background">↑</Kbd>
              <Kbd className="bg-background">↓</Kbd>
            </span>
            {t('navigateResults')}
          </span>
          <span className="flex items-center gap-2">
            <Kbd className="bg-background">
              <CornerDownLeft />
            </Kbd>
            {t('goToPage')}
          </span>
          <span className="flex items-center gap-2">
            <Kbd className="bg-background text-[0.6rem]">ESC</Kbd>
            {t('closeSearch')}
          </span>
        </div>
      </CommandDialog>
    </>
  );
}
