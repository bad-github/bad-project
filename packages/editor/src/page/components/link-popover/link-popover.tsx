import {LinkPopover} from '@workspace/editor/components/tiptap-ui/link-popover';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GLinkPopover({editor}: {editor: Editor}) {
  const {hideWhenUnavailable, autoOpenOnLinkActive} = useConfig();
  return (
    <LinkPopover
      editor={editor}
      hideWhenUnavailable={hideWhenUnavailable}
      autoOpenOnLinkActive={autoOpenOnLinkActive}
      onSetLink={() => console.log('Link set!')}
      onOpenChange={(isOpen) => console.log('Popover opened:', isOpen)}
    />
  );
}
