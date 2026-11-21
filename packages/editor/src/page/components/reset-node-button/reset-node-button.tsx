import {Badge} from '@workspace/editor/components/tiptap-ui-primitive/badge';
import {Button} from '@workspace/editor/components/tiptap-ui-primitive/button';
import {TextSlashIcon} from '@workspace/editor/icons/text-slash-icon';
import {parseShortcutKeys} from '@workspace/editor/lib/tiptap-utils';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function ResetNodeButton({editor}: {editor: Editor}) {
  const {showText, showShortcut} = useConfig();

  const handleClick = () => {
    editor.chain().focus().clearNodes().run();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      data-active-state="off"
      role="button"
      tabIndex={-1}
      aria-label="Reset node"
      tooltip="Reset node"
      onClick={handleClick}
    >
      <>
        <TextSlashIcon className="tiptap-button-icon" />
        {showText && <span className="tiptap-button-text">Reset node</span>}
        {showShortcut && <Badge>{parseShortcutKeys({shortcutKeys: 'mod+n'})}</Badge>}
      </>
    </Button>
  );
}
