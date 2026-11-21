import {TurnIntoDropdown} from '@workspace/editor/components/tiptap-ui/turn-into-dropdown';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GTurnIntoDropdown({editor}: {editor: Editor}) {
  const {hideWhenUnavailable} = useConfig();
  return (
    <TurnIntoDropdown
      editor={editor}
      hideWhenUnavailable={hideWhenUnavailable}
      blockTypes={['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote']}
      // portal={false}
      // useCardLayout={true}
      onOpenChange={(isOpen) => console.log('Dropdown toggled:', isOpen)}
    />
  );
}
