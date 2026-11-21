import { HeadingButton } from '@workspace/editor/components/tiptap-ui/heading-button';
import { useConfig } from '@workspace/editor/provider/config-provider';
import type { Editor } from '@tiptap/react';

export function GHeadingButton({editor}: {editor: Editor}) {
  const {showShortcut, showText, hideWhenUnavailable} = useConfig();
  return (
    <>
      <HeadingButton
        editor={editor}
        level={1}
        text={showText ? 'Heading 1' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onToggled={() => console.log(`Heading 1 toggled!`)}
      />
      <HeadingButton
        editor={editor}
        level={2}
        text={showText ? 'Heading 2' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onToggled={() => console.log(`Heading 2 toggled!`)}
      />
    </>
  );
}
