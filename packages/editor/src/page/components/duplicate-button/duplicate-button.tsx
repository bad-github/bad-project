import {DuplicateButton} from '@workspace/editor/components/tiptap-ui/duplicate-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GDuplicateButton({editor}: {editor: Editor}) {
  const {showText, showShortcut, hideWhenUnavailable} = useConfig();
  return (
    <DuplicateButton
      editor={editor}
      text={showText ? 'Duplicate' : ''}
      hideWhenUnavailable={hideWhenUnavailable}
      showShortcut={showShortcut}
      onDuplicated={() => console.log('Node duplicated!')}
    />
  );
}
