import {SlashCommandTriggerButton} from '@workspace/editor/components/tiptap-ui/slash-command-trigger-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export default function GSlashCommandTriggerButton({editor, char = '/'}: {editor: Editor; char?: string}) {
  const {showShortcut, showText, hideWhenUnavailable} = useConfig();
  return (
    <SlashCommandTriggerButton
      editor={editor}
      text={showText ? 'Insert Block' : ''}
      trigger={char}
      hideWhenUnavailable={hideWhenUnavailable}
      showShortcut={showShortcut}
      onTriggered={(trigger) => console.log('Inserted:', trigger)}
    />
  );
}
