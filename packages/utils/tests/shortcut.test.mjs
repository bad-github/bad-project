import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ShortcutProvider} from '../src/shortcut.ts';

function withNavigator(navigator, callback) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  if (navigator === undefined) delete globalThis.navigator;
  else Object.defineProperty(globalThis, 'navigator', {configurable: true, value: navigator});
  try {
    callback();
  } finally {
    if (original) Object.defineProperty(globalThis, 'navigator', original);
    else delete globalThis.navigator;
  }
}

test('Windows, Linux, unknown platforms and SSR all have usable Ctrl shortcuts', () => {
  for (const navigator of [
    {platform: 'Win32'},
    {platform: 'Linux x86_64'},
    {platform: 'Unknown'},
    {platform: '', userAgent: 'Windows NT 10.0'},
    undefined,
  ]) {
    withNavigator(navigator, () => {
      const shortcuts = new ShortcutProvider();
      assert.equal(shortcuts.getHotkey('globalSearch'), 'ctrl+k');
      assert.equal(shortcuts.getShortcutLabel('globalSearch'), 'Ctrl+K');
      assert.equal(shortcuts.getHotkey('save'), 'ctrl+s');
      assert.equal(shortcuts.getHotkey('signOut'), 'ctrl+shift+e');
    });
  }
});

test('Apple platforms keep Meta shortcuts; display replacement handles repeated and mixed-case modifiers', () => {
  for (const platform of ['MacIntel', 'iPad', 'iPhone']) {
    withNavigator({platform}, () => {
      const shortcuts = new ShortcutProvider();
      assert.equal(shortcuts.getHotkey('globalSearch'), 'meta+k');
      assert.equal(shortcuts.getShortcutLabel('globalSearch'), '⌘K');
      assert.equal(shortcuts.replaceShortcutLabel('META+SHIFT+ALT+meta+k'), '⌘ ⇧ ⌥ ⌘ k');
    });
  }
});
