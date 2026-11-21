import {ColorHighlightButton} from '@workspace/editor/components/tiptap-ui/color-highlight-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GColorHighlightButton({editor}: {editor: Editor}) {
  const {showText, showShortcut, hideWhenUnavailable} = useConfig();
  return (
    <>
      <ColorHighlightButton
        editor={editor}
        tooltip="Toggle purple highlight"
        aria-label="Toggle purple highlight"
        highlightColor="var(--tt-color-highlight-purple)"
        text={showText ? 'Purple background' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onApplied={({color, label}) => console.log(`Applied ${label} highlight: ${color}`)}
      />

      <ColorHighlightButton
        editor={editor}
        tooltip="Toggle orange highlight"
        aria-label="Toggle orange highlight"
        highlightColor="oklch(90.1% 0.076 70.697)"
        text={showText ? 'Orange background' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onApplied={({color, label}) => console.log(`Applied ${label} highlight: ${color}`)}
      />
    </>
  );
}
