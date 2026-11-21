import {MentionTriggerButton} from '@workspace/editor/components/tiptap-ui/mention-trigger-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GMentionTriggerButton({editor, char = '@'}: {editor: Editor; char?: string}) {
  const {showShortcut, showText, hideWhenUnavailable} = useConfig();
  return (
    <MentionTriggerButton
      editor={editor}
      text={showText ? 'Mention' : ''}
      trigger={char}
      hideWhenUnavailable={hideWhenUnavailable}
      showShortcut={showShortcut}
      onTriggered={(trigger) => console.log('Inserted:', trigger)}
    />
  );
}
