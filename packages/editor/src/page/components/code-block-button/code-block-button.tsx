import {CodeBlockButton} from '@workspace/editor/components/tiptap-ui/code-block-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GCodeBlockButton({editor}: {editor: Editor}) {
  const {showText, hideWhenUnavailable, showShortcut} = useConfig();
  return (
    <CodeBlockButton
      editor={editor}
      text={showText ? 'Code' : ''}
      hideWhenUnavailable={hideWhenUnavailable}
      showShortcut={showShortcut}
      onToggled={() => console.log('Code block toggled!')}
    />
  );
}
