import {TocShowTitleButton} from '@workspace/editor/components/tiptap-node/toc-node';
import {Button} from '@workspace/editor/components/tiptap-ui-primitive/button';
import {ButtonGroup} from '@workspace/editor/components/tiptap-ui-primitive/button-group';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function TocNodeTrigger({editor}: {editor: Editor}) {
  const {showText, hideWhenUnavailable} = useConfig();
  return (
    <ButtonGroup>
      <Button onClick={() => editor?.commands.insertTocNode()} disabled={!editor?.can().insertTocNode()}>
        Insert TOC
      </Button>
      <TocShowTitleButton
        editor={editor}
        text={showText ? 'Toggle Title' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
      />
    </ButtonGroup>
  );
}
