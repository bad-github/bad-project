import {Loading} from '@badnpm/ui';
import {toast, BadEmpty} from '@badnpm/ui';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  type Active,
  type CancelDrop,
  closestCenter,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  getFirstCollision,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {arrayMove, horizontalListSortingStrategy, SortableContext} from '@dnd-kit/sortable';
import {useQueries, useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';

import {useConfirmDialog} from '@/hooks/use-confirm-dialog';
import {getSortItems, getSortTypes} from '../../api';
import Column from './column';
import DraggableOverlay from '../../components/draggable-overlay';
import DroppableColumn from './droppable-column';
import {ApiMap, DestinationNotAllowed, PLACEHOLDER_ID, type TColumn, TRASH_ID, type TSortItem} from '../../types';
import AddColumn from './add-column';
import Trash from './trash';
import {coordinateGetter} from './multipleContainersKeyboardCoordinates';
import {restrictToWindowEdges} from '@dnd-kit/modifiers';
import {text} from '@workspace/utils';

export default function SortMultipleVertical() {
  const {t} = useTranslation();
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    })
  );
  const [active, setActive] = useState<Active | null>(null);
  const [allData, setAllData] = useState<Record<string, TColumn>>({});
  const [cloneData, setCloneData] = useState<Record<string, TColumn> | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [serveTypes, setServeTypes] = useState<string[]>([]);
  const recentlyMovedToNewContainer = useRef(false);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const {confirm, Dialog} = useConfirmDialog();

  // 请求列类型
  const {data, isError, isFetching, isSuccess, error} = useQuery({queryKey: ['sortTypes'], queryFn: getSortTypes});
  useEffect(() => {
    if (isError) {
      toast.add({title: error?.message, type: 'error'});
      return;
    }
    if (isSuccess) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTypes(data);
      setServeTypes(data);
    }
  }, [isError, isSuccess]);
  // 请求每一列的数据
  const queries = useQueries({
    queries: types.map((type) => ({
      // 若查询依赖变量，则建议声明
      queryKey: ['sortItems', type],
      queryFn: () => getSortItems({type, count: ApiMap[type]?.count || 0}),
      enabled: !!types && types.length > 0 && serveTypes.includes(type),
    })),
  });
  /* const queryData = (types ?? []).reduce((pre, cur, index) => {
    pre[cur] = {data: [], isFetching: false};
    pre[cur]['data'] = queries[index]?.data || [];
    pre[cur]['isFetching'] = queries[index]?.isFetching;
    return pre;
  }, {} as Record<string, TColumn>); */

  useEffect(() => {
    if (!types?.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAllData((prev) => {
      const next = {...prev};
      types.forEach((type, index) => {
        next[type] = {
          ...next[type],
          data: queries[index]?.data || [],
          /**
           * 惰性查询时（使用enabled）一开始就会处于status: 'loading'。所以要判断是第一次请求时使用isInitialLoading，派生于isLoading && isFetching
           * isFetching表示是否正在刷新请求
           */
          isFetching: queries[index]?.isFetching ?? false,
        };
      });
      return next;
    });
  }, [types, JSON.stringify(queries.map((q) => q.data)), JSON.stringify(queries.map((q) => q.isFetching))]);

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [allData]);
  const getIndex = (id: UniqueIdentifier, items: TSortItem[] = []) => items.findIndex((v) => v.id === id);
  const isColumn = (id: UniqueIdentifier, types: string[] = []) => types.includes(id as string);
  const findColumn = (id: UniqueIdentifier, types: string[] = [], dataMap: Record<string, TColumn>) => {
    // 如果是整个列的id
    if (types.includes(id as string)) return id;
    // 如果是某一个item的id
    return types.find((type) => dataMap[type].data?.some((v) => v.id === id));
  };
  const disableDrop = (column: string): boolean => {
    if (!active) return false;
    const activeType = active.data.current?.type;
    if (!activeType || !DestinationNotAllowed[column]) return false;
    return DestinationNotAllowed[column].notAccepts.includes(activeType);
  };

  const handleDelColumn = useCallback((type: string) => {
    setTypes((prev) => prev.filter((v) => v !== type));
  }, []);

  const handleItemAction = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, type: 'edit' | 'delete', data: Record<string, any>) => {
      e.stopPropagation();
      switch (type) {
        case 'edit':
          toast.add({title: `${t('common.edit')} [${data.name}]`, type: 'info'});
          break;
        case 'delete': {
          /**
           * 删除有动画需要设置：useSortable-animateLayoutChanges、DndContext-measuring
           */
          toast.add({title: `${t('common.delete')} [${data.name}]`, type: 'info'});
          const column = findColumn(data.id, types, allData);
          if (column) {
            setAllData((prev) => {
              const next = {...prev};
              next[column].data = next[column].data?.filter((v) => v.id !== data.id);
              return next;
            });
          }
          break;
        }
        default:
          break;
      }
    },
    [allData, types, t]
  );

  const handleCancelDrop: CancelDrop = async (args) => {
    const {active, over} = args;
    // 返回false，仍然允许其他拖拽
    if (over?.id !== TRASH_ID) return false;
    // confirm的确定取消，默认resolve(boolean)
    // 当放置到垃圾桶才二次确认
    const confirmed = await confirm({
      title: t('common.tip'),
      message: `${t('common.confirmDelete')} ${active.id || active.data?.current?.name}`,
    });
    return !confirmed;
  };
  const handleDragStart = (e: DragStartEvent) => {
    setCloneData(allData);
    setActive(e.active);
  };
  const handleDragCancel = () => {
    console.log('drag cancel');
    if (cloneData) {
      setAllData(cloneData);
      setCloneData(null);
    }
    setActive(null);
  };
  const handleDragOver = (e: DragEndEvent) => {
    const {active, over} = e;
    // 先根据携带的数据确定
    let overColumn = over?.data?.current?.type;
    let activeColumn = active?.data?.current?.type;
    const overId = over?.id;
    const activeId = active?.id;
    // 列拖动使用onDragEnd：因为SortContext已经实现了顺序变换的效果，只需要在end时更新数据就可以
    if (!overId || isColumn(activeId, types)) return;
    if (overId === TRASH_ID) {
      // 进入垃圾箱时撤销经过其他列产生的临时移动，保留快照供取消删除时恢复。
      if (cloneData) {
        setAllData(cloneData);
      }
      return;
    }
    /**
     * (1)若不存在type
     * (2)当前列找不到，则根据id找
     *    考虑仅前端交互时：拖拽某列元素到另一列，但是type没变
     *    实际场景是：拖拽结束后需要请求接口更新数据，type也会随之变化
     */
    if (!overColumn || !allData[overColumn].data.some((v) => v.id === overId)) {
      if (overId) {
        overColumn = findColumn(over.id, types, allData);
      }
    }
    if (!activeColumn || !allData[activeColumn].data.some((v) => v.id === activeId)) {
      if (activeId) {
        activeColumn = findColumn(active.id, types, allData);
      }
    }
    if (!activeColumn || !overColumn) return;
    // 一个item从一列拖拽到另一列，在这个时刻就已经改变各列的items数据了。若拖拽到另一列没放下，再在此列上下拖拽，则不再继续更新数据（有自带的上下移动效果）
    if (activeColumn && activeColumn === overColumn) return;
    if (disableDrop(overColumn)) {
      toast.add({title: `${activeId} ${t('lib.dragNotAllowedTo')} ${overColumn} ${t('lib.column')}`, type: 'info'});
      return;
    }
    setAllData((prev) => {
      const activeItems = prev[activeColumn].data;
      const overItems = prev[overColumn].data;
      const activeIndex = getIndex(activeId, activeItems);
      const overIndex = getIndex(overId, overItems);
      let newIndex: number;
      if (isColumn(overId, types)) {
        // (1)拖入到空列
        console.log('overId in empty column', overItems);
        newIndex = overItems.length + 1;
      } else {
        // (2)拖入到数据列
        newIndex = overIndex >= 0 ? overIndex : overItems.length + 1;
        console.log(over, 'overId in data column');
      }
      recentlyMovedToNewContainer.current = true;
      if (!newIndex && newIndex !== 0) return prev;
      return {
        ...prev,
        [activeColumn]: {
          ...prev[activeColumn],
          data: activeItems.filter((v) => v.id !== activeId),
        },
        [overColumn]: {
          ...prev[overColumn],
          data: [...overItems.slice(0, newIndex), activeItems[activeIndex], ...overItems.slice(newIndex)],
        },
      };
    });
  };
  const handleRequest = (
    overColumn: UniqueIdentifier,
    active: Active,
    activeColumn: UniqueIdentifier,
    overItems: TSortItem[]
  ) => {
    const activeType = active.data.current?.type;
    if (activeType === overColumn) {
      console.log(overItems);
      toast.add({title: `${t('common.requestApi')}: ${t('common.refresh')}[${overColumn}]`, type: 'info'});
    } else {
      console.log(overItems, allData[activeType].data);
      toast.add({
        title: `${t('common.requestApi')}: ${t('common.refresh')}[${activeType}]、[${activeColumn}]`,
        type: 'info',
      });
    }
  };
  const handleDragEnd = (e: DragEndEvent) => {
    const {over, active} = e;
    const overId = over?.id;
    const activeId = active?.id;
    if (!overId || !activeId) return;
    // 这里通过id去找，因为dragEnd触发不会很频繁，所以findColumn不会有太大性能消耗，而dragOver建议先使用type
    const overColumn = findColumn(overId, types, allData);
    const activeColumn = findColumn(activeId, types, allData);
    if (!activeColumn) return;
    setActive(null);
    if (overId === TRASH_ID) {
      // todo：拖拽到垃圾桶时，原数据的item被删除没有动画
      // (1)拖入到垃圾桶：在拖到垃圾桶的过程中可能在over时已经更新到其他列中了。当然也可以加一个垃圾桶的列放到types中
      setAllData((prev) => {
        const next = {...prev};
        next[activeColumn].data = next[activeColumn].data.filter((v) => v.id !== activeId);
        return next;
      });
      toast.add({
        title: `${t('common.requestApi')}: ${t('common.refresh')}[${active?.data?.current?.type}]`,
        type: 'info',
      });
    } else if (overId === PLACEHOLDER_ID) {
      // (2)拖入到占位列
    } else if (isColumn(overId, types)) {
      // (3)容器列之间的拖拽
      setTypes((pre) => {
        const overIndex = pre.indexOf(overId as string);
        const activeIndex = pre.indexOf(activeId as string);
        return arrayMove(pre, activeIndex, overIndex);
      });
    } else if (activeColumn === overColumn) {
      // (4)同列之间的拖拽：一列拖到另一列在dargOver时就更新了数据保证他们在同一列中。
      const activeIndex = getIndex(activeId, allData[activeColumn].data);
      const overIndex = getIndex(overId, allData[overColumn].data);
      // 加一个type判断兼容场景：a列的第一个元素拖动到b列的第一个元素
      if (activeIndex !== overIndex || active.data.current?.type !== overColumn) {
        setAllData((prev) => {
          const overItems = arrayMove(prev[overColumn].data, activeIndex, overIndex);
          handleRequest(overColumn, active, activeColumn, overItems);
          return {
            ...prev,
            [overColumn]: {
              ...prev[overColumn],
              data: overItems,
            },
          };
        });
      }
    }
  };
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      // (1)拖动的是列本身
      if (active?.id && isColumn(active.id, types)) {
        return closestCenter({
          ...args,
          // 只保留容器列droppable
          droppableContainers: args.droppableContainers.filter((v) => isColumn(v.id, types)),
        });
      }
      // (2)拖动的是列中的卡片
      // 检查鼠标位置在哪些 droppable 区域内
      const pointerIntersections = pointerWithin(args);
      // 如果鼠标没碰到任何 droppable（例如鼠标在卡片空隙中），就退回用 rectIntersection（基于矩形重叠的判定方式）
      const intersections = pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);
      // 当前鼠标指向的 droppable 容器 ID
      let overId = getFirstCollision(intersections, 'id');
      if (overId) {
        // (3)鼠标在回收站上
        if (overId === TRASH_ID) return intersections;
        // (4)鼠标在列容器上
        if (isColumn(overId, types)) {
          const columnItems = allData[overId]?.data;
          /**
           * 【重要】
           * 若该列有卡片，则找出距离最新的卡片。
           * 如果不设置这个，那么如果放置的目标是列中非卡片元素，则overId其实是列的id，而不是卡片的id
           */
          if (columnItems?.length > 0) {
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (v) => v.id !== overId && columnItems?.some((w) => w.id === v.id)
              ),
            })[0]?.id;
          }
        }
        lastOverId.current = overId;
        return [{id: overId}];
      }
      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = active?.id as any;
      }
      return lastOverId.current ? [{id: lastOverId.current}] : [];
    },
    [active, allData, types]
  );

  if (isFetching) return <Loading text={t('common.loading')} />;
  if (!types || !types?.length) return <BadEmpty text={t('common.no-data')} type="page" />;

  // console.log(active?.data?.current, active?.data?.current?.type, 'multiple-vertical');
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      modifiers={[restrictToWindowEdges]}
      cancelDrop={handleCancelDrop}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid auto-cols-[240px] grid-flow-col gap-4 overflow-x-auto">
        <SortableContext items={types} strategy={horizontalListSortingStrategy}>
          {types.map((v) => (
            <DroppableColumn key={v} id={v} data={{type: v}} className="min-h-0" disabled={{droppable: disableDrop(v)}}>
              <Column
                canDelete={!serveTypes.includes(v)}
                type={v}
                dataMap={allData[v]}
                disabled={disableDrop(v)}
                handleDelColumn={handleDelColumn}
                handleItemAction={handleItemAction}
              />
            </DroppableColumn>
          ))}
          <AddColumn
            addColumn={() => {
              const addCode = text.getNextChar(types[types.length - 1]);
              setTypes([...types, addCode]);
            }}
          />
          <Trash id={TRASH_ID} />
          {/* <div
            onClick={async () => {
              const column = findColumn('D6', types, allData);
              if (column) {
                setAllData(prev => {
                  return {
                    ...prev,
                    [column]: {
                      ...prev[column],
                      data: prev[column].data.filter(v => v.id !== 'D6')
                    }
                  };
                });
              }
            }}
          >
            测试按钮
          </div> */}
        </SortableContext>
      </div>
      <DraggableOverlay adjustScale={false} zIndex={40}>
        {active ? (
          types.includes(active.id as string) ? (
            <div className="h-full">
              <DroppableColumn
                key={active.id}
                id={active.id}
                data={{type: active.id}}
                disabled
                className="h-full"
                style={{opacity: 1}}
              >
                <Column type={active.id as string} dataMap={allData[active.id]} />
              </DroppableColumn>
            </div>
          ) : (
            <div
              style={{borderColor: ApiMap[active?.data?.current?.type]?.color}}
              className="bg-card h-12 border-l-4 p-2 rounded-xs shadow-xs"
            >
              {active?.id}
            </div>
          )
        ) : null}
      </DraggableOverlay>
      {Dialog}
    </DndContext>
  );
}
