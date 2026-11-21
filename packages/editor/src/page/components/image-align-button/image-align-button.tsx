import {ImageNodeFloating} from '@workspace/editor/components/tiptap-node/image-node/image-node-floating';
import {Toolbar} from '@workspace/editor/components/tiptap-ui-primitive/toolbar';
import {FloatingElement} from '@workspace/editor/components/tiptap-ui-utils/floating-element';
import {ImageAlignButton} from '@workspace/editor/components/tiptap-ui/image-align-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GImageAlignButton({editor, official = true}: {editor: Editor; official?: boolean}) {
  const {showText, showShortcut, hideWhenUnavailable} = useConfig();
  return (
    <FloatingElement editor={editor}>
      <Toolbar variant="floating">
        {official ? (
          <ImageNodeFloating />
        ) : (
          <>
            <ImageAlignButton
              editor={editor}
              align="left"
              text={showText ? 'Align Left' : ''}
              hideWhenUnavailable={hideWhenUnavailable}
              showShortcut={showShortcut}
              onAligned={() => {
                console.log('Image aligned left!');
              }}
            />
            <ImageAlignButton
              editor={editor}
              align="center"
              text={showText ? 'Align Center' : ''}
              hideWhenUnavailable={hideWhenUnavailable}
              showShortcut={showShortcut}
              onAligned={() => {
                console.log('Image aligned center!', editor.chain().focus());
              }}
            />
            <ImageAlignButton
              editor={editor}
              align="right"
              text={showText ? 'Align Right' : ''}
              hideWhenUnavailable={hideWhenUnavailable}
              showShortcut={showShortcut}
              onAligned={() => {
                console.log('Image aligned right!');
              }}
            />
          </>
        )}
      </Toolbar>
    </FloatingElement>
  );
}
