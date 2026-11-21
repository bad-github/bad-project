import {MarkButton} from '@workspace/editor/components/tiptap-ui/mark-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GMarkButton({editor}: {editor: Editor}) {
  const {showShortcut, showText, hideWhenUnavailable} = useConfig();
  return (
    <>
      <MarkButton
        editor={editor}
        type="bold"
        text={showText ? 'Bold' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
        onToggled={() => console.log('Mark toggled!')}
      />
      <MarkButton
        editor={editor}
        type="italic"
        text={showText ? 'Italic' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
      />
      <MarkButton
        editor={editor}
        type="strike"
        text={showText ? 'Strike' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
      />
      <MarkButton
        editor={editor}
        type="code"
        text={showText ? 'Code' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
      />
      <MarkButton
        editor={editor}
        type="underline"
        text={showText ? 'underline' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
      />
      <MarkButton
        editor={editor}
        type="superscript"
        text={showText ? 'superscript' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
      />
      <MarkButton
        editor={editor}
        type="subscript"
        text={showText ? 'subscript' : ''}
        hideWhenUnavailable={hideWhenUnavailable}
        showShortcut={showShortcut}
      />
    </>
  );
}
