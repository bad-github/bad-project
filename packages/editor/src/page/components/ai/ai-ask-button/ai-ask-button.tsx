import {AiAskButton, canPerformAiAsk} from '@workspace/editor/components/tiptap-ui/ai-ask-button';
import {useConfig} from '@workspace/editor/provider/config-provider';
import type {Editor} from '@tiptap/react';

export function GAiAskButton({editor}: {editor: Editor}) {
  const {showText, showShortcut, hideWhenUnavailable} = useConfig();

  const canTriggerAi = canPerformAiAsk(editor);
  if (canTriggerAi) {
    console.log('AI assistance is available for the current selection');
  }
  return (
    <AiAskButton
      editor={editor}
      text={showText ? 'Ask AI' : ''}
      hideWhenUnavailable={hideWhenUnavailable}
      showShortcut={showShortcut}
      // 需要安装AiMenu才会渲染对话框
      onAiAsked={() => console.log('AI assistance triggered!')}
    />
  );
}
