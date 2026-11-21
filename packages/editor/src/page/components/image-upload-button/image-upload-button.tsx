import {ImageUploadButton} from '@workspace/editor/components/tiptap-ui/image-upload-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export default function GImageUploadButton({editor}: {editor: Editor}) {
  const {showText, showShortcut, hideWhenUnavailable} = useConfig();
  return (
    <ImageUploadButton
      editor={editor}
      text={showText ? 'Add Image' : ''}
      hideWhenUnavailable={hideWhenUnavailable}
      showShortcut={showShortcut}
      onInserted={() => console.log('Image inserted!')}
    />
  );
}
