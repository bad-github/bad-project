import type {ShortcutKey, ShortcutAction, ShortcutPlatform} from './types';
const shortcuts = {
  signOut: {
    mac: ['⌘+⇧+e', 'meta+shift+e'],
    windows: ['Ctrl+⇧+e', 'ctrl+shift+e'],
  },
  save: {
    mac: ['⌘S', 'meta+s'],
    windows: ['Ctrl+S', 'ctrl+s'],
  },
  globalSearch: {
    mac: ['⌘K', 'meta+k'],
    windows: ['Ctrl+K', 'ctrl+k'],
  },
} satisfies Record<ShortcutAction, ShortcutKey>;

/**
 * meta: '⌘' | 'Ctrl'
 * alt: '⌥' | 'Alt'
 *
 */
export class ShortcutProvider {
  // 非 Apple 平台统一使用 Ctrl，SSR 和未知平台也有可用的默认值。
  private platform: ShortcutPlatform = 'windows';

  constructor() {
    if (typeof navigator === 'undefined') return;
    const ua = (navigator.platform || navigator.userAgent || '').toLowerCase();
    if (ua.includes('mac') || ua.includes('ipad') || ua.includes('iphone')) {
      this.platform = 'mac';
    }
  }

  /** 获取用于 UI 展示的快捷键文本 */
  getShortcutLabel(action: ShortcutAction): string {
    const keys = shortcuts[action];
    if (!keys) throw new Error(`Shortcut not defined: ${action}`);
    return keys[this.platform][0];
  }

  // 通过快捷键替换获取展示的UI文本
  replaceShortcutLabel(shortcut: string) {
    const isMac = this.platform === 'mac';
    return shortcut
      .replace(/\bmeta\b/gi, isMac ? '⌘' : 'Ctrl')
      .replace(/\bshift\b/gi, isMac ? '⇧' : 'Shift')
      .replace(/\balt\b/gi, isMac ? '⌥' : 'Alt')
      .replace(/\+/g, ' ');
  }

  /** 获取 react-hotkeys-hook 监听用的组合键 */
  getHotkey(action: ShortcutAction): string {
    const keys = shortcuts[action];
    if (!keys) throw new Error(`Shortcut not defined: ${action}`);
    return keys[this.platform][1];
  }
}

export const shortcut = new ShortcutProvider();
