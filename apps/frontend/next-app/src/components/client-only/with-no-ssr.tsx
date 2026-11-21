'use client';

import dynamic from 'next/dynamic';
import type {ComponentType, ReactNode} from 'react';

type WithNoSsrOptions = {
  fallback?: ReactNode;
};

export function withNoSSR<TProps>(
  Component: ComponentType<TProps>,
  {fallback = null}: WithNoSsrOptions = {}
) {
  return dynamic<TProps>(() => Promise.resolve(Component), {
    ssr: false,
    loading: () => <>{fallback}</>,
  });
}
