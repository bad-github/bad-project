import {Editor, useCurrentEditor, useEditorState} from '@tiptap/react';
import classes from './index.module.scss';
import ThemeSwitch from '@workspace/editor/components/theme-switch';
import {GColorHighlightButton} from '../components/color-highlight-button';
import {GColorHighlightPopover} from '../components/color-highlight-popover';
import {GListButton} from '../components/list-button';
import {ConfigProvider} from '@workspace/editor/provider/config-provider';
import {GTextButton} from '../components/text-button';
import {ToolbarGroup, ToolbarSeparator} from '@workspace/editor/components/tiptap-ui-primitive/toolbar';
import {GHeadingButton} from '../components/heading-button/heading-button';
import {GHeadingDropdownMenu} from '../components/heading-dropdown-menu';
import {GMarkButton} from '../components/mark-button';
import {GTextAlignButton} from '../components/text-align-button';
import {GBlockquoteButton} from '../components/blockquote-button';
import {GCodeBlockButton} from '../components/code-block-button';
import {GListDropdownMenu} from '../components/list-dropdown-menu';
import {GColorTextButton} from '../components/color-text-button';
import GColorTextPopover from '../components/color-text-popover/color-text-popover';
import {ColorTextPicker} from '../components/custom/color-text-picker';
import {ColorHighlightPicker} from '../components/custom/color-highlight-picker';
import {HorizontalRuleButton} from '../node/horizontal-rule';
import {ResetNodeButton} from '../components/reset-node-button';
import {GResetAllFormattingButton} from '../components/reset-all-formatting-button';
import {GLinkPopover} from '../components/link-popover';
import {GImageAlignButton} from '../components/image-align-button';
import GImageUploadButton from '../components/image-upload-button/image-upload-button';
import {GEmojiDropdownMenu} from '../components/emoji-dropdown-menu';
import GEmojiTriggerButton from '../components/emoji-trigger-button/emoji-trigger-button';
import {GMentionDropdownMenu} from '../components/mention-dropdown-menu';
import {GMentionTriggerButton} from '../components/mention-trigger-button';
// import {GSlashDropdownMenu} from '../components/slash-dropdown-menu';
// import GSlashCommandTriggerButton from '../components/slash-command-trigger-button/slash-command-trigger-button';
import {GCopyAnchorLinkButton} from '../components/copy-anchor-link-button';
import {GCopyToClipboardButton} from '../components/copy-to-clipboard-button';
import {GMoveNodeButton} from '../components/move-node-button';
import {GDeleteNodeButton} from '../components/delete-node-button';
import {GUndoRedoButton} from '../components/undo-redo-button';
import {GDuplicateButton} from '../components/duplicate-button';
import {GTurnIntoDropdown} from '../components/turn-into-dropdown';
import {GDragContextMenu} from '../components/drag-context-menu';
import {GTableTriggerButton} from '../node/table-node';
import {TocNodeTrigger} from '../node/toc-node';
// import {GAiAskButton} from '../components/ai/ai-ask-button';
// import {GAiMenu} from '../components/ai/ai-menu';
// import {GImproveDropdown} from '../components/ai/improve-dropdown';
import {HardBreakButton} from '../node/hard-break';
import Suggestion from '../components/custom/suggestion/suggestion';

export default function ToolBar() {
  const {editor} = useCurrentEditor() as {editor: Editor};
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return null;
      return {
        color: ctx.editor.getAttributes('textStyle').color,
        highlightColor: ctx.editor.getAttributes('highlight').color,
        backgroundColor: ctx.editor.getAttributes('textStyle').backgroundColor,
        isBold: ctx.editor.isActive('bold') ?? false,
        canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
        isStrike: ctx.editor.isActive('strike') ?? false,
        canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
        isCode: ctx.editor.isActive('code') ?? false,
        canCode: ctx.editor.can().chain().toggleCode().run() ?? false,
        canClearMarks: ctx.editor.can().chain().unsetAllMarks().run() ?? false,
        isParagraph: ctx.editor.isActive('paragraph') ?? false,
        isCodeBlock: ctx.editor.isActive('codeBlock') ?? false,
        isBlockquote: ctx.editor.isActive('blockquote') ?? false,
      };
    },
  });

  if (!editorState) return null;
  return (
    <ConfigProvider>
      <div className={classes.toolbar}>
        <ToolbarGroup style={{flexWrap: 'wrap'}}>
          
          <GTextButton editor={editor} />
          <GTextAlignButton editor={editor} />
          <ToolbarSeparator />
          <GHeadingButton editor={editor} />
          <GHeadingDropdownMenu editor={editor} />
          <ToolbarSeparator />
          <GMarkButton editor={editor} />
          <ToolbarSeparator />
          <GColorTextButton editor={editor} />
          <GColorTextPopover editor={editor} />
          <ColorTextPicker editor={editor} value={editorState.color} />
          <GColorHighlightButton editor={editor} />
          <GColorHighlightPopover editor={editor} />
          <ColorHighlightPicker editor={editor} value={editorState.highlightColor} />
          <ToolbarSeparator />
          <GBlockquoteButton editor={editor} />
          <GCodeBlockButton editor={editor} />
          <ToolbarSeparator />
          <GListButton editor={editor} />
          <GListDropdownMenu editor={editor} />
          <ToolbarSeparator />
          <HorizontalRuleButton editor={editor} />
          <HardBreakButton editor={editor} />
          <GLinkPopover editor={editor} />
          <GCopyAnchorLinkButton editor={editor} />
          <GCopyToClipboardButton editor={editor} />
          <GDuplicateButton editor={editor} />
          <ToolbarSeparator />
          <GImageAlignButton editor={editor} />
          <GImageUploadButton editor={editor} />
          <ToolbarSeparator />
          <GEmojiDropdownMenu char=":" />
          {/* button只是给了一个触发入口，这里的char必须匹配dropdown的char */}
          <GEmojiTriggerButton editor={editor} char=":" />
          <GMentionDropdownMenu char="@" />
          <GMentionTriggerButton editor={editor} char="@" />
          {/* <GSlashDropdownMenu editor={editor} char="/" />
          <GSlashCommandTriggerButton editor={editor} char="/" /> */}
          <ToolbarSeparator />
          <ResetNodeButton editor={editor} />
          <GResetAllFormattingButton editor={editor} />
          <ToolbarSeparator />
          <GDragContextMenu />
          <GTableTriggerButton editor={editor} />
          <TocNodeTrigger editor={editor} />
          <ToolbarSeparator />
          {/* <GAiAskButton editor={editor} />
          <GAiMenu />
          <GImproveDropdown /> */}
          <Suggestion editor={editor} />
          <ToolbarSeparator />
          <GMoveNodeButton editor={editor} />
          <GDeleteNodeButton editor={editor} />
          <GUndoRedoButton editor={editor} />
          <ToolbarSeparator />
          <ThemeSwitch />
          <ToolbarSeparator />
          <GTurnIntoDropdown editor={editor} />
        </ToolbarGroup>
      </div>
    </ConfigProvider>
  );
}
