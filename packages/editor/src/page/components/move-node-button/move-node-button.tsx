import {MoveNodeButton} from '@workspace/editor/components/tiptap-ui/move-node-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GMoveNodeButton({editor}: {editor: Editor}) {
  const {showShortcut, showText, hideWhenUnavailable} = useConfig();
  return (
    <>
      <MoveNodeButton
        editor={editor}
        direction="up"
        text={showText ? 'Move Up' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onMoved={(direction) => console.log(`Node moved ${direction}!`)}
      />
      <MoveNodeButton
        editor={editor}
        direction="down"
        text={showText ? 'Move Down' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onMoved={(direction) => console.log(`Node moved ${direction}!`)}
      />
    </>
  );
}
