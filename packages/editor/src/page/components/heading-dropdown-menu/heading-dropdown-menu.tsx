import {HeadingDropdownMenu} from '@workspace/editor/components/tiptap-ui/heading-dropdown-menu';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GHeadingDropdownMenu({editor}: {editor: Editor}) {
  const {hideWhenUnavailable} = useConfig();
  return (
    <HeadingDropdownMenu
      editor={editor}
      levels={[1, 2, 3, 4, 5, 6]}
      hideWhenUnavailable={hideWhenUnavailable}
      // portal={false}
      onOpenChange={(isOpen) => console.log('Dropdown', isOpen ? 'opened' : 'closed')}
    />
  );
}
