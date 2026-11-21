'use client';
import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import {Tree, TreeApi} from 'react-arborist';
import type {CursorProps, DragPreviewProps} from 'react-arborist';
import {findNodesByIds} from './tool';
import {toast, cn} from '@badnpm/ui';
import {defaultTreeLocale, type ReactTreeLocale} from './locale';
import {useDynamicTree} from './use-dynamic-tree';

import TreeNode from './tree-node';
import type {ReactTreeNode} from './types';
import {useTranslation} from 'react-i18next';
export type {ReactTreeLocale} from './locale';
export type {ReactTreeNode} from './types';

export type ReactTreeProps<T> = {
  data: readonly T[];
  height?: number;
  locale?: Partial<ReactTreeLocale>;
  className?: string;
  openByDefault?: boolean;
  searchTerm?: string;
  disableMultiSelection?: boolean;
  selectionFollowsFocus?: boolean;
  showAction?: boolean;
  showLine?: boolean;
  showIcon?: boolean;
  setCreatingNodeId?: React.Dispatch<React.SetStateAction<string>>;
  setSelectData?: React.Dispatch<React.SetStateAction<T[]>>;
  setFocusedData?: React.Dispatch<React.SetStateAction<T | null>>;
  setActiveData?: React.Dispatch<React.SetStateAction<T | null>>;
};
function ReactTreeInner<T extends ReactTreeNode>(props: ReactTreeProps<T>, treeApiRef: React.Ref<TreeApi<T>>) {
  const {t} = useTranslation();
  const text: ReactTreeLocale = {
    ...defaultTreeLocale,
    ...Object.fromEntries(
      Object.entries(defaultTreeLocale).map(([key, fallback]) => [key, t(`lib.${key}`, {defaultValue: fallback})])
    ),
    ...props.locale,
  };
  const {
    data,
    className,
    height = 400,
    openByDefault = true,
    searchTerm,
    disableMultiSelection,
    selectionFollowsFocus,
    showAction,
    showLine,
    showIcon,
    setCreatingNodeId,
    setSelectData,
    setFocusedData,
    setActiveData,
  } = props;
  const treeApi = useRef<TreeApi<T> | null>(null);
  useImperativeHandle(treeApiRef, () => treeApi.current!, []);

  const {data: treeData, setData: setTreeData, controller} = useDynamicTree<T>(data || []);
  useEffect(() => {
    setTreeData(data);
  }, [data, setTreeData]);

  /**
   * 展示拖拽源要放到的位置。是相对于整棵树区域的绝对定位
   * indent：每一层缩进的单位宽度
   * left = 层数 * indent
   * 所以建议使用left
   */
  const MyCursor = ({top, left, indent: _indent}: CursorProps) => {
    return (
      <div
        className="border-accent pointer-events-none absolute h-0 border-t-2 border-dashed"
        style={{top, left, width: `calc(100% - ${left}px)`}}
      ></div>
    );
  };

  /**
   * offset：预览元素相对于窗口的位置偏移as
   * mouse：鼠标当前坐标
   * id：当前拖拽的节点id（单选拖拽）
   * dragIds：当前拖拽的所有节点id（多选拖拽）
   * isDragging：是否处于拖拽状态
   */
  const MyDragPreview = ({offset: _offset, mouse, id: _id, dragIds, isDragging}: DragPreviewProps) => {
    if (!isDragging || !mouse) return null;
    const style = {
      top: mouse.y,
      left: mouse.x,
      transform: 'translate(12px, 50%)', // 到鼠标右下方位置
      zIndex: 1000,
    };
    const classes =
      'fixed pointer-events-none px-2 py-1 border-1 border-primary bg-primary/20  rounded-full shadow text-xs opacity-70';
    // 单个拖拽显示名字
    if (dragIds.length === 1) {
      const node = findNodesByIds(treeData as any[], dragIds)?.[0];
      return (
        <div className={classes} style={style}>
          {node.name}
        </div>
      );
    }
    // 多个拖拽显示数量
    return (
      <div className={classes} style={style}>
        {dragIds.length}
      </div>
    );
  };

  return (
    <Tree
      className={cn('!w-full', className)}
      rowHeight={32}
      // 宽度可以指定百分比，默认是300px
      /**
       * 设置数字时：宽度可以精确
       * 设置百分比时：
       *    (1)因为默认开启了虚拟渲染，所以渲染多了一层，有两层都设置了宽度百分比
       *    (2)通过检查下元素，连续两层的宽度默认都是x%，所以会造成实际元素宽度是最外层的x%*1/2，于是在第二层即<Tree>设置w-full最高优先级。同时也兼容数字宽度
       */
      width="100%"
      //
      /**
       * 高度只能是数字，默认是500。且默认开启了虚拟滚动不可关闭
       * 默认的高度一定要给较大值，因为若tree在popover中，高度需要动态计算
       */
      height={height > 0 ? height : 400}
      overscanCount={6}
      indent={16}
      // 指定唯一表示，默认是id
      idAccessor="id"
      // 指定children，默认是children
      childrenAccessor="children"
      /* The "ghost" element that follows the mouse as you drag */
      ref={treeApi}
      data={treeData}
      openByDefault={openByDefault}
      searchTerm={searchTerm}
      // 选择受控，推荐使用treeApi的select方法，而不是手动控制
      // selection={selection}
      disableEdit={(node) => {
        return node.isReadonly === true;
      }}
      disableMultiSelection={disableMultiSelection}
      selectionFollowsFocus={selectionFollowsFocus}
      disableDrag={true}
      //  todo
      disableDrop={({parentNode: _parentNode}) => {
        // parentNode?.isLeaf ?? true
        return true;
      }}
      renderDragPreview={MyDragPreview}
      renderCursor={MyCursor}
      // 可以选中多个
      onSelect={(node) => {
        setSelectData?.(node.map((v) => v.data));
      }}
      onFocus={(node) => {
        setFocusedData?.(node.data);
      }}
      onActivate={(node) => {
        setActiveData?.(node.data);
      }}
      onToggle={(id) => {
        const node = treeApi.current?.get(id);
        toast.add({
          title: `[${node?.data.name}] ${node?.isOpen ? `${text.expand} (${text.supportsAsync})` : text.collapse}`,
          type: 'info',
        });
      }}
      // 下面四个方法都支持异步
      onMove={(params) => {
        controller.onMove(params);
      }}
      onRename={(params) => {
        controller.onRename(params);
      }}
      onCreate={(params) => {
        // 若type="internal"则创建非叶子节点
        const currentNode = controller.onCreate({...params, type: params.type});
        if (!(currentNode instanceof Promise) && currentNode && currentNode.id) {
          setCreatingNodeId?.(currentNode.id); // 用一个变量维护也可以，但需要层层传递给props，所以推荐使用下面方式
          // 标识当前节点是正在创建中的
          Object.assign(currentNode, {isCreating: true});
        }
        return currentNode;
      }}
      onDelete={(params) => {
        controller.onDelete(params);
      }}
      // copy源码里面的DefaultRow，暴露出来以便自定义一些样式
      renderRow={({node, attrs, children, innerRef}) => {
        return (
          <div
            {...attrs}
            ref={innerRef}
            className={cn(node.isFocused && 'outline-none')}
            onFocus={(e) => e.stopPropagation()}
            onClick={(e) => {
              node.handleClick(e);
              // 还可以加自己的处理逻辑
            }}
            /* onKeyDown={e => {
                // 受控组件需要自己控制编辑态的变换
                if (node.isFocused && e.key === 'Enter') node.edit();
                // 删除多个：todo
                if (e.key === 'Delete') controller.onDelete({ids: [node.id], nodes: [node]});
              }} */
          >
            {children}
          </div>
        );
      }}
    >
      {/* 若不需要传递额外属性，可以这样使用 */}
      {/* {TreeNode} */}
      {(props) => (
        <TreeNode<T> {...props} locale={text} showAction={showAction} showLine={showLine} showIcon={showIcon} />
      )}
    </Tree>
  );
}
const ReactTreeBase = forwardRef(ReactTreeInner);
const ReactTree = ReactTreeBase as <T extends ReactTreeNode>(
  props: ReactTreeProps<T> & {ref?: React.Ref<TreeApi<T>>}
) => React.ReactElement | null;
export {ReactTree};
