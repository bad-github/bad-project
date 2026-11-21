import {Badge} from '@workspace/editor/components/tiptap-ui-primitive/badge';
import {Button} from '@workspace/editor/components/tiptap-ui-primitive/button';
import {CornerDownLeftIcon} from '@workspace/editor/icons/corner-down-left-icon';
import {parseShortcutKeys} from '@workspace/editor/lib/tiptap-utils';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function HardBreakButton({editor}: {editor: Editor}) {
  const {showShortcut, showText} = useConfig();
  const handleClick = () => {
    editor.chain().focus().setHardBreak().run();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      data-active-state="off"
      role="button"
      tabIndex={-1}
      aria-label="Hard break"
      tooltip="Hard break"
      onClick={handleClick}
    >
      <CornerDownLeftIcon className="tiptap-button-icon" />
      {showText && <span className="tiptap-button-text">Add hard break</span>}
      {showShortcut && <Badge>{parseShortcutKeys({shortcutKeys: 'mod+shift+b'})}</Badge>}
    </Button>
  );
}
