import {afterEach, expect, test, vi} from 'vitest';
import {Editor, type Extensions} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {TableKit} from '@tiptap/extension-table';
import {TaskList, TaskItem} from '@tiptap/extension-list';
import {TextSelection, type Transaction} from '@tiptap/pm/state';
import type {EditorView} from '@tiptap/pm/view';
import {replaceSuggestionQuery} from '../src/page/components/custom/suggestion/search';
import {
  canRunCommand,
  getSuggestionItems,
  matchesQuery,
  menuCommands,
  runMenuCommand,
} from '../src/page/components/custom/suggestion/menu-items';

afterEach(() => vi.restoreAllMocks());

const command = (id: string) => menuCommands.find((item) => item.id === id)!;

// 使用真实 schema、事务与命令，仅以内存状态代替 DOM view 的派发与焦点。
function createEditor(text: string, cursor: number, editable = true, extensions: Extensions = []) {
  const editor = new Editor({
    element: null,
    editable,
    extensions: [StarterKit, ...extensions],
    content: {type: 'doc', content: [{type: 'paragraph', content: [{type: 'text', text}]}]},
  });
  let state = editor.state;
  state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, cursor)));
  vi.spyOn(editor, 'state', 'get').mockImplementation(() => state);
  const view = {
    get state() {
      return state;
    },
    editable,
    hasFocus: () => true,
    dispatch: (tr: Transaction) => {
      state = state.apply(tr);
    },
  } as unknown as EditorView;
  vi.spyOn(editor, 'view', 'get').mockReturnValue(view);
  vi.spyOn(editor, 'isDestroyed', 'get').mockReturnValue(false);
  return editor;
}

test('支持中文、英文别名、分组和多个关键词搜索', () => {
  expect(matchesQuery(command('heading-2'), ' HEADING 2 ')).toBe(true);
  expect(matchesQuery(command('task-list'), '待办')).toBe(true);
  expect(matchesQuery(command('heading-3'), 'h3')).toBe(true);
  expect(matchesQuery(command('blockquote'), '引用与代码')).toBe(true);
  expect(matchesQuery(command('table'), '不存在的内容')).toBe(false);
  expect(matchesQuery(command('table'), '   ')).toBe(true);
});

test('能力检查不修改正文，并隐藏未注册的扩展', () => {
  const editor = createEditor('前文 !h2后文', 7);
  const range = {from: 4, to: 7};
  const before = editor.getJSON();
  const items = getSuggestionItems({editor, range, query: ''});
  const ids = items.map((item) => item.context!.id);
  expect(ids).toContain('heading-2');
  expect(ids).toContain('bullet-list');
  expect(ids).not.toContain('table');
  expect(ids).not.toContain('image');
  expect(ids).not.toContain('task-list');
  expect(editor.getJSON()).toEqual(before);
});

test('段落中间执行标题命令只删除触发文本，完整保留前后文', () => {
  const editor = createEditor('前文 !h2后文', 7);
  expect(runMenuCommand(command('heading-2'), editor, {from: 4, to: 7})).toBe(true);
  expect(editor.state.doc.firstChild?.type.name).toBe('heading');
  expect(editor.state.doc.firstChild?.attrs.level).toBe(2);
  expect(editor.state.doc.textContent).toBe('前文 后文');
});

test('选择无序列表会转换段落，并保留查询后的文字', () => {
  const editor = createEditor('!list正文', 6);
  expect(runMenuCommand(command('bullet-list'), editor, {from: 1, to: 6})).toBe(true);
  expect(editor.state.doc.firstChild?.type.name).toBe('bulletList');
  expect(editor.state.doc.textContent).toBe('正文');
});

test('文字格式命令保留后文，并作用于后续输入', () => {
  const editor = createEditor('!bold后文', 6);
  expect(runMenuCommand(command('bold'), editor, {from: 1, to: 6})).toBe(true);
  expect(editor.state.doc.textContent).toBe('后文');
  expect(editor.state.storedMarks?.some((mark) => mark.type.name === 'bold')).toBe(true);
});

test('注册任务与表格扩展后可执行对应命令，表格包含表头与 3 行 3 列', () => {
  const taskEditor = createEditor('!todo任务', 6, true, [TaskList, TaskItem]);
  expect(runMenuCommand(command('task-list'), taskEditor, {from: 1, to: 6})).toBe(true);
  expect(taskEditor.state.doc.firstChild?.type.name).toBe('taskList');
  expect(taskEditor.state.doc.textContent).toBe('任务');

  const tableEditor = createEditor('!table', 7, true, [TableKit]);
  expect(runMenuCommand(command('table'), tableEditor, {from: 1, to: 7})).toBe(true);
  const table = tableEditor.state.doc.firstChild!;
  expect(table.type.name).toBe('table');
  expect(table.childCount).toBe(3);
  expect(table.firstChild?.childCount).toBe(3);
  expect(table.firstChild?.firstChild?.type.name).toBe('tableHeader');
  expect(table.lastChild?.firstChild?.type.name).toBe('tableCell');
});

test('查询结果保持配置顺序，清空查询后恢复完整候选', () => {
  const editor = createEditor('!code正文', 6);
  const range = {from: 1, to: 6};
  const found = getSuggestionItems({editor, range, query: 'code'});
  expect(found.map((item) => item.context!.id)).toEqual(['code-block', 'inline-code']);
  const all = getSuggestionItems({editor, range, query: ''});
  expect(all.length).toBeGreaterThan(found.length);
  expect(all[0].context!.id).toBe('paragraph');
  expect(all[0].context!.active).toBe(true);
});

test('只读状态和过期范围不会执行命令或删除正文', () => {
  const editor = createEditor('!h2正文', 4, false);
  const before = editor.getJSON();
  expect(getSuggestionItems({editor, query: '', range: {from: 1, to: 4}})).toEqual([]);
  expect(runMenuCommand(command('heading-2'), editor, {from: 1, to: 4})).toBe(false);
  expect(editor.getJSON()).toEqual(before);
  const editableEditor = createEditor('!h2正文', 4);
  expect(canRunCommand(command('heading-2'), editableEditor, {from: -1, to: 4})).toBe(false);
  expect(canRunCommand(command('heading-2'), editableEditor, {from: 1, to: 100})).toBe(false);
});

test('搜索框替换和清空查询时保留触发字符与后文，随后正常执行命令', () => {
  const editor = createEditor('前文 !h2后文', 7);
  expect(replaceSuggestionQuery(editor, {from: 4, to: 7}, '!', '待办')).toBe(true);
  expect(editor.state.doc.textContent).toBe('前文 !待办后文');
  expect(replaceSuggestionQuery(editor, {from: 4, to: 7}, '!', '')).toBe(true);
  expect(editor.state.doc.textContent).toBe('前文 !后文');
  expect(editor.state.selection.from).toBe(5);
  expect(runMenuCommand(command('heading-2'), editor, {from: 4, to: 5})).toBe(true);
  expect(editor.state.doc.textContent).toBe('前文 后文');
});
