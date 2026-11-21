import {Button} from '@workspace/editor/components/tiptap-ui-primitive/button';
import type {Editor} from '@tiptap/react';
import {useCallback} from 'react';

export function MathematicsButton({editor}: {editor: Editor}) {
  const onInsertInlineMath = useCallback(() => {
    const hasSelection = !editor.state.selection.empty;
    if (hasSelection) {
      // @ts-expect-error todo
      return editor.chain().setInlineMath().focus().run();
    }

    const latex = prompt('Enter inline math expression:', '');
    return editor.chain().insertInlineMath({latex}).focus().run();
  }, [editor]);

  const onRemoveInlineMath = useCallback(() => {
    editor.chain().deleteInlineMath().focus().run();
  }, [editor]);

  const onInsertBlockMath = useCallback(() => {
    const hasSelection = !editor.state.selection.empty;

    if (hasSelection) {
      // @ts-expect-error todo
      return editor.chain().setBlockMath().focus().run();
    }

    const latex = prompt('Enter block math expression:', '');
    return editor.chain().insertBlockMath({latex}).focus().run();
  }, [editor]);

  const onRemoveBlockMath = useCallback(() => {
    editor.chain().deleteBlockMath().focus().run();
  }, [editor]);

  return (
    <>
      <Button onClick={onInsertInlineMath}>Insert inline math</Button>
      <Button onClick={onRemoveInlineMath}>Remove inline math</Button>
      <Button onClick={onInsertBlockMath}>Insert block math</Button>
      <Button onClick={onRemoveBlockMath}>Remove block math</Button>
    </>
  );
}
