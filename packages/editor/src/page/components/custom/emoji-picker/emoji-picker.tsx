import {EmojiMenu} from '@workspace/editor/components/tiptap-ui/emoji-menu';
import {gitHubEmojis} from '@tiptap/extension-emoji';
import type {EmojiItem} from '@tiptap/extension-emoji';
import {useState} from 'react';

export function EmojiPicker() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedEmoji, setSelectedEmoji] = useState<EmojiItem | null>(null);

  const handleEmojiSelect = (emoji: EmojiItem) => {
    setSelectedEmoji(emoji);
    console.log('Selected emoji:', emoji.name, emoji.emoji);
  };

  const handleClose = () => {
    console.log('Emoji menu closed');
  };

  return (
    <EmojiMenu
      emojis={gitHubEmojis}
      onSelect={handleEmojiSelect}
      onClose={handleClose}
      showSearch={true}
      selector=".my-emoji-menu"
    />
  );
}
