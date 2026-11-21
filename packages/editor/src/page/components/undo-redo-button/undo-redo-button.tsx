import {UndoRedoButton} from '@workspace/editor/components/tiptap-ui/undo-redo-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GUndoRedoButton({editor}: {editor: Editor}) {
  const {showShortcut, showText, hideWhenUnavailable} = useConfig();
  return (
    <>
      <UndoRedoButton
        editor={editor}
        action="undo"
        text={showText ? 'Undo' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onExecuted={() => console.log('Action executed!')}
      />
      <UndoRedoButton
        editor={editor}
        action="redo"
        text={showText ? 'Redo' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onExecuted={() => console.log('Action executed!')}
      />{' '}
    </>
  );
}
