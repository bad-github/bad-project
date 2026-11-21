import {NodeAlignment} from '@workspace/editor/components/tiptap-extension/node-alignment-extension';
import {NodeBackground} from '@workspace/editor/components/tiptap-extension/node-background-extension';
import {TableHandleExtension} from '@workspace/editor/components/tiptap-node/table-node/extensions/table-handle';
import {TableKit} from '@workspace/editor/components/tiptap-node/table-node/extensions/table-node-extension';
import {TextStyle, SharedHighlight} from '../../extensions/shared';

export const TableNodeExtension = [
  TableKit.configure({
    table: {
      resizable: true, // Enable column resizing
    },
  }),
  TableHandleExtension, // Required for row/column manipulation
  NodeAlignment, // For cell alignment
  NodeBackground, // For cell background colors
  TextStyle, // For text styling
  SharedHighlight, // For highlighting
];
