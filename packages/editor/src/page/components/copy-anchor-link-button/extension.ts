import UniqueID from '@tiptap/extension-unique-id';

export const CopyAnchorLinkButtonExtension = [
  // StarterKit
  UniqueID.configure({
    types: ['paragraph'],
    // attributeName: 'uid', // default id
    generateID: ({node}) => `${node.type.name}-${Math.random().toString(36).slice(2)}`,
  }),
];
