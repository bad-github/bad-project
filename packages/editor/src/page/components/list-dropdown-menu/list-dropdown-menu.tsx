import {ListDropdownMenu} from '@workspace/editor/components/tiptap-ui/list-dropdown-menu';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GListDropdownMenu({editor}: {editor: Editor}) {
  const {hideWhenUnavailable} = useConfig();
  return (
    <ListDropdownMenu
      editor={editor}
      types={['bulletList', 'orderedList', 'taskList']}
      hideWhenUnavailable={hideWhenUnavailable}
      // portal={false}
      onOpenChange={(isOpen) => console.log('Dropdown opened:', isOpen)}
    />
  );
}
