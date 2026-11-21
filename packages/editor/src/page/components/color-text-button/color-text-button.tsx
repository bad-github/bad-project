import {ColorTextButton} from '@workspace/editor/components/tiptap-ui/color-text-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GColorTextButton({editor}: {editor: Editor}) {
  const {showText, hideWhenUnavailable, showShortcut} = useConfig();
  return (
    <>
      <ColorTextButton
        editor={editor}
        textColor="var(--tt-color-text-blue)"
        text={showText ? 'Blue Text' : ''}
        tooltip="Apply blue text"
        aria-label="Apply blue text"
        label="Apply blue text"
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onApplied={({color, label}) => console.log(`Applied ${label} text color: ${color}`)}
      />
      <ColorTextButton
        editor={editor}
        textColor="var(--tt-color-text-red)"
        text={showText ? 'Red Text' : ''}
        tooltip="Apply red text"
        aria-label="Apply red text"
        label="Apply red text"
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onApplied={({color, label}) => console.log(`Applied ${label} text color: ${color}`)}
      />
    </>
  );
}
