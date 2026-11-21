import {MentionDropdownMenu} from '@workspace/editor/components/tiptap-ui/mention-dropdown-menu';

export function GMentionDropdownMenu({char = '@'}: {char?: string}) {
  return <MentionDropdownMenu char={char} />;
}
