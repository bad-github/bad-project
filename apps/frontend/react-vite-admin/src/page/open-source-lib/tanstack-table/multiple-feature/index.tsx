import {type RefObject, useMemo, useRef, useState} from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {useMeasure} from 'react-use';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {restrictToHorizontalAxis, restrictToParentElement} from '@dnd-kit/modifiers';
import {arrayMove, horizontalListSortingStrategy, SortableContext} from '@dnd-kit/sortable';
import useScrollable from '@/hooks/use-scrollable';
import ExpandCell from '@/components/tanstack/expand-cell';
import DragTh from './drag-th';
import {TableBody} from './table-body';
import {makeData, type Person} from '../tool';
import classes from './index.module.less';

/**
 * 表格布局
 * (1)表头与表体分成两部分
 * (2)表头的包裹容器需要设置最大宽度
 *     (2.1)设置overflow-x:hidden，隐藏横向滚动条（但仍能通过鼠标滚轴或触控板手势滚动），也可设置滚动条高度为0
 *     (2.2)设置overflow-y:scroll，强制滚动对齐，注意表头滚动条的宽度必须和表体宽度一致，通过css变量实现
 * (3)表体包裹容器需要设置最大高度，width:'100%'
 *     (2.1)需要设置overflow:auto
 * (4)表头需要跟随表体滚动，通过scrollLeft实现
 */

export default function MultipleFeatureTable() {
  const [data, _setData] = useState(() => makeData(500, 10, 5));
  const [expanded, setExpanded] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [tableWrapperRef, {height}] = useMeasure<HTMLDivElement>();
  const {ref: tbodyWrapperRef, isScrollable, scrollbarWidth} = useScrollable();
  const tbodyScrollXRef = useRef<HTMLDivElement>(null);
  const theadWrapperRef = useRef<HTMLDivElement>(null);

  // 表体滚动的最大距离必须设置
  const scrollStyle = {
    maxHeight: height ? height - 32 : 400,
    // marginRight: isScrollable ? -scrollbarWidth : 0
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {distance: 4},
    }),
    useSensor(TouchSensor, {
      activationConstraint: {delay: 100, tolerance: 4},
    })
  );

  const columns = useMemo<ColumnDef<Person>[]>(() => {
    return [
      {
        size: 200,
        id: 'firstName',
        accessorKey: 'firstName',
        header: 'First Name',
        cell: (cellProps) => (
          <ExpandCell
            addSubRows={() => {
              console.log('动态展开');
              return Promise.resolve();
            }}
            {...cellProps}
          />
        ),
      },
      {
        size: 200,
        id: 'lastName',
        accessorKey: 'lastName',
        header: 'Last Name',
      },
      {
        size: 200,
        id: 'email',
        accessorKey: 'email',
        header: 'Email',
      },
      {
        size: 200,
        id: 'age',
        accessorKey: 'age',
        header: 'Age',
      },
      {
        size: 200,
        id: 'gender',
        accessorKey: 'gender',
        header: 'Gender',
      },
      {
        size: 200,
        id: 'progress',
        accessorKey: 'progress',
        header: 'Progress',
      },
      {
        size: 200,
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
      },
    ];
  }, []);
  const [columnOrder, setColumnOrder] = useState<string[]>(columns.map((c) => c.id!));

  const table = useReactTable({
    defaultColumn: {
      size: 100,
      maxSize: 500,
    },
    data,
    columns,
    state: {
      expanded, // 折叠
      columnOrder, // 表格列拖拽排序
      sorting, // 行排序
    },
    columnResizeMode: 'onChange',
    getSubRows: (row) => row.subRows,
    onExpandedChange: setExpanded,
    onColumnOrderChange: setColumnOrder,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    // 动态加载
    // getRowCanExpand: (row) => row.original.hasPayload,
    getSortedRowModel: getSortedRowModel(),
  });

  const columnSizingInfo = table.options.state?.columnSizingInfo;
  const columnSizing = table.options.state?.columnSizing;

  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: {[key: string]: number} = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!;
      colSizes[`--header-${header.id}-size`] = header.getSize();
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return colSizes;
  }, [columnSizingInfo, columnSizing]);

  // 表头和表体是分开的，表头需要跟随表体滚动
  const handleBodyScroll = () => {
    if (!tbodyWrapperRef.current || !theadWrapperRef.current) return;
    const scrollLeft = tbodyWrapperRef.current.scrollLeft;
    if (!theadWrapperRef.current) return;
    theadWrapperRef.current.scrollLeft = scrollLeft;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (tbodyWrapperRef.current) {
      tbodyWrapperRef.current.style.overflowY = 'scroll';
    }
    const {active, over} = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      const nextOrderIds = arrayMove(columnOrder, oldIndex, newIndex);
      setColumnOrder(nextOrderIds);
      // 需要更新列顺序
      // const col = new Map(columns.map(col => [col.id, col]));
      // setAllColumnsMap({[kind]: nextOrderIds.map(id => colMap.get(id)).filter(Boolean)});
    }
  };

  return (
    <DndContext
      autoScroll={{
        threshold: {
          x: 0.1, // 横向：距离边缘 10% 时触发滚动
          y: 0, // 彻底禁用上下自动滚动
        },
      }}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
      onDragStart={() => {
        if (tbodyWrapperRef.current) {
          tbodyWrapperRef.current.style.overflowY = 'hidden';
        }
      }}
    >
      <div className={classes.featureTable}>
        <div className={classes.tableWrapper} ref={tableWrapperRef}>
          {/* 通常是这里设置表格宽度table.getTotalSize()，但现在为了滚动布局将表头和表体分开了，所以需要分别设置 */}
          <div className={classes.table} style={{...columnSizeVars}}>
            <div
              ref={theadWrapperRef}
              className={classes.thead}
              style={{
                ...({'--th-scroll-width': isScrollable ? `${scrollbarWidth}px` : 0} as any),
              }}
            >
              {table.getHeaderGroups().map((headerGroup) => {
                return (
                  <div key={headerGroup.id} className={classes.tr}>
                    <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                      {headerGroup.headers.map((header) => (
                        <DragTh key={header.id} header={header} />
                      ))}
                    </SortableContext>
                  </div>
                );
              })}
            </div>
            <div
              className={classes.tbodyWrapper}
              ref={tbodyWrapperRef}
              style={{maxHeight: scrollStyle.maxHeight, overflow: 'auto'}}
              onScroll={handleBodyScroll}
            >
              <div ref={tbodyScrollXRef} style={{width: table.getTotalSize(), position: 'relative'}}>
                {/* 必须包裹一层设置总宽度，要保证虚拟滚动的父容器是一个稳定的引用 */}
                {tbodyWrapperRef.current && (
                  <TableBody
                    columnOrder={columnOrder}
                    table={table}
                    parentRef={tbodyWrapperRef as RefObject<HTMLDivElement>}
                    isResizing={table.getState().columnSizingInfo.isResizingColumn}
                  />
                )}
              </div>
              {table.getRowModel().rows.length === 0 && (
                <div style={{border: '1px solid transparent', width: table.getTotalSize()}}></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
