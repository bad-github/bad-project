import {createElement} from 'react-syntax-highlighter';
import type {HLRendererProps} from './index';

const SimpleRenderer = (props: HLRendererProps) => {
  const {rows, stylesheet, useInlineStyles} = props;
  return <>{rows.map((node, index) => createElement({key: index, node, stylesheet, useInlineStyles}))}</>;
};

export default SimpleRenderer;
