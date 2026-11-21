import {forwardRef} from 'react';
import {TiptapLib} from './page/entry';
import {ThemeProvider} from './provider/theme-provider';
import './styles/index.css';
import {TiptapEditorProvider, type TiptapEditorRef, type TiptapAppProps} from './provider/editor-provider';
export type {TiptapEditorRef, TiptapEditorChange, TiptapAppProps} from './provider/editor-provider';

export const TiptapApp = forwardRef<TiptapEditorRef, TiptapAppProps>((props, ref) => {
  return (
    <ThemeProvider defaultTheme={props.theme}>
      <TiptapEditorProvider {...props} ref={ref} initialContent={props.initialContent}>
        <TiptapLib />
      </TiptapEditorProvider>
    </ThemeProvider>
  );
});
