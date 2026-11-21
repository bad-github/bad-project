import {EditorContent, useCurrentEditor} from '@tiptap/react';
import {useTheme} from '@workspace/editor/provider/theme-provider';
import ToolBar from '../tool-bar';
import {TableNodeContent} from '../node/table-node';
import {TocNodeContent} from '../node/toc-node';
import classes from './editor.module.scss';
import {useEffect, useImperativeHandle, useRef} from 'react';
import {useTiptapEditor} from '@workspace/editor/provider/editor-provider';

export default function TiptapEditor() {
  const {editor} = useCurrentEditor();
  const {setRootElement} = useTheme();
  const {ref, toolbar, editable, className, style} = useTiptapEditor();
  const elRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    if (elRef.current) {
      setRootElement(elRef.current);
    }
  }, [setRootElement]);

  useImperativeHandle(ref, () => ({
    el: elRef.current,
    getEditor: () => editor,
    getHello: () => 'hello',
    getHTML: () => editor?.getHTML(),
    getJSON: () => editor?.getJSON(),
    setContent: (content, options) => {
      if (!editor || editor.isDestroyed) return false;
      return editor.commands.setContent(content, options);
    },
  }));

  return (
    <div ref={elRef} className={[classes.editorPage, 'tiptap-editor', className].filter(Boolean).join(' ')} style={style}>
      <div className={classes.editorContainer}>
        {editable && (toolbar === undefined ? <ToolBar /> : toolbar)}
        <EditorContent editor={editor} className={classes.editorContent} />
        {editable && <TableNodeContent />}
        <TocNodeContent />
      </div>
    </div>
  );
}
