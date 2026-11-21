import {EmojiDropdownMenu} from '@workspace/editor/components/tiptap-ui/emoji-dropdown-menu';

export function GEmojiDropdownMenu({char = ':'}: {char?: string}) {
  return <EmojiDropdownMenu char={char} />;
}
