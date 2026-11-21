import {useId, useMemo, useRef, useState} from 'react';
import {SimpleTree, type CreateHandler, type DeleteHandler, type MoveHandler, type RenameHandler} from 'react-arborist';
import type {ReactTreeNode} from './types';

function cloneNodes<T extends ReactTreeNode>(nodes: readonly T[]): T[] {
  return nodes.map((node) => ({...node, ...(node.children && {children: cloneNodes(node.children)})}));
}

export function useDynamicTree<T extends ReactTreeNode>(initialData: readonly T[]) {
  const [data, setData] = useState(initialData);
  // SimpleTree 会修改子节点数组，克隆后操作，避免污染调用方传入的数据。
  const tree = useMemo(() => new SimpleTree<T>(cloneNodes(data)), [data]);
  const prefix = useId();
  const nextId = useRef(0);

  const onMove: MoveHandler<T> = ({dragIds, parentId, index}) => {
    for (const id of dragIds) tree.move({id, parentId, index});
    setData(tree.data);
  };
  const onRename: RenameHandler<T> = ({name, id}) => {
    tree.update({id, changes: {name} as Partial<T>});
    setData(tree.data);
  };
  const onCreate: CreateHandler<T> = ({parentId, index, type}) => {
    const node = {id: `${prefix}-tree-${nextId.current++}`, name: '', ...(type === 'internal' && {children: []})} as T;
    tree.create({parentId, index, data: node});
    setData(tree.data);
    return node;
  };
  const onDelete: DeleteHandler<T> = ({ids}) => {
    ids.forEach((id) => tree.drop({id}));
    setData(tree.data);
  };

  return {data, setData, controller: {onMove, onRename, onCreate, onDelete}} as const;
}
