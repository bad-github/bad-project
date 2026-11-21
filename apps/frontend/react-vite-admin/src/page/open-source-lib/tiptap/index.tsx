import {useTheme} from '@/hooks/use-theme';
import {demoContent, TiptapApp, type TiptapEditorRef} from '@workspace/editor';
import {useEffect, useRef} from 'react';

/**
 * import '@workspace/editor/editor.css';
 * 当前工作区通过 Vite 别名使用源码，TiptapApp 内部已导入样式，无需重复引入。
 * 消费发布包时，需显式导入上面的成品 CSS。
 */

export default function TipTapPage() {
  const {resolvedTheme: theme = 'light'} = useTheme();
  const editorRef = useRef<TiptapEditorRef | null>(null);

  useEffect(() => {
    console.log(editorRef.current?.getEditor());
  }, []);

  return (
    <div>
      <TiptapApp theme={theme} ref={editorRef} initialContent={demoContent} />
    </div>
  );
}
