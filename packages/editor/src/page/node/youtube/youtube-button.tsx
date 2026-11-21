import {Button} from '@workspace/editor/components/tiptap-ui-primitive/button';
import type {Editor} from '@tiptap/react';

export function YoutubeButton({editor}: {editor: Editor}) {
  const addYoutubeVideo = () => {
    const url = prompt('Enter YouTube URL, e.g. https://www.youtube.com/watch?v=3lTUAWOgoHs');

    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: Math.max(320, 640),
        height: Math.max(180, 480),
      });
    }
  };

  return <Button onClick={addYoutubeVideo}>Add Youtube video</Button>;
}
