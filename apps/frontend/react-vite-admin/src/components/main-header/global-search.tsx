import {ArrowRightIcon, CornerDownLeft, SearchIcon} from 'lucide-react';
import {useMemo, useState} from 'react';
import {useHotkeys} from 'react-hotkeys-hook';
import {useTranslation} from 'react-i18next';
import {useLocation, useNavigate} from 'react-router';
import {shortcut} from '@workspace/utils';

import {
  Button,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  Kbd,
  BadEmpty,
} from '@badnpm/ui';
import useTabStore from '@/store/tab-store';
import {buildRouteSearchItems, filterRouteSearchItems} from './route-search';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const routes = useTabStore((state) => state.allRoutes);
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {pathname} = useLocation();
  const items = useMemo(() => buildRouteSearchItems(routes, (key) => t(key)), [routes, t]);
  const results = useMemo(() => filterRouteSearchItems(items, query), [items, query]);
  const shortcutLabel = shortcut.getShortcutLabel('globalSearch');

  useHotkeys(
    shortcut.getHotkey('globalSearch'),
    () => {
      setQuery('');
      setOpen((currentOpen) => !currentOpen);
    },
    {enableOnFormTags: true, preventDefault: true}
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    setQuery('');
  }

  function handleSelect(path: string) {
    handleOpenChange(false);
    // 菜单已有 pathname 监听，统一同步 Tab、面包屑和侧栏展开状态。
    if (path !== pathname) navigate(path);
  }

  return (
    <>
      <div className="flex shrink-0 items-center">
        <Button
          variant="ghost"
          aria-label={t('search.title')}
          aria-haspopup="dialog"
          aria-expanded={open}
          title={t('search.title')}
          onClick={() => handleOpenChange(true)}
          className="size-7 rounded-md p-0 @min-[48rem]/main-header:hidden"
        >
          <SearchIcon />
        </Button>
        <Button
          variant="secondary"
          aria-label={t('search.title')}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => handleOpenChange(true)}
          className="text-muted-foreground hidden h-8 w-fit rounded-md px-3 @min-[48rem]/main-header:inline-flex"
        >
          <SearchIcon />
          <span className="@min-[64rem]/main-header:hidden">{t('search.search')}</span>
          <span className="hidden pr-12 @min-[64rem]/main-header:inline">{t('search.searchRoutes')}</span>
          <CommandShortcut className="ml-6 rounded-md">
            <Kbd className="bg-background">{shortcutLabel}</Kbd>
          </CommandShortcut>
        </Button>
      </div>
      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={t('search.title')}
        description={t('search.description')}
        className="top-[15%] w-[min(92vw,720px)] max-w-none gap-0 sm:w-[min(90vw,720px)] sm:max-w-5xl"
      >
        <Command
          aria-label={t('search.title')}
          shouldFilter={false}
          className="@container/route-search gap-2 p-3 [&_[data-slot=command-input-wrapper]]:p-0"
        >
          <CommandInput
            aria-label={t('search.inputLabel')}
            placeholder={t('search.placeholder')}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[min(18rem,45dvh)] min-h-40">
            <CommandEmpty>
              <BadEmpty text={items.length === 0 ? t('search.noPages') : t('search.noResults')} />
            </CommandEmpty>
            {results.map((item) => (
              <CommandItem
                key={item.path}
                value={item.path}
                onSelect={() => handleSelect(item.path)}
                className="h-9 gap-3 px-3 py-0"
                title={`${item.breadcrumb ? `${item.breadcrumb} / ` : ''}${item.title} · ${item.path}`}
              >
                <ArrowRightIcon className="text-muted-foreground" />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="max-w-[60%] shrink-0 truncate font-medium">{item.title}</span>
                  {item.breadcrumb && (
                    <>
                      <span aria-hidden="true" className="text-muted-foreground/50 shrink-0">
                        /
                      </span>
                      <span className="text-muted-foreground truncate text-xs">{item.breadcrumb}</span>
                    </>
                  )}
                </div>
                <CommandShortcut className="hidden max-w-[45%] truncate font-mono text-xs tracking-normal @min-[32rem]/route-search:block">
                  {item.path}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
        <div className="bg-muted/40 text-muted-foreground flex items-center gap-4 border-t px-4 py-2 text-xs">
          <span className="flex items-center gap-2">
            <span className="flex gap-1" aria-hidden="true">
              <Kbd className="bg-background">↑</Kbd>
              <Kbd className="bg-background">↓</Kbd>
            </span>
            {t('search.navigateResults')}
          </span>
          <span className="flex items-center gap-2">
            <Kbd className="bg-background">
              <CornerDownLeft />
            </Kbd>
            {t('search.goToPage')}
          </span>
          <span className="flex items-center gap-2">
            <Kbd className="bg-background text-[0.6rem]">ESC</Kbd>
            {t('common.close')}
          </span>
        </div>
      </CommandDialog>
    </>
  );
}
