'use client';

import type {ReactNode} from 'react';
import {ClientOnly} from '../client-only';
import {ThemeSwitch} from './index';

type ThemeSwitchMountedProps = {
  fallback?: ReactNode;
};

export default function ThemeSwitchMounted({fallback = null}: ThemeSwitchMountedProps) {
  return (
    <ClientOnly fallback={fallback}>
      <ThemeSwitch />
    </ClientOnly>
  );
}
