import {UiState} from '@workspace/editor/components/tiptap-extension/ui-state-extension';
import {Ai} from '@tiptap-pro/extension-ai';
import {Selection} from '@tiptap/extensions';

export const AiExtension = [
  Selection,
  UiState,
  Ai.configure({
    appId: import.meta.env.VITE_TIPTAP_APP_ID,
    token: import.meta.env.VITE_TIPTAP_SECRET,
    autocompletion: false,
    showDecorations: true,
    hideDecorationsOnStreamEnd: false,
    onLoading: (context) => {
      context.editor.commands.aiGenerationSetIsLoading(true);
      context.editor.commands.aiGenerationHasMessage(false);
    },
    onChunk: (context) => {
      context.editor.commands.aiGenerationSetIsLoading(true);
      context.editor.commands.aiGenerationHasMessage(true);
    },
    onSuccess: (context) => {
      context.editor.commands.aiGenerationSetIsLoading(false);
      context.editor.commands.aiGenerationHasMessage(!!context.response);
    },
  }),
];
