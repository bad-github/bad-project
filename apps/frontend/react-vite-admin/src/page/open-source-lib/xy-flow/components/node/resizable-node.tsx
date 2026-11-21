import './index.css';
import {memo} from 'react';
import {Handle, NodeResizeControl, NodeResizer, Position, type Node, type NodeProps} from '@xyflow/react';
import {MoveDiagonal2Icon} from 'lucide-react';
import {NodeType} from '../../types';

type TData = {
  label?: string;
  childrenRender?: React.ReactNode | ((props: any) => React.ReactNode);
  resize?: 'selected';
};
/**
 * resize
 *    selected: 被选择时才允许缩放
 */
export type TResizableNode = Node<TData, typeof NodeType.resizableNode>;

const ResizableNode = (props: NodeProps<TResizableNode>) => {
  const {
    data: {label, resize, childrenRender},
    type,
    isConnectable,
    selected,
  } = props;
  return (
    <>
      {resize === 'selected' ? (
        // 选中时可缩放
        <NodeResizer minWidth={100} minHeight={30} isVisible={selected} />
      ) : (
        // 随时可缩放
        <NodeResizeControl
          // 需要设置z-index，防止children顶层也是定位元素，如果children顶层不是定位元素则不需要设置
          style={{border: 'none', backgroundColor: 'transparent', zIndex: 100}}
          // 没看出这两个的属性的作用，反而在style设置样式可以生效
          minWidth={100}
          minHeight={50}
        >
          <MoveDiagonal2Icon className="size-4 cursor-nwse-resize absolute right-0 bottom-0" />
        </NodeResizeControl>
      )}

      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      {typeof childrenRender === 'function' ? childrenRender({type, label}) : childrenRender}
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </>
  );
};

export default memo(ResizableNode);
export const ResizableNodeType = {
  [NodeType.resizableNode]: ResizableNode,
};
