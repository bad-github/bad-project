import type {NodeApi} from 'react-arborist';
import type {ReactTreeNode as TreeNode} from './types';
import {useMemo} from 'react';
import {ChevronDownIcon, ChevronRightIcon} from 'lucide-react';

type TFolderArrowProps<T extends TreeNode> = {
  node: NodeApi<T>;
  indent: number;
  showLine?: boolean;
};

export default function FolderArrow<T extends TreeNode>({node, indent, showLine}: TFolderArrowProps<T>) {
  // 必须返回一个span空标签而不是null，给占位元素，父元素的gap样式才会体现出层级效果
  /**
   * 必须返回一个span空标签而不是null，给占位元素。有两个作用
   * (1)保证每个item其实都有展开收起的空间，这样就会保证除去展开收起icon后内容是对齐的
   * (2)父元素的gap样式时，子元素数量相等，间隔用去的空间就像等
   */

  const offset = useMemo(() => 7, []);
  if (node.isLeaf)
    return (
      <span className="relative size-4 h-full">
        {showLine &&
          Array.from({length: node.level}, (_, i) => (
            <span
              key={i}
              style={{right: (i + 1) * indent + offset}}
              className="bg-border absolute top-[-1px] bottom-[-1px] w-[1px]"
            />
          ))}
      </span>
    );
  if (node.isOpen)
    return (
      <span className="relative flex size-4 h-full items-center">
        <ChevronDownIcon className="hover:bg-accent size-4 hover:cursor-pointer hover:rounded-full"></ChevronDownIcon>
        {showLine && node.level > 0 && (
          <span style={{right: indent + offset}} className="bg-border absolute top-[-1px] bottom-[-1px] w-[1px]"></span>
        )}
      </span>
    );
  return <ChevronRightIcon className="hover:bg-accent size-4 hover:cursor-pointer hover:rounded-full" />;
}
