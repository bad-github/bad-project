import Audio from '@tiptap/extension-audio';

export const AudioExtension = [
  Audio.configure({
    controls: true,
    preload: 'metadata',
    loop: false, // 无效
  }),
];
