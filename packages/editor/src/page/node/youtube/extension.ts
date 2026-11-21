import Youtube from '@tiptap/extension-youtube';

export const YoutubeExtension = [
  Youtube.configure({
    controls: false,
    nocookie: true,
  }),
];
