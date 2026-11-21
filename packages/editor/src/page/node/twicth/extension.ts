import Twitch from '@tiptap/extension-twitch';

export const TwitchExtension = [
  Twitch.configure({
    parent: window.location.hostname,
    allowFullscreen: true,
  }),
];
