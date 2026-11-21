import Emoji, {gitHubEmojis} from '@tiptap/extension-emoji';

export const EmojiDropdownExtension = [
  // StarterKit,
  Emoji.configure({
    emojis: gitHubEmojis,
    forceFallbackImages: true,
  }),
];
