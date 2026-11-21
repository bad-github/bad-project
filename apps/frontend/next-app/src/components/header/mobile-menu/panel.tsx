'use client';

import MenuContent from './content';
import type {MenuSurfaceProps} from './types';

export default function PanelSurface({id, open, pathname, onNavigate}: MenuSurfaceProps) {
  return (
    <div
      id={id}
      className={`bg-background fixed inset-x-0 top-16 bottom-0 z-20 overflow-hidden md:hidden ${open ? 'block' : 'hidden'}`}
    >
      <MenuContent pathname={pathname} onNavigate={onNavigate} />
    </div>
  );
}
