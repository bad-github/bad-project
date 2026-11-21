'use client';

import {useEffect, useId, useRef, useState} from 'react';
import {Popover, PopoverTrigger} from '@badnpm/ui';
import {useLocale} from 'next-intl';
import {useBreakpoint} from '@/hooks';
import {usePathname} from '@/i18n/navigation';

import PanelSurface from './panel';
import PopoverSurface from './popover';
import MenuTrigger from './trigger';
import type {MobileMenuVariant} from './types';

export type {MobileMenuVariant} from './types';

type MobileMenuProps = {
  variant: MobileMenuVariant;
};

export default function MobileMenu({variant}: MobileMenuProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const {isMdUp} = useBreakpoint();

  // 卸载和 key 变化会重置菜单状态，无需在 Effect 中同步关闭。
  if (isMdUp) return null;

  return <MobileMenuContent key={`${pathname}:${locale}:${variant}`} variant={variant} pathname={pathname} />;
}

function MobileMenuContent({variant, pathname}: MobileMenuProps & {pathname: string}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || variant === 'popover') return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (event.target instanceof Element && event.target.closest('[data-slot="dropdown-menu-content"]')) return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    const handleFocusChange = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (containerRef.current?.contains(target)) return;
      // 语言选择器的选项渲染在 Portal 中，仍属于导航面板的交互。
      if (target.closest('[data-slot="dropdown-menu-content"]')) return;
      setOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('focusin', handleFocusChange);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('focusin', handleFocusChange);
    };
  }, [open, variant]);

  return (
    <div ref={containerRef}>
      {variant === 'popover' ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger render={<MenuTrigger ref={triggerRef} open={open} panelId={panelId} />} />
          <PopoverSurface
            id={panelId}
            open={open}
            pathname={pathname}
            onNavigate={() => setOpen(false)}
            onDismiss={() => setOpen(false)}
          />
        </Popover>
      ) : (
        <>
          <MenuTrigger
            ref={triggerRef}
            open={open}
            panelId={panelId}
            onToggle={() => setOpen((current) => !current)}
          />
          <PanelSurface
            id={panelId}
            open={open}
            pathname={pathname}
            onNavigate={() => setOpen(false)}
            onDismiss={() => setOpen(false)}
          />
        </>
      )}
    </div>
  );
}
