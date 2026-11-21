import {expect, test, vi} from 'vitest';
import {createRef} from 'react';
import {renderToString} from 'react-dom/server';
import {TiptapEditorProvider, useTiptapEditor, type TiptapEditorRef} from '../src/provider/editor-provider';

function Probe({capture}: {capture: (value: ReturnType<typeof useTiptapEditor>) => void}) {
  capture(useTiptapEditor());
  return null;
}

test('深层子组件可读取完整外部配置、原始回调和 ref', () => {
  const ref = createRef<TiptapEditorRef>();
  const onChange = vi.fn();
  const capture = vi.fn();
  const props = {
    theme: 'dark' as const,
    initialContent: '<p>文章</p>',
    className: 'article',
    style: {height: 400},
    toolbar: <span>工具栏</span>,
    editable: false,
    onChange,
  };
  renderToString(
    <TiptapEditorProvider {...props} ref={ref}>
      <section><Probe capture={capture} /></section>
    </TiptapEditorProvider>
  );
  expect(capture.mock.calls[0][0]).toEqual({...props, ref});
  expect(capture.mock.calls[0][0].onChange).toBe(onChange);
});

test('嵌套 Provider 和兄弟组件的配置相互隔离', () => {
  const values: string[] = [];
  const capture = (value: ReturnType<typeof useTiptapEditor>) => values.push(`${value.className}:${value.editable}`);
  renderToString(
    <TiptapEditorProvider className="outer">
      <Probe capture={capture} />
      <TiptapEditorProvider className="inner" editable={false}>
        <Probe capture={capture} />
      </TiptapEditorProvider>
      <Probe capture={capture} />
    </TiptapEditorProvider>
  );
  expect(values).toEqual(['outer:true', 'inner:false', 'outer:true']);
});

test('独立渲染不会保留上一次传入的样式或回调', () => {
  renderToString(<TiptapEditorProvider className="old" onChange={vi.fn()}><span /></TiptapEditorProvider>);
  const capture = vi.fn();
  renderToString(<TiptapEditorProvider><Probe capture={capture} /></TiptapEditorProvider>);
  expect(capture.mock.calls[0][0]).toEqual({ref: undefined, editable: true});
});
