import {TextAlignButton} from '@workspace/editor/components/tiptap-ui/text-align-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GTextAlignButton({editor}: {editor: Editor}) {
  const {showText, showShortcut, hideWhenUnavailable} = useConfig();
  return (
    <>
      <TextAlignButton
        editor={editor}
        align="left"
        text={showText ? 'Left' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onAligned={() => console.log('Text left aligned!')}
      />
      <TextAlignButton
        editor={editor}
        align="center"
        text={showText ? 'Center' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onAligned={() => console.log('Text center aligned!')}
      />
      <TextAlignButton
        editor={editor}
        align="right"
        text={showText ? 'Right' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onAligned={() => console.log('Text right aligned!')}
      />
      <TextAlignButton
        editor={editor}
        align="justify"
        text={showText ? 'Justify' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onAligned={() => console.log('Text justify aligned!')}
      />
    </>
  );
}
