import {Button} from '@workspace/editor/components/tiptap-ui-primitive/button';
import type {Editor} from '@tiptap/core';

export default function TwitchButton({editor}: {editor: Editor}) {
  const addTwitchVideo = () => {
    const url = prompt('Enter Twitch video URL, e.g. https://www.twitch.tv/videos/2409205759');

    if (url) {
      editor.commands.setTwitchVideo({
        src: url,
        width: Math.max(320, 640),
        height: Math.max(180, 480),
      });
    }
  };

  return <Button onClick={addTwitchVideo}>Add Twitch video</Button>;
}
