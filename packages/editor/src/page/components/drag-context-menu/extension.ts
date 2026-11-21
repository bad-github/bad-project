import {NodeBackground} from '@workspace/editor/components/tiptap-extension/node-background-extension';
import {Color, TextStyle, SharedHighlight} from '../../extensions/shared';
import {UiState} from '@workspace/editor/components/tiptap-extension/ui-state-extension';

export const DragContextMenuExtension = [
  // Base extensions
  // StarterKit,
  // Text styling extensions which handle the "Colors" menu
  TextStyle,
  SharedHighlight,
  Color,
  NodeBackground,
  // UI state management (REQUIRED for drag context menu)
  UiState,
];
