import type {NodeApi} from 'react-arborist';
import type {ReactTreeNode as TreeNode} from './types';
import type {ReactTreeLocale} from './locale';
import {toast, Input} from '@badnpm/ui';

type TNodeItemProps<T extends TreeNode> = {
  node: NodeApi<T>;
  locale: ReactTreeLocale;
};

export default function NodeItem<T extends TreeNode>({node, locale}: TNodeItemProps<T>) {
  const delEmptyNode = (emptyNode: NodeApi<T>) => {
    const parentNode = emptyNode.parent;
    if (emptyNode.id) {
      node.tree.delete(emptyNode.id);
    } else if (emptyNode.data.id) {
      node.tree.delete(emptyNode.data.id);
    }
    // 必须延迟触发，否则聚焦到整棵树的第一个节点。如果不删除节点，则默认仍是聚焦到当前操作的节点
    requestAnimationFrame(() => {
      if (parentNode?.id) {
        node.tree.focus(parentNode.id);
      } else if (parentNode?.data?.id) {
        node.tree.focus(parentNode.data.id);
      }
    });
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isCreating = node.data.isCreating;
    const value = e.currentTarget.value?.trim();
    if (isCreating) {
      if (value) {
        node.submit(value);
      } else {
        toast.add({title: locale.cannotCreateEmptyNode, type: 'error'});
      }
    } else {
      if (value) {
        node.submit(value);
      } else {
        toast.add({title: locale.cannotSaveEmptyNode, type: 'error'});
      }
    }
  };

  // 无论输入什么都需要重置且删除
  const handleEsc = (e: React.KeyboardEvent<HTMLInputElement>) => {
    node.reset();
    const isCreating = node.data.isCreating;
    const value = e.currentTarget.value?.trim();
    if (isCreating) {
      // 这儿视情况而定是否提示
      toast.add({title: locale.cannotCreateEmptyNode, type: 'error'});
      delEmptyNode(node);
    } else {
      // esc不需要submit节点
      if (!value) {
        toast.add({title: locale.cannotSaveEmptyNode, type: 'error'});
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const isCreating = node.data.isCreating;
    const value = e.currentTarget.value?.trim();
    if (isCreating) {
      if (value) {
        node.submit(value);
      } else {
        node.reset();
        toast.add({title: locale.cannotCreateEmptyNode, type: 'error'});
        delEmptyNode(node);
      }
    } else {
      if (value) {
        node.submit(value);
      } else {
        node.reset();
        toast.add({title: locale.cannotSaveEmptyNode, type: 'error'});
      }
    }
  };

  if (node.isEditing) {
    // 统一都用一个span包裹，保证此层级的元素都有span包裹
    return (
      <span className="h-full min-w-0 flex-1">
        <Input
          className="h-full focus-visible:ring-[1px]"
          autoFocus
          type="text"
          defaultValue={node.data.name}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={handleBlur}
          /* onKeyDown={e => {
          if (e.key === 'Escape') node.reset();
          if (e.key === 'Enter') node.submit(e.currentTarget.value);
        }} */
          /**
           * 默认行为，如上代码
           * (1)创建新节点：点击esc或enter任意字符（空字串）都会创建一个新节点
           * (2)编辑节点：点击esc会还原数据，点击enter会提交数据
           *    (2.1)在编辑时，submit会调用tree的onRename回调，所以需要处理onRename更新treeData
           *
           * 都可以进行异步操作，最佳实践：操作实时，异步同时执行，执行成功更新数据，执行失败回退并提示
           */
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') e.stopPropagation();
            if (e.key === 'Escape') handleEsc(e);
            else if (e.key === 'Enter') handleEnter(e);
          }}
        />
      </span>
    );
  }
  /**
   * 当内容较多时，无法做到换行后不影响布局的效果。因为它默认rowHeight=24，且每个item计算相对位置都是以24为间隔的。
   * 如果你强制让每个item的高度auto了，但是它计算的相对位置仍是24，所以布局还是混乱的
   * 所以解决方案只能是强制不换行
   */
  return <span className="!flex-shrink-1 truncate">{node.data.name}</span>;
}
