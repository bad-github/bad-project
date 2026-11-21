import {ListButton} from '@workspace/editor/components/tiptap-ui/list-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GListButton({editor}: {editor: Editor}) {
  const {showShortcut, showText, hideWhenUnavailable} = useConfig();
  return (
    <>
      <ListButton
        editor={editor}
        type="bulletList"
        text={showText ? 'Bullet List' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onToggled={() => console.log('bulletList toggled!')}
      />
      <ListButton
        editor={editor}
        type="orderedList"
        text={showText ? 'Ordered List' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onToggled={() => console.log('orderedList toggled!')}
      />
      <ListButton
        editor={editor}
        type="taskList"
        text={showText ? 'Task List' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onToggled={() => console.log('taskList toggled!')}
      />
    </>
  );
}
