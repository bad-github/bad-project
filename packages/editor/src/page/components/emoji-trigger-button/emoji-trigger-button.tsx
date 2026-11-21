import {EmojiTriggerButton} from '@workspace/editor/components/tiptap-ui/emoji-trigger-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export default function GEmojiTriggerButton({editor, char = ':'}: {editor: Editor; char?: string}) {
  const {showShortcut, showText, hideWhenUnavailable} = useConfig();
  return (
    <EmojiTriggerButton
      editor={editor}
      text={showText ? 'Emoji' : ''}
      trigger={char}
      hideWhenUnavailable={hideWhenUnavailable}
      showShortcut={showShortcut}
      onTriggerApplied={(trigger) => console.log(`Trigger applied: ${trigger}`)}
    />
  );
}
