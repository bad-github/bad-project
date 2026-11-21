import {afterEach, expect, test, vi} from 'vitest';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import {ThemeProvider, getCurTheme, useTheme} from '../src/provider/theme-provider';

afterEach(() => vi.unstubAllGlobals());

function ThemeValue() {
  const {theme} = useTheme();
  return <span>{theme}</span>;
}

const rootWithClass = (className: string) => ({
  classList: {contains: (value: string) => value === className},
}) as unknown as HTMLElement;

test('无 window/document 时可导入并服务端渲染主题模块', () => {
  expect(typeof window).toBe('undefined');
  expect(renderToString(<ThemeProvider><ThemeValue /></ThemeProvider>)).toBe('<span>system</span>');
  expect(renderToString(<ThemeProvider defaultTheme="dark"><ThemeValue /></ThemeProvider>)).toBe('<span>dark</span>');
  expect(getCurTheme(rootWithClass('dark'), 'theme')).toBe('system');
});

test('首次 render 不读取浏览器存储，避免服务端与客户端初始主题不同', () => {
  const getItem = vi.fn(() => 'dark');
  vi.stubGlobal('window', {localStorage: {getItem}});
  const markup = renderToString(createElement(ThemeProvider, {
    defaultRootElement: rootWithClass('light'),
    children: <ThemeValue />,
  }));
  expect(markup).toBe('<span>system</span>');
  expect(getItem).not.toHaveBeenCalled();
});

test('使用标准 getItem 读取有效的已保存主题', () => {
  const getItem = vi.fn(() => 'dark');
  vi.stubGlobal('window', {localStorage: {getItem}});
  expect(getCurTheme(rootWithClass('light'), 'editor-theme')).toBe('dark');
  expect(getItem).toHaveBeenCalledWith('editor-theme');
});

test('存储被禁用时回退到根元素主题，不抛出异常', () => {
  const browser = Object.defineProperty({}, 'localStorage', {
    get() {throw new Error('Storage blocked');},
  });
  vi.stubGlobal('window', browser);
  expect(getCurTheme(rootWithClass('dark'), 'theme')).toBe('dark');
});

test('无有效存储或根元素主题时，使用系统偏好；未指定根元素时保持 system', () => {
  vi.stubGlobal('window', {
    localStorage: {getItem: () => 'invalid'},
    matchMedia: () => ({matches: true}),
  });
  expect(getCurTheme(rootWithClass(''), 'theme')).toBe('dark');
  expect(getCurTheme(rootWithClass('light'), 'theme')).toBe('light');
  expect(getCurTheme(undefined, 'theme')).toBe('system');
});
