import {CopyToClipboardButton} from '@workspace/editor/components/tiptap-ui/copy-to-clipboard-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

// 在富文本中选中一段文本进行copy，然后再在富文本中粘贴
export function GCopyToClipboardButton({editor}: {editor: Editor}) {
  const {showText, showShortcut, hideWhenUnavailable} = useConfig();
  return (
    <CopyToClipboardButton
      editor={editor}
      text={showText ? 'Copy to clipboard' : ''}
      // todo
      copyWithFormatting={true}
      hideWhenUnavailable={hideWhenUnavailable}
      showShortcut={showShortcut}
      onCopied={() => console.log('Content copied to clipboard!')}
    />
  );
}
