import {ColorHighlightButton} from '@workspace/editor/components/tiptap-ui/color-highlight-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GColorHighlightButton({editor}: {editor: Editor}) {
  const {showText, showShortcut, hideWhenUnavailable} = useConfig();
  return (
    <>
      <ColorHighlightButton
        editor={editor}
        tooltip="Purple"
        highlightColor="var(--tt-color-highlight-purple)"
        text={showText ? 'Purple background' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onApplied={({color, label}) => console.log(`Applied ${label} highlight: ${color}`)}
      />

      <ColorHighlightButton
        editor={editor}
        tooltip="Orange"
        highlightColor="oklch(90.1% 0.076 70.697)"
        text={showText ? 'Orange background' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onApplied={({color, label}) => console.log(`Applied ${label} highlight: ${color}`)}
      />
    </>
  );
}
