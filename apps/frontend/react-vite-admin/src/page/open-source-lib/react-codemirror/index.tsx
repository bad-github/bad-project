import CodeMirror from '@uiw/react-codemirror';
import {vscodeDark, vscodeLight} from '@uiw/codemirror-theme-vscode';
import {cpp} from '@codemirror/lang-cpp';
import {mockData} from './tool';
import classes from './index.module.less';
import {useTheme} from '@/hooks/use-theme';

export default function ReactCodemirrorPage() {
  const {resolvedTheme: theme = 'light'} = useTheme();

  const handleCodeChange = (value: string) => {
    console.log(value);
  };
  return (
    <div>
      <CodeMirror
        className={classes.editor}
        style={{height: '100%', fontSize: 14}}
        theme={theme === 'light' ? vscodeLight : vscodeDark}
        extensions={[cpp()]}
        editable
        readOnly={false}
        value={mockData}
        onChange={handleCodeChange}
      />
    </div>
  );
}
