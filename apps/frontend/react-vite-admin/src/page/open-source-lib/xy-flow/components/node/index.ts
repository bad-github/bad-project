import {NodeType} from '../../types';
import CommonNode from './common-node';
import ConnectionLimitNode from './connection-limit-node';
import MultipleSourceNode from './multiple-source-node';
import PlaceholderNode from './placeholder-node';
import ResizableNode from './resizable-node';

export const NodeTypeComponent = {
  [NodeType.commonNode]: CommonNode,
  [NodeType.multipleSourceNode]: MultipleSourceNode,
  [NodeType.resizableNode]: ResizableNode,
  [NodeType.connectionLimitNode]: ConnectionLimitNode,
  [NodeType.placeholderNode]: PlaceholderNode,
};
