import assert from 'node:assert/strict';
import {test} from 'vitest';
import {Extension, flattenExtensions, type Extensions} from '@tiptap/core';
import {StarterKit} from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import {createLowlight} from 'lowlight';
import {resolveEditorExtensions} from '../src/page/extensions/resolve-editor-extensions.ts';
import {SharedHighlight} from '../src/page/extensions/shared.ts';

// pnpm --filter @workspace/editor test
const names = (extensions: Extensions) => flattenExtensions(extensions).map((extension) => extension.name);

test('多个案例共用扩展；删除任一案例后剩余案例仍有完整依赖', () => {
  const groups = ['颜色按钮', '拖拽菜单', '表格'].map((source) => ({source, extensions: [SharedHighlight]}));
  for (let removed = -1; removed < groups.length; removed++) {
    const result = resolveEditorExtensions(groups.filter((_, index) => index !== removed));
    assert.deepEqual(names(result), ['highlight']);
    assert.equal(result[0].options.multicolor, true);
  }
});

test('不同实例的相同 configure 选项可以合并', () => {
  const result = resolveEditorExtensions([
    {source: 'A', extensions: [Heading.configure({levels: [1, 2]})]},
    {source: 'B', extensions: [Heading.configure({levels: [1, 2]})]},
  ]);
  assert.deepEqual(names(result), ['heading']);
});

test('同名不同配置报告扩展名和两个案例来源', () => {
  assert.throws(
    () =>
      resolveEditorExtensions([
        {source: '案例A', extensions: [Heading.configure({levels: [1]})]},
        {source: '案例B', extensions: [Heading.configure({levels: [2]})]},
      ]),
    /heading.*案例A.*案例B/
  );
});

test('同名同选项但不同扩展行为也必须报告冲突', () => {
  assert.throws(
    () =>
      resolveEditorExtensions([
        {source: 'A', extensions: [Extension.create({name: 'custom', onCreate() {}})]},
        {source: 'B', extensions: [Extension.create({name: 'custom', onCreate() {}})]},
      ]),
    /custom.*A.*B/
  );
});

test('StarterKit 默认值被案例替代；移除案例后默认值恢复，且与数组顺序无关', () => {
  const base = {source: 'StarterKit', extensions: [StarterKit], fallback: true};
  const custom = {source: '标题案例', extensions: [Heading.configure({levels: [1, 2]})]};
  for (const groups of [
    [base, custom],
    [custom, base],
  ]) {
    const result = resolveEditorExtensions(groups);
    assert.equal(names(result).filter((name) => name === 'heading').length, 1);
    assert.deepEqual(result.find((extension) => extension.name === 'heading')?.options.levels, [1, 2]);
  }
  const restored = resolveEditorExtensions([base]);
  assert.deepEqual(restored.find((extension) => extension.name === 'heading')?.options.levels, [1, 2, 3, 4, 5, 6]);
});

test('Lowlight 替代默认 codeBlock，其他 StarterKit 扩展继续保留', () => {
  const lowlight = CodeBlockLowlight.configure({lowlight: createLowlight()});
  const result = resolveEditorExtensions([
    {source: 'StarterKit', extensions: [StarterKit], fallback: true},
    {source: '代码块案例', extensions: [lowlight]},
  ]);
  assert.equal(
    result.find((extension) => extension.name === 'codeBlock'),
    lowlight
  );
  assert.ok(names(result).includes('paragraph'));
  assert.equal(new Set(names(result)).size, names(result).length);
});

test('嵌套集合被展开去重，Tiptap 再次展开时不会重复添加子扩展', () => {
  const child = Extension.create({name: 'child'});
  const inner = Extension.create({name: 'inner', addExtensions: () => [child]});
  const outer = Extension.create({name: 'outer', addExtensions: () => [inner]});
  const result = resolveEditorExtensions([
    {source: '集合案例', extensions: [outer]},
    {source: '独立案例', extensions: [child]},
  ]);
  assert.deepEqual(names(result), ['outer', 'inner', 'child']);
});
