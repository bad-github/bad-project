import {useRef} from 'react';
import {TiptapApp, type TiptapEditorRef} from '../App';
import {Button} from '../components/tiptap-ui-primitive/button';
import {demoContent} from './content';
import classes from './editor-demo.module.scss';

export function EditorDemo() {
  const editorRef = useRef<TiptapEditorRef | null>(null);

  return (
    <>
      <TiptapApp ref={editorRef} initialContent={demoContent} />
      <div className={classes.submitContainer}>
        <Button variant="primary" onClick={() => console.log(editorRef.current?.getJSON())}>
          submit
        </Button>
      </div>
    </>
  );
}
