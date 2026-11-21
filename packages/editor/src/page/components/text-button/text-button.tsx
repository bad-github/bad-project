import {TextButton} from '@workspace/editor/components/tiptap-ui/text-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GTextButton({editor}: {editor: Editor}) {
  const {showShortcut, showText, hideWhenUnavailable} = useConfig();
  return (
    <TextButton
      editor={editor}
      text={showText ? 'Text' : ''}
      hideWhenUnavailable={hideWhenUnavailable}
      showShortcut={showShortcut}
      onToggled={() => console.log('Converted to text!')}
    />
  );
}
