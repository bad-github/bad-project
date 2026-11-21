import {ResetAllFormattingButton} from '@workspace/editor/components/tiptap-ui/reset-all-formatting-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GResetAllFormattingButton({editor}: {editor: Editor}) {
  const {showText, showShortcut, hideWhenUnavailable} = useConfig();
  return (
    <ResetAllFormattingButton
      editor={editor}
      text={showText ? 'Reset Formatting' : ''}
      preserveMarks={['inlineThread', 'link']}
      hideWhenUnavailable={hideWhenUnavailable}
      showShortcut={showShortcut}
      onResetAllFormatting={() => console.log('Formatting reset!')}
    />
  );
}
