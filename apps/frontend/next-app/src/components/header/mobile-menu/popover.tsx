'use client';

import {PopoverContent} from '@badnpm/ui';

import MenuContent from './content';
import type {MenuSurfaceProps} from './types';

export default function PopoverSurface({id, pathname, onNavigate}: MenuSurfaceProps) {
  return (
    <PopoverContent
      id={id}
      side="bottom"
      align="end"
      sideOffset={12}
      className="w-[min(90vw,320px)] overflow-hidden p-0 md:hidden"
    >
      <MenuContent pathname={pathname} onNavigate={onNavigate} compact />
    </PopoverContent>
  );
}
