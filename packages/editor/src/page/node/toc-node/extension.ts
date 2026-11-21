import {TocNode} from '@workspace/editor/components/tiptap-node/toc-node';
import Heading from '@tiptap/extension-heading';
import {TableOfContents} from '@tiptap/extension-table-of-contents';

export function getTocNodeExtension(setTocContent?: any) {
  return [
    Heading.configure({
      levels: [1, 2, 3, 4, 5, 6],
    }),
    TableOfContents.configure({
      getIndex: (headingNode) => {
        // headingNode.attrs.id
        return headingNode.node.attrs.id;
      },
      onUpdate: (content) => {
        setTocContent?.(content); // Update TOC state
      },
    }),
    TocNode.configure({
      topOffset: 80,
      maxShowCount: 20,
      showTitle: true,
    }),
  ];
}
