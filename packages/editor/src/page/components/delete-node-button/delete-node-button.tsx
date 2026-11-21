import {DeleteNodeButton} from '@workspace/editor/components/tiptap-ui/delete-node-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GDeleteNodeButton({editor}: {editor: Editor}) {
  const {showText, showShortcut, hideWhenUnavailable} = useConfig();
  return (
    <DeleteNodeButton
      editor={editor}
      text={showText ? 'Delete' : ''}
      hideWhenUnavailable={hideWhenUnavailable}
      showShortcut={showShortcut}
      onDeleted={() => console.log('Node deleted!')}
    />
  );
}
