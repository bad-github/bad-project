import {Button} from '@workspace/editor/components/tiptap-ui-primitive/button';
import type {Editor} from '@tiptap/react';

export function AudioButton({editor}: {editor: Editor}) {
  const src = 'https://www.w3schools.com/html/horse.ogg';

  const insertAudio = () => {
    if (!editor || !src) {
      return;
    }

    editor
      .chain()
      .focus()
      .setAudio({
        src,
        controls: true,
        autoplay: false,
        loop: false,
        muted: false,
        preload: 'metadata',
        controlslist: 'nodownload',
        crossorigin: undefined,
        disableremoteplayback: false,
      })
      .run();
  };

  return <Button onClick={insertAudio}>Insert audio</Button>;
}
