import {BlockquoteButton} from '@workspace/editor/components/tiptap-ui/blockquote-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GBlockquoteButton({editor}: {editor: Editor}) {
  const {showText, showShortcut, hideWhenUnavailable} = useConfig();
  return (
    <BlockquoteButton
      editor={editor}
      text={showText ? 'Quote' : ''}
      hideWhenUnavailable={hideWhenUnavailable}
      showShortcut={showShortcut}
      onToggled={() => console.log('Blockquote toggled!')}
    />
  );
}
