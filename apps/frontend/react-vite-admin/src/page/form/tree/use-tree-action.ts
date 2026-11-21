import {useCallback, useLayoutEffect, useRef, type Dispatch, type SetStateAction} from 'react';
import type {UseFormReturn} from 'react-hook-form';
import type {ControlType, FormSchema, TreeNode} from './schema';
import {appendChild, collectIds, createNode, findNode, removeNode} from './tool';

/** 树结构归 React 管，字段值归 RHF 管；这里只协调增删，不维护第二份表格数据。 */
export default function useTreeAction(
  nodes: TreeNode[],
  setNodes: Dispatch<SetStateAction<TreeNode[]>>,
  form: UseFormReturn<FormSchema>
) {
  const {setValue, unregister} = form;
  // 事件处理器读取最近一次提交的树，保持 deleteNode 引用稳定。
  // 否则每次增删都会重建列定义，TanStack 的 cell 渲染函数也会变化，导致无关控件重新挂载。
  const nodesRef = useRef(nodes);
  useLayoutEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  const addNode = useCallback(
    (type: ControlType, parentId?: string) => {
      const {node, value} = createNode(type);
      // 先准备字段值，再挂载单元格，首次挂载或虚拟滚动重新挂载时都能获得正确值。
      setValue(`values.${node.id}`, value, {shouldDirty: true});
      setNodes((current) => (parentId ? appendChild(current, parentId, node) : [...current, node]));
    },
    [setNodes, setValue]
  );

  const deleteNode = useCallback(
    (id: string) => {
      const node = findNode(nodesRef.current, id);
      if (!node) return;
      // 删除整棵子树的值、错误和 touched 状态，避免隐藏字段阻止提交。
      // 不使用 shouldUnregister:true：折叠行也会卸载控件，但折叠不应丢失值。
      unregister(collectIds(node).map((nodeId) => `values.${nodeId}` as const));
      setNodes((current) => removeNode(current, id));
    },
    [setNodes, unregister]
  );

  return {addNode, deleteNode};
}
