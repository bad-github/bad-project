import {TableTriggerButton} from '@workspace/editor/components/tiptap-node/table-node/ui/table-trigger-button';
import { useConfig } from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GTableTriggerButton({editor}: {editor: Editor}) {
  const {showText, hideWhenUnavailable} = useConfig();
  return (
    <TableTriggerButton
      editor={editor}
      maxRows={8}
      maxCols={8}
      hideWhenUnavailable={hideWhenUnavailable}
      text={showText ? 'Insert Table' : ''}
      onInserted={(rows, cols) => console.log(`Inserted ${rows}×${cols} table`)}
    />
  );
}
