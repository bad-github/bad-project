import type {Editor} from '@tiptap/react';
import type {Content, JSONContent} from '@tiptap/core';
import {createContext, useContext, type CSSProperties, type ReactNode} from 'react';

export type TiptapEditorChange = {
  json: JSONContent;
  html: string;
};

export type TiptapAppProps = {
  theme?: 'light' | 'dark' | 'system';
  /** 追加到编辑器根元素，保留内部样式类。 */
  className?: string;
  /** 编辑器根元素的行内样式。 */
  style?: CSSProperties;
  /** 仅用于初始化；后续内容替换可通过 ref 获取 editor 执行 setContent。 */
  initialContent?: Content;
  /** 不传时显示默认工具栏；传 null 隐藏，也可以传入自定义工具栏。 */
  toolbar?: ReactNode;
  /** 默认可编辑，支持运行时切换。 */
  editable?: boolean;
  /** 文档更新时触发；初始化、选区变化和只读切换不触发。 */
  onChange?: (content: TiptapEditorChange) => void;
};

export type TiptapEditorRef = {
  el: HTMLDivElement | null;
  getEditor: () => Editor | null;
  getHello: () => string | undefined;
  getHTML: () => string | undefined;
  getJSON: () => JSONContent | undefined;
  /** 默认触发 onChange；传 {emitUpdate: false} 可静默回填。未就绪时返回 false。 */
  setContent: (content: Content, options?: Parameters<Editor['commands']['setContent']>[1]) => boolean;
};

type TiptapEditorProviderProps = TiptapAppProps & {
  children: ReactNode;
  ref?: React.Ref<TiptapEditorRef>;
};

type TiptapEditorProviderState = TiptapAppProps & {
  ref: React.Ref<TiptapEditorRef> | undefined;
  editable: boolean;
};

const TiptapEditorContext = createContext<TiptapEditorProviderState>({ref: undefined, editable: true});

export function TiptapEditorProvider(props: TiptapEditorProviderProps) {
  const {children, ref, editable = true, ...config} = props;

  // 直接提供当前 props，避免复制到 store 后依赖 effect 同步而滞后一轮。
  // Provider 随 TiptapApp 创建，每个编辑器实例的配置相互隔离。
  const value = {...config, ref, editable};

  return <TiptapEditorContext.Provider value={value}>{children}</TiptapEditorContext.Provider>;
}

export const useTiptapEditor = () => {
  const context = useContext(TiptapEditorContext);
  if (context === undefined) throw new Error('useTiptapEditor must be used within a TiptapEditorProvider');
  return context;
};
