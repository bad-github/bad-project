import {ColorTextPopover} from '@workspace/editor/components/tiptap-ui/color-text-popover';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export default function GColorTextPopover({editor}: {editor: Editor}) {
  const {hideWhenUnavailable} = useConfig();
  return (
    <ColorTextPopover
      editor={editor}
      hideWhenUnavailable={hideWhenUnavailable}
      onColorChanged={({type, label, value}) => console.log(`Applied ${type} color: ${label} (${value})`)}
    />
  );
}
