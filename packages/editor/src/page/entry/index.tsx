import {useEffect, useMemo} from 'react';
import {useEditor, EditorContext} from '@tiptap/react';
import {ColorHighlightButtonExtension} from '../components/color-highlight-button';
import {ColorHighlightPopoverExtension} from '../components/color-highlight-popover';
import {getImageAlignButtonExtension} from '../components/image-align-button';
import {StarterKit} from '@tiptap/starter-kit';
import {MarkButtonExtension} from '../components/mark-button';
import {TextAlignButtonExtension} from '../components/text-align-button';
import {ListButtonExtension} from '../components/list-button';
import {ColorTextButtonExtension} from '../components/color-text-button';
import {ColorTextPopoverExtension} from '../components/color-text-popover';
import {ColorTextPickerExtension} from '../components/custom/color-text-picker';
import {ColorHighlightPickerExtension} from '../components/custom/color-highlight-picker';
import {LinkPopoverExtension} from '../components/link-popover';
import {ImageUploadButtonExtension} from '../components/image-upload-button';
import {EmojiDropdownExtension} from '../components/emoji-dropdown-menu';
import {MentionDropdownMenuExtension} from '../components/mention-dropdown-menu';
import {CopyAnchorLinkButtonExtension} from '../components/copy-anchor-link-button';
import {DragContextMenuExtension} from '../components/drag-context-menu';
import {TableNodeExtension} from '../node/table-node';
import {getTocNodeExtension} from '../node/toc-node';
import {TocProvider, useToc} from '@workspace/editor/components/tiptap-node/toc-node/context/toc-context';
import {HardBreakExtension} from '../node/hard-break';
import {HorizontalRuleExtension} from '../node/horizontal-rule';
import {Placeholder} from '@tiptap/extensions';
import {CodeBlockLowlightExtension} from '../components/custom/code-block-lowlight';
import TiptapEditor from './editor';
import {resolveEditorExtensions} from '../extensions/resolve-editor-extensions';
import {useTiptapEditor} from '../../provider/editor-provider';

const TiptapConfig = () => {
  const {initialContent, editable, onChange} = useTiptapEditor();
  const {setTocContent} = useToc();

  const editor = useEditor({
    // 挂载后再创建编辑器，避免目录扩展的初始化回调在 render 阶段触发 React 状态更新。
    immediatelyRender: false,
    editable,
    onUpdate: ({editor}) => {
      // UniqueID、目录等扩展会在 create 阶段补齐文档属性，不作为业务内容变化通知。
      if (!editor.isInitialized) return;
      onChange?.({json: editor.getJSON(), html: editor.getHTML()});
    },
    textDirection: 'ltr', // rtl，ltr // editor.chain().focus().setTextDirection('ltr')
    // 每个案例保留自己的完整依赖声明，统一展开集合、去重和检查冲突。
    // StarterKit 提供默认能力；案例声明的同名扩展自动替代默认实现，移除案例后默认能力恢复。
    extensions: resolveEditorExtensions([
      {source: 'StarterKit', extensions: [StarterKit], fallback: true},
      {source: 'Placeholder', extensions: [Placeholder.configure({
        placeholder: ({node}) => {
          if (node.type.name === 'heading') {
            return 'What’s the title?';
          }
          return 'Type something...';
        },
      })]},
      {source: 'TextAlignButton', extensions: TextAlignButtonExtension},
      {source: 'MarkButton', extensions: MarkButtonExtension},
      {source: 'ColorTextButton', extensions: ColorTextButtonExtension},
      {source: 'ColorTextPopover', extensions: ColorTextPopoverExtension},
      {source: 'ColorTextPicker', extensions: ColorTextPickerExtension},
      {source: 'ColorHighlightButton', extensions: ColorHighlightButtonExtension},
      {source: 'ColorHighlightPopover', extensions: ColorHighlightPopoverExtension},
      {source: 'ColorHighlightPicker', extensions: ColorHighlightPickerExtension},
      {source: 'ListButton', extensions: ListButtonExtension},
      {source: 'LinkPopover', extensions: LinkPopoverExtension},
      {source: 'CopyAnchorLinkButton', extensions: CopyAnchorLinkButtonExtension},
      {source: 'ImageAlignButton', extensions: getImageAlignButtonExtension('official')},
      {source: 'ImageUploadButton', extensions: ImageUploadButtonExtension},
      {source: 'EmojiDropdown', extensions: EmojiDropdownExtension},
      {source: 'MentionDropdownMenu', extensions: MentionDropdownMenuExtension},
      {source: 'DragContextMenu', extensions: DragContextMenuExtension},
      {source: 'TableNode', extensions: TableNodeExtension},
      {source: 'TocNode', extensions: getTocNodeExtension(setTocContent)},
      // ...AiExtension,
      {source: 'HardBreak', extensions: HardBreakExtension},
      {source: 'HorizontalRule', extensions: HorizontalRuleExtension},
      {source: 'CodeBlockLowlight', extensions: CodeBlockLowlightExtension},
      // ...DetailsNodeExtension,
      // ...getMathematicsExtension(editor), // error
      // ...AudioExtension,
      // ...TwitchExtension,
      // ...YoutubeExtension,
      // ReactComponentRenderExtension,
    ]),

    content: initialContent,
  });

  // useEditor 保留现有实例的 editable，需要单独同步运行时属性。
  // 不发送 update，避免只读切换被当成内容变化。
  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.isEditable !== editable) {
      editor.setEditable(editable, false);
    }
  }, [editor, editable]);

  const providerValue = useMemo(() => ({editor}), [editor]);
  return (
    <EditorContext.Provider value={providerValue}>
      <TiptapEditor />
    </EditorContext.Provider>
  );
};

export function TiptapLib() {
  return (
    <TocProvider>
      <TiptapConfig />
    </TocProvider>
  );
}
