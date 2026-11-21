import {SlashDropdownMenu} from '@workspace/editor/components/tiptap-ui/slash-dropdown-menu';
import type {Editor} from '@tiptap/react';

export function GSlashDropdownMenu({editor, char = '/'}: {editor: Editor; char?: string}) {
  return (
    <SlashDropdownMenu
      char={char}
      editor={editor}
      config={{
        enabledItems: [
          'text',
          'heading_1',
          'heading_2',
          'heading_3',
          'bullet_list',
          'ordered_list',
          'task_list',
          'quote',
          'code_block',
          'mention',
          'emoji',
          'divider',
          'image',
        ],
        showGroups: true,
        itemGroups: {
          text: 'Formatting',
          heading_1: 'Formatting',
          heading_2: 'Formatting',
          heading_3: 'Formatting',
          bullet_list: 'Lists',
          ordered_list: 'Lists',
          task_list: 'Lists',
          quote: 'Blocks',
          code_block: 'Blocks',
        },
      }}
    />
  );
}
