import Math from '@tiptap/extension-mathematics';
import type {Editor} from '@tiptap/react';
import 'katex/dist/katex.min.css';

// todo
export function getMathematicsExtension(editor: Editor) {
  return [
    Math.configure({
      blockOptions: {
        onClick: (node, pos) => {
          const newCalculation = prompt('Enter new calculation:', node.attrs.latex);
          if (newCalculation) {
            editor.chain().setNodeSelection(pos).updateBlockMath({latex: newCalculation}).focus().run();
          }
        },
      },
      inlineOptions: {
        onClick: (node) => {
          const newCalculation = prompt('Enter new calculation:', node.attrs.latex);
          if (newCalculation) {
            // @ts-expect-error todo
            editor.chain().setNodeSelection(node.pos).updateInlineMath({latex: newCalculation}).focus().run();
          }
        },
      },
      // katexOptions
    }),
  ];
}
