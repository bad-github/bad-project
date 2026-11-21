import {Details, DetailsContent, DetailsSummary} from '@tiptap/extension-details';
import {Placeholder} from '@tiptap/extensions';

// 没有原生效果
export const DetailsNodeExtension = [
  Details.configure({
    persist: true,
    HTMLAttributes: {
      class: 'details',
    },
  }),
  DetailsSummary,
  DetailsContent,
  Placeholder.configure({
    includeChildren: true,
    placeholder: ({node}) => {
      if (node.type.name === 'detailsSummary') {
        return 'Summary';
      }
      return null;
    },
  }),
];
