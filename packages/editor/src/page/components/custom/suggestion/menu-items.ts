import type {ChainedCommands, Editor, Range} from '@tiptap/core';
import type {SuggestionItem} from '../../../../components/tiptap-ui-utils/suggestion-menu/suggestion-menu-types';
import {matchesSuggestionQuery} from '../../../../components/tiptap-ui-utils/suggestion-menu/suggestion-menu-utils';
import {TypeIcon} from '../../../../components/tiptap-icons/type-icon';
import {HeadingOneIcon} from '../../../../components/tiptap-icons/heading-one-icon';
import {HeadingTwoIcon} from '../../../../components/tiptap-icons/heading-two-icon';
import {HeadingThreeIcon} from '../../../../components/tiptap-icons/heading-three-icon';
import {HeadingFourIcon} from '../../../../components/tiptap-icons/heading-four-icon';
import {HeadingFiveIcon} from '../../../../components/tiptap-icons/heading-five-icon';
import {HeadingSixIcon} from '../../../../components/tiptap-icons/heading-six-icon';
import {ListIcon} from '../../../../components/tiptap-icons/list-icon';
import {ListOrderedIcon} from '../../../../components/tiptap-icons/list-ordered-icon';
import {ListTodoIcon} from '../../../../components/tiptap-icons/list-todo-icon';
import {BlockquoteIcon} from '../../../../components/tiptap-icons/blockquote-icon';
import {CodeBlockIcon} from '../../../../components/tiptap-icons/code-block-icon';
import {MinusIcon} from '../../../../components/tiptap-icons/minus-icon';
import {CornerDownLeftIcon} from '../../../../components/tiptap-icons/corner-down-left-icon';
import {TableIcon} from '../../../../components/tiptap-icons/table-icon';
import {ListIndentedIcon} from '../../../../components/tiptap-icons/list-indented-icon';
import {ImagePlusIcon} from '../../../../components/tiptap-icons/image-plus-icon';
import {SmilePlusIcon} from '../../../../components/tiptap-icons/smile-plus-icon';
import {AtSignIcon} from '../../../../components/tiptap-icons/at-sign-icon';
import {BoldIcon} from '../../../../components/tiptap-icons/bold-icon';
import {ItalicIcon} from '../../../../components/tiptap-icons/italic-icon';
import {UnderlineIcon} from '../../../../components/tiptap-icons/underline-icon';
import {StrikeIcon} from '../../../../components/tiptap-icons/strike-icon';
import {Code2Icon} from '../../../../components/tiptap-icons/code2-icon';
import {SuperscriptIcon} from '../../../../components/tiptap-icons/superscript-icon';
import {SubscriptIcon} from '../../../../components/tiptap-icons/subscript-icon';
import {HighlighterIcon} from '../../../../components/tiptap-icons/highlighter-icon';
import {AlignLeftIcon} from '../../../../components/tiptap-icons/align-left-icon';
import {AlignCenterIcon} from '../../../../components/tiptap-icons/align-center-icon';
import {AlignRightIcon} from '../../../../components/tiptap-icons/align-right-icon';
import {AlignJustifyIcon} from '../../../../components/tiptap-icons/align-justify-icon';
import {BanIcon} from '../../../../components/tiptap-icons/ban-icon';

export type MenuContext = {id: string; active?: boolean};

type MenuCommand = {
  id: string;
  title: string;
  subtext: string;
  group: string;
  badge: SuggestionItem['badge'];
  keywords: string[];
  requires: string[];
  apply: (chain: ChainedCommands) => ChainedCommands;
  isActive?: (editor: Editor) => boolean;
};

const headingIcons = [
  HeadingOneIcon,
  HeadingTwoIcon,
  HeadingThreeIcon,
  HeadingFourIcon,
  HeadingFiveIcon,
  HeadingSixIcon,
];

// 分组顺序即展示顺序；仅配置当前编辑器已有扩展，新增条目无需修改渲染组件。
export const menuCommands: MenuCommand[] = [
  {
    id: 'paragraph',
    group: '文本',
    title: '正文',
    subtext: '切换为普通段落',
    badge: TypeIcon,
    keywords: ['paragraph', 'text', 'p', '段落'],
    requires: ['paragraph'],
    apply: (chain) => chain.clearNodes(),
    isActive: (editor) => editor.isActive('paragraph'),
  },
  ...([1, 2, 3, 4, 5, 6] as const).map((level): MenuCommand => ({
    id: `heading-${level}`,
    group: '文本',
    title: `${level} 级标题`,
    subtext: ['文档主标题', '章节标题', '小节标题', '细分主题', '次级主题', '最小层级标题'][level - 1],
    badge: headingIcons[level - 1],
    keywords: ['heading', `h${level}`, `heading ${level}`, `标题${level}`],
    requires: ['heading'],
    apply: (chain) => chain.setHeading({level}),
    isActive: (editor) => editor.isActive('heading', {level}),
  })),
  {
    id: 'bullet-list',
    group: '列表',
    title: '无序列表',
    subtext: '使用圆点组织并列内容',
    badge: ListIcon,
    keywords: ['bullet', 'unordered', 'ul', '项目符号'],
    requires: ['bulletList', 'listItem'],
    apply: (chain) => chain.toggleBulletList(),
    isActive: (editor) => editor.isActive('bulletList'),
  },
  {
    id: 'ordered-list',
    group: '列表',
    title: '有序列表',
    subtext: '使用编号组织步骤',
    badge: ListOrderedIcon,
    keywords: ['ordered', 'number', 'ol', '编号'],
    requires: ['orderedList', 'listItem'],
    apply: (chain) => chain.toggleOrderedList(),
    isActive: (editor) => editor.isActive('orderedList'),
  },
  {
    id: 'task-list',
    group: '列表',
    title: '任务列表',
    subtext: '添加可勾选的待办事项',
    badge: ListTodoIcon,
    keywords: ['task', 'todo', 'checkbox', '待办', '清单'],
    requires: ['taskList', 'taskItem'],
    apply: (chain) => chain.toggleTaskList(),
    isActive: (editor) => editor.isActive('taskList'),
  },
  {
    id: 'blockquote',
    group: '引用与代码',
    title: '引用',
    subtext: '突出引述或补充说明',
    badge: BlockquoteIcon,
    keywords: ['quote', 'blockquote'],
    requires: ['blockquote'],
    apply: (chain) => chain.toggleBlockquote(),
    isActive: (editor) => editor.isActive('blockquote'),
  },
  {
    id: 'code-block',
    group: '引用与代码',
    title: '代码块',
    subtext: '插入支持语法高亮的代码区域',
    badge: CodeBlockIcon,
    keywords: ['code', 'codeblock', 'snippet', '程序'],
    requires: ['codeBlock'],
    apply: (chain) => chain.toggleCodeBlock(),
    isActive: (editor) => editor.isActive('codeBlock'),
  },
  {
    id: 'horizontal-rule',
    group: '插入',
    title: '分隔线',
    subtext: '在内容之间添加水平分隔线',
    badge: MinusIcon,
    keywords: ['divider', 'horizontal', 'hr'],
    requires: ['horizontalRule'],
    apply: (chain) => chain.setHorizontalRule(),
  },
  {
    id: 'hard-break',
    group: '插入',
    title: '换行',
    subtext: '在当前段落内换行',
    badge: CornerDownLeftIcon,
    keywords: ['break', 'newline', 'br', '软换行'],
    requires: ['hardBreak'],
    apply: (chain) => chain.setHardBreak(),
  },
  {
    id: 'table',
    group: '插入',
    title: '表格',
    subtext: '插入 3 × 3 表格，包含表头',
    badge: TableIcon,
    keywords: ['table', 'grid', '行', '列'],
    requires: ['table', 'tableRow', 'tableHeader', 'tableCell'],
    apply: (chain) => chain.insertTable({rows: 3, cols: 3, withHeaderRow: true}),
  },
  {
    id: 'toc',
    group: '插入',
    title: '目录',
    subtext: '根据文档标题自动生成目录',
    badge: ListIndentedIcon,
    keywords: ['toc', 'contents', 'outline', '大纲'],
    requires: ['tocNode'],
    apply: (chain) => chain.insertTocNode(),
  },
  {
    id: 'image',
    group: '插入',
    title: '图片上传',
    subtext: '插入现有图片上传组件',
    badge: ImagePlusIcon,
    keywords: ['image', 'photo', 'upload', '照片'],
    requires: ['imageUpload'],
    apply: (chain) => chain.insertContent({type: 'imageUpload'}),
  },
  {
    id: 'emoji',
    group: '插入',
    title: '表情',
    subtext: '打开表情搜索菜单',
    badge: SmilePlusIcon,
    keywords: ['emoji', 'smile', '表情符号'],
    requires: ['emoji'],
    apply: (chain) => chain.insertContent(':'),
  },
  {
    id: 'mention',
    group: '插入',
    title: '提及',
    subtext: '打开 @ 提及菜单',
    badge: AtSignIcon,
    keywords: ['mention', 'at', '成员'],
    requires: ['mention'],
    apply: (chain) => chain.insertContent('@'),
  },
  {
    id: 'bold',
    group: '文字格式',
    title: '粗体',
    subtext: '切换后续输入的粗体格式',
    badge: BoldIcon,
    keywords: ['bold', 'strong', '加粗'],
    requires: ['bold'],
    apply: (chain) => chain.toggleBold(),
    isActive: (editor) => editor.isActive('bold'),
  },
  {
    id: 'italic',
    group: '文字格式',
    title: '斜体',
    subtext: '切换后续输入的斜体格式',
    badge: ItalicIcon,
    keywords: ['italic', 'em'],
    requires: ['italic'],
    apply: (chain) => chain.toggleItalic(),
    isActive: (editor) => editor.isActive('italic'),
  },
  {
    id: 'underline',
    group: '文字格式',
    title: '下划线',
    subtext: '切换后续输入的下划线',
    badge: UnderlineIcon,
    keywords: ['underline'],
    requires: ['underline'],
    apply: (chain) => chain.toggleUnderline(),
    isActive: (editor) => editor.isActive('underline'),
  },
  {
    id: 'strike',
    group: '文字格式',
    title: '删除线',
    subtext: '切换后续输入的删除线',
    badge: StrikeIcon,
    keywords: ['strike', 'strikethrough'],
    requires: ['strike'],
    apply: (chain) => chain.toggleStrike(),
    isActive: (editor) => editor.isActive('strike'),
  },
  {
    id: 'inline-code',
    group: '文字格式',
    title: '行内代码',
    subtext: '切换后续输入的行内代码格式',
    badge: Code2Icon,
    keywords: ['inline', 'code', '代码'],
    requires: ['code'],
    apply: (chain) => chain.toggleCode(),
    isActive: (editor) => editor.isActive('code'),
  },
  {
    id: 'highlight',
    group: '文字格式',
    title: '高亮',
    subtext: '切换后续输入的高亮标记',
    badge: HighlighterIcon,
    keywords: ['highlight', 'marker', '荧光'],
    requires: ['highlight'],
    apply: (chain) => chain.toggleHighlight(),
    isActive: (editor) => editor.isActive('highlight'),
  },
  {
    id: 'superscript',
    group: '文字格式',
    title: '上标',
    subtext: '切换后续输入的上标格式',
    badge: SuperscriptIcon,
    keywords: ['superscript', '指数'],
    requires: ['superscript'],
    apply: (chain) => chain.toggleSuperscript(),
    isActive: (editor) => editor.isActive('superscript'),
  },
  {
    id: 'subscript',
    group: '文字格式',
    title: '下标',
    subtext: '切换后续输入的下标格式',
    badge: SubscriptIcon,
    keywords: ['subscript', '化学'],
    requires: ['subscript'],
    apply: (chain) => chain.toggleSubscript(),
    isActive: (editor) => editor.isActive('subscript'),
  },
  ...(['left', 'center', 'right', 'justify'] as const).map((alignment, index): MenuCommand => ({
    id: `align-${alignment}`,
    group: '对齐与清理',
    title: ['左对齐', '居中对齐', '右对齐', '两端对齐'][index],
    subtext: '调整当前段落或标题的对齐方式',
    badge: [AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon][index],
    keywords: ['align', alignment, 'alignment'],
    requires: ['textAlign'],
    apply: (chain) => chain.setTextAlign(alignment),
    isActive: (editor) => editor.isActive({textAlign: alignment}),
  })),
  {
    id: 'clear-marks',
    group: '对齐与清理',
    title: '清除文字格式',
    subtext: '重置后续输入的文字格式',
    badge: BanIcon,
    keywords: ['clear', 'reset', 'marks', '清理'],
    requires: [],
    apply: (chain) => chain.unsetAllMarks(),
  },
  {
    id: 'clear-formatting',
    group: '对齐与清理',
    title: '重置段落格式',
    subtext: '恢复普通段落，并重置后续输入格式',
    badge: TypeIcon,
    keywords: ['clear', 'reset', 'format', '正文'],
    requires: ['paragraph'],
    apply: (chain) => chain.unsetAllMarks().clearNodes(),
  },
];

export function matchesQuery(item: Pick<MenuCommand, 'title' | 'subtext' | 'group' | 'keywords'>, query: string) {
  return matchesSuggestionQuery(item, query);
}

export function canRunCommand(item: MenuCommand, editor: Editor, range: Range) {
  if (editor.isDestroyed || !editor.isEditable) return false;
  const extensions = editor.extensionManager.extensions;
  if (!item.requires.every((name) => extensions.some((extension) => extension.name === name))) return false;
  if (range.from < 0 || range.to > editor.state.doc.content.size || range.from > range.to) return false;
  // can() 的 deleteRange 不会改变事务，需要显式更新试算事务，且不派发到真实文档。
  const chain = editor
    .can()
    .chain()
    .command(({tr}) => {
      tr.delete(range.from, range.to);
      return true;
    });
  return item.apply(chain).run();
}

export function runMenuCommand(item: MenuCommand, editor: Editor, range: Range) {
  if (!canRunCommand(item, editor, range)) return false;
  return item.apply(editor.chain().focus().deleteRange(range)).run();
}

export function getSuggestionItems({
  editor,
  range,
  query,
}: {
  editor: Editor;
  range: Range;
  query: string;
}): SuggestionItem<MenuContext>[] {
  // 保持分组内的原始顺序，确保视觉顺序与键盘导航索引一致。
  return menuCommands
    .filter((item) => matchesQuery(item, query) && canRunCommand(item, editor, range))
    .map((item) => ({
      title: item.title,
      subtext: item.subtext,
      group: item.group,
      badge: item.badge,
      keywords: item.keywords,
      context: {id: item.id, active: item.isActive?.(editor) ?? false},
      onSelect: ({editor, range}) => {
        runMenuCommand(item, editor, range);
      },
    }));
}
