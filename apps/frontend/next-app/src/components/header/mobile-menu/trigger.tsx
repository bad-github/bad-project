'use client';

import {forwardRef, type ComponentPropsWithoutRef} from 'react';
import {Button} from '@badnpm/ui';
import {useTranslations} from 'next-intl';

type MenuTriggerProps = ComponentPropsWithoutRef<'button'> & {
  open: boolean;
  panelId: string;
  onToggle?: () => void;
};

const MenuTrigger = forwardRef<HTMLButtonElement, MenuTriggerProps>(function MenuTrigger(
  {open, panelId, onToggle, onClick, ...buttonProps},
  ref,
) {
  const t = useTranslations('Navigation');

  return (
    <Button
      {...buttonProps}
      ref={ref}
      type="button"
      variant="ghost"
      aria-label={open ? t('closeMenu') : t('openMenu')}
      aria-controls={panelId}
      aria-expanded={open}
      className="relative flex size-11 items-center justify-center rounded-md bg-transparent! transition-colors"
      onClick={onToggle ?? onClick}
    >
      <span
        aria-hidden="true"
        className={`bg-foreground pointer-events-none absolute inset-0 m-auto h-[2px] w-5 rounded-full transition-all duration-200 ease-out ${
          open ? 'translate-y-0 rotate-45' : '-translate-y-1.5 rotate-0'
        }`}
      />
      <span
        aria-hidden="true"
        className={`bg-foreground pointer-events-none absolute inset-0 m-auto h-[2px] w-5 rounded-full transition-all duration-200 ease-out ${
          open ? 'translate-y-0 -rotate-45' : 'translate-y-1.5 rotate-0'
        }`}
      />
    </Button>
  );
});

export default MenuTrigger;
