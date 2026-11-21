import {ColorHighlightPopover} from '@workspace/editor/components/tiptap-ui/color-highlight-popover';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GColorHighlightPopover({editor}: {editor: Editor}) {
  const {hideWhenUnavailable} = useConfig();
  return (
    <ColorHighlightPopover
      editor={editor}
      hideWhenUnavailable={hideWhenUnavailable}
      onApplied={({color, label}) => console.log(`Applied highlight: ${label} (${color})`)}
    />
  );
}
