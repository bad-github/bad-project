import {Badge} from '@workspace/editor/components/tiptap-ui-primitive/badge';
import {Button} from '@workspace/editor/components/tiptap-ui-primitive/button';
import {MinusIcon} from '@workspace/editor/icons';
import {parseShortcutKeys} from '@workspace/editor/lib/tiptap-utils';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function HorizontalRuleButton({editor}: {editor: Editor}) {
  const {showShortcut, showText} = useConfig();
  const handleClick = () => {
    editor.chain().focus().setHorizontalRule().run();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      data-active-state="off"
      role="button"
      tabIndex={-1}
      aria-label="Horizontal rule"
      tooltip="Horizontal rule"
      onClick={handleClick}
    >
      <MinusIcon className="tiptap-button-icon" />
      {showText && <span className="tiptap-button-text">Add horizontal rule</span>}
      {showShortcut && <Badge>{parseShortcutKeys({shortcutKeys: 'mod+shift+s'})}</Badge>}
    </Button>
  );
}
