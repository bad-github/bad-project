import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {useMutationObserver} from '../hooks/use-mutation-observer';

const Themes = ['light', 'dark', 'system'] as const;
type Theme = (typeof Themes)[number];

type ThemeProviderProps = {
  children: React.ReactNode;
  themeKey?: string;
  defaultTheme?: Theme;
  defaultRootElement?: HTMLElement;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  rootElement: HTMLElement | undefined;
  setRootElement: React.Dispatch<React.SetStateAction<HTMLElement | undefined>>;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  rootElement: undefined,
  setRootElement: () => null
};

const ThemeContext = createContext<ThemeProviderState>(initialState);

function getMediaQuery() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return null;
  }
  return window.matchMedia('(prefers-color-scheme: dark)');
}

export function getCurTheme(rootElement: HTMLElement | undefined, themeKey: string): Theme {
  if (!rootElement || typeof window === 'undefined') return 'system';
  try {
    const storedTheme = window.localStorage.getItem(themeKey);
    if (Themes.includes(storedTheme as Theme)) return storedTheme as Theme;
  } catch {
    // 浏览器可能禁用存储，继续使用根元素或系统主题。
  }
  const rootClassList = rootElement.classList;
  const systemTheme = getMediaQuery()?.matches ? 'dark' : 'light';
  const isDark = rootClassList.contains('dark');
  const isLight = rootClassList.contains('light');
  return isDark ? 'dark' : isLight ? 'light' : systemTheme;
}

export function changeTheme(element: HTMLElement, theme: Theme) {
  if (!element || !element.classList || !theme) return;
  element.classList.remove('light', 'dark');
  if (theme === 'system') {
    const systemTheme = getMediaQuery()?.matches ? 'dark' : 'light';
    element.classList.add(systemTheme);
    return;
  }
  element.classList.add(theme);
}

export function ThemeProvider(props: ThemeProviderProps) {
  const {
    children,
    defaultTheme,
    defaultRootElement, // window.document.documentElement，不要给默认，否则其他系统引入此包时会修改html上的class
    themeKey = 'tiptap-theme',
    ...restProps
  } = props;
  // 考虑到此库作为lib被其他项目使用，主题范围应该限制
  const [rootElement, setRootElement] = useState<HTMLElement | undefined>(() => defaultRootElement);
  // 服务端与客户端首次 render 使用相同值，浏览器状态挂载后再读取。
  const [theme, setTheme] = useState<Theme>(() => defaultTheme || 'system');

  useEffect(() => {
    if (defaultTheme || rootElement) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(defaultTheme || getCurTheme(rootElement, themeKey));
    }
  }, [defaultTheme, rootElement, themeKey]);

  useEffect(() => {
    if (!rootElement) return;
    changeTheme(rootElement, theme);
  }, [theme]);

  useEffect(() => {
    if (!rootElement) return;
    changeTheme(rootElement, theme);
    return () => {
      // 清理旧root
      rootElement?.classList.remove('light', 'dark');
    };
  }, [rootElement]);

  // 被动监听：处理主应用或外部修改 class 的情况
  useMutationObserver(
    (mutations) => {
      // 遍历所有变动
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          const isDark = target.classList.contains('dark');
          const isLight = target.classList.contains('light');
          // 改成未知的值则使用light兜底
          const nextTheme = isDark ? 'dark' : isLight ? 'light' : 'light';
          // 函数式更新, todo，本就是light属性，然后乱改class
          setTheme((prev) => (prev !== nextTheme ? nextTheme : prev));
        }
      }
    },
    rootElement ?? null,
    {
      attributes: true,
      attributeFilter: ['class'], // 仅监听 class 变化
    }
  );

  const value = useMemo(() => {
    return {
      theme,
      setTheme,
      rootElement,
      setRootElement,
    };
  }, [theme, setTheme, rootElement, setRootElement]);

  return (
    <ThemeContext.Provider {...restProps} value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
