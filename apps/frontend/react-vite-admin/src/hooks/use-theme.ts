import {useTheme as useUiTheme} from '@badnpm/ui';
import {useSyncExternalStore} from 'react';

const colorSchemeQuery = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(colorSchemeQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia(colorSchemeQuery).matches ? 'dark' : 'light';
}

function getServerTheme(): undefined {
  return undefined;
}

/** 新库提供主题选择，应用补充图表、编辑器所需的实际亮暗色，并跟随系统变化。 */
export function useTheme() {
  const context = useUiTheme();
  const systemTheme = useSyncExternalStore(subscribe, getSystemTheme, getServerTheme);

  return {
    ...context,
    resolvedTheme: context.theme === 'system' ? systemTheme : context.theme,
  };
}
