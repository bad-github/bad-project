import {useMemo} from 'react';
import {type NodeRendererProps} from 'react-arborist';
import {FileIcon, FolderIcon, FolderOpenIcon} from 'lucide-react';

import {cn} from '@badnpm/ui';
import FolderArrow from './folder-arrow';
import NodeItem from './node-item';
import Action from './action';

import type {ReactTreeNode} from './types';
import type {ReactTreeLocale} from './locale';

type TTreeNodeProps<T> = NodeRendererProps<T> & {
  showAction?: boolean;
  showLine?: boolean;
  showIcon?: boolean;
  locale: ReactTreeLocale;
};

export function TreeNode<T extends ReactTreeNode>(props: TTreeNodeProps<T>) {
  const {style, node, tree, dragHandle, preview: _preview, showAction, showLine, showIcon, locale} = props;
  // 拖拽源不需要强调显示，而是要关注拖拽的预览
  const isDragging = useMemo(() => node.isDragging, [node]);
  // 只有非叶子节点在被悬停时，拖拽放置目标才会有willReceiveDrop
  const isDropTarget = useMemo(() => node.willReceiveDrop, [node]);
  // 是否拥有键盘焦点（依次只有一个）
  const isFocused = useMemo(() => node.isFocused, [node]);
  // 是否选中（可以选中多个）
  const isSelected = useMemo(() => node.isSelected, [node]);
  // 是否编辑中
  const isEditing = useMemo(() => node.isEditing, [node]);
  // 是否允许编辑
  const isEditable = useMemo(() => node.isEditable, [node]);

  const Icon = useMemo(() => {
    if (node.data.icon) return node.data.icon;
    if (node.isLeaf) return FileIcon;
    return node.isOpen ? FolderOpenIcon : FolderIcon;
  }, [node]);

  return (
    <div
      ref={dragHandle}
      style={style}
      className={cn(
        'node',
        'flex h-full items-center gap-1 border-1 border-transparent [&>*]:flex-shrink-0',
        node.state, // 没有暴露是否可编辑的state，所以需要用类名显示样式
        // 可使用类名或index.css方式
        isSelected && !isEditing && 'bg-primary/20',
        !isSelected && !isDragging && 'hover:bg-muted',
        // isFocused && 'outline-none', // 无效，是内部父元素的tree-item有outline，可用renderRow自定义tree-item样式或使用css文件
        isFocused && !isEditing && 'border-primary', // 只有focus时才有border
        !isEditable && 'cursor-not-allowed opacity-50',
        isDropTarget && 'bg-accent',
        isDragging && 'opacity-50'
      )}
      // 可以取消默认行点击的展开、收起
      onClick={(e) => {
        if (node.isInternal) {
          e.stopPropagation();
          node.toggle();
        }
      }}
    >
      <FolderArrow node={node} indent={tree.indent} showLine={showLine} />
      {showIcon && (
        <span>
          <Icon className="size-4" />
        </span>
      )}
      <NodeItem node={node} locale={locale} />
      {showAction && <Action node={node} locale={locale} />}
    </div>
  );
}
export default TreeNode;
