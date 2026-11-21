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
        label="Apply Blue"
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onApplied={({color, label}) => console.log(`Applied ${label} text color: ${color}`)}
      />
      <ColorTextButton
        editor={editor}
        textColor="var(--tt-color-text-red)"
        text={showText ? 'Red Text' : ''}
        label="Apply Red"
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onApplied={({color, label}) => console.log(`Applied ${label} text color: ${color}`)}
      />
    </>
  );
}
