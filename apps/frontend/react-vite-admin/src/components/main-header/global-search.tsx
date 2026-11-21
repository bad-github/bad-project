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
  cn,
} from '@badnpm/ui';
import useTabStore from '@/store/tab-store';
import {buildRouteSearchItems, filterRouteSearchItems} from './route-search';

export default function GlobalSearch({compact = false, className}: {
  /**
   * 是否使用紧凑触发按钮，默认 false。
   * true：仅显示搜索图标；false：显示图标、搜索文字和快捷键。
   * 只影响触发按钮的外观，不影响搜索弹窗和键盘快捷键。
   */
  compact?: boolean;
  /** 合并到搜索触发 Button，可覆盖默认样式；不影响弹窗。 */
  className?: string;
}) {
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
      <Button
        variant="secondary"
        aria-label={t('search.title')}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t('search.title')}
        onClick={() => handleOpenChange(true)}
        className={cn(
          compact
            ? 'text-muted-foreground size-8 shrink-0 rounded-md p-0'
            : 'text-muted-foreground h-8 w-full min-w-0 justify-start rounded-md px-2',
          className
        )}
      >
        <SearchIcon className="shrink-0" />
        {!compact && (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{t('search.searchRoutes')}</span>
            <Kbd className="bg-background shrink-0">{shortcutLabel}</Kbd>
          </>
        )}
      </Button>
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
