import {Button} from '@workspace/editor/components/tiptap-ui-primitive/button';
import type {Editor} from '@tiptap/react';

export function DetailsNodeButton({editor}: {editor: Editor}) {
  return (
    <>
      <Button onClick={() => editor.chain().focus().setDetails().run()} disabled={!editor.can().setDetails()}>
        Set details
      </Button>
      <Button onClick={() => editor.chain().focus().unsetDetails().run()} disabled={!editor.can().unsetDetails()}>
        Unset details
      </Button>
      <Button
        onClick={() =>
          editor
            .chain()
            .focus()
            .command(({tr}) => {
              tr.setNodeAttribute(23, 'open', true);
              return true;
            })
            .run()
        }
      >
        Force open first details
      </Button>
    </>
  );
}
