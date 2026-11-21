import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import {createLowlight} from 'lowlight';
import css from 'highlight.js/lib/languages/css';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import {ReactNodeViewRenderer} from '@tiptap/react';
import {CodeBlockComponent} from './code-block-component';

// 从空实例开始，只注册当前需要的四种语言，避免打入全量语言包。
const lowlight = createLowlight();

lowlight.register('html', html);
lowlight.register('css', css);
lowlight.register('js', js);
lowlight.register('ts', ts);
// 兼容已有文档中的完整语言名；别名不会额外加载语言包。
lowlight.registerAlias({html: ['xml'], js: ['javascript'], ts: ['typescript']});

export const CodeBlockLowlightExtension = [
  CodeBlockLowlight.extend({
    addNodeView() {
      return ReactNodeViewRenderer(CodeBlockComponent);
    },
  }).configure({lowlight}),
];
