import {memo, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  areEqual,
  FixedSizeGrid,
  FixedSizeList,
  type GridChildComponentProps,
  type ListChildComponentProps,
} from 'react-window';
import {useMeasure} from 'react-use';
import {Label, RadioGroup, RadioGroupItem} from '@badnpm/ui';

const Cell = memo((props: GridChildComponentProps) => {
  const {rowIndex, columnIndex, style, data} = props;
  const itemData = useMemo(() => data[rowIndex][columnIndex], [rowIndex, columnIndex]);
  if (!itemData) return null;
  return (
    <div style={style} className="border p-2">
      <div className="bg-accent flex h-full w-full flex-col rounded-md border">
        <span>
          position: {rowIndex}-{columnIndex}
        </span>
        <span>name: {itemData.name}</span>
      </div>
    </div>
  );
}, areEqual);

const ListRow = memo((props: ListChildComponentProps & {columnCount: number; columnWidth: number}) => {
  const {index, style, data, columnCount, columnWidth} = props;
  const id = data?.[index]?.id;
  const rowData = useMemo<Record<string, any>[]>(() => data[index], [index, id]);
  return (
    <div style={style}>
      <div
        className="h-full"
        style={{display: 'grid', gridTemplateColumns: `repeat(${columnCount}, minmax(${columnWidth}px, 1fr))`}}
      >
        {rowData.map((v, index) => (
          <div className="border p-2">
            <div className="bg-accent flex h-full flex-col rounded-md border">
              <span>index: {index}</span>
              <span>name: {v.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}, areEqual);

/**
 * 网格虚拟列表，需要同时指定
 * rowCount:行数
 * columnCount:列数
 * rowHeight:行高
 * columnWidth:列宽
 */
const rowHeight = 160;
const columnWidth = 160;
const minColumnCount = 3;
const items = Array.from({length: 100}, (_, i) => ({id: i, name: `name-${i}`}));

export default function VirtualGrid() {
  const {t} = useTranslation();
  const [wrapperRef, {height = 12, width = 12}] = useMeasure<HTMLDivElement>();
  const options = useMemo(() => {
    return [
      {key: 'grid', label: t('lib.grid')},
      // 通过list实现grid布局，二维数组的长度就是list的size。唯一优势就是占满正行
      {key: 'list to grid', label: t('lib.listToGrid')},
    ];
  }, [t]);

  const [method, setMethod] = useState(options[0].key);
  const columnCount = useMemo(() => {
    // -8 滚动条的宽度
    return Math.max(Math.floor((width - 8) / columnWidth), minColumnCount);
  }, [width]);

  const gridItems = useMemo(() => {
    // 转为二维数组，需要加逗号防止TS解析为JSX
    const toGrid = <T,>(items: T[], columnCount: number) => {
      const grid: T[][] = [];
      for (let i = 0; i < items.length; i += columnCount) {
        grid.push(items.slice(i, i + columnCount));
      }
      const rowCount = grid.length;
      return {grid, columnCount, rowCount};
    };

    // 应该根据数据来计算列数
    return toGrid(items, columnCount).grid;
  }, [columnCount, items.length]);

  return (
    <div className="flex">
      {/* 不设置overflow，滚动条交给虚拟容器处理，否则在缩放页面时会出现两个滚动条 */}
      <div className="min-w-100 flex-1" ref={wrapperRef}>
        {method === 'list to grid' ? (
          <FixedSizeList
            layout="vertical"
            width="100%"
            overscanCount={2}
            height={height}
            itemSize={rowHeight}
            itemCount={gridItems.length}
            itemData={gridItems}
          >
            {(props) => <ListRow {...props} columnCount={columnCount} columnWidth={columnWidth} />}
          </FixedSizeList>
        ) : (
          <FixedSizeGrid
            itemData={gridItems}
            height={height}
            width={width}
            rowCount={gridItems.length}
            columnCount={columnCount}
            rowHeight={rowHeight}
            columnWidth={columnWidth}
          >
            {(props) => <Cell {...props} />}
          </FixedSizeGrid>
        )}
      </div>
      <div className="w-100 flex-shrink-0 border-1 px-4 py-2 text-sm">
        <div className="flex flex-col gap-1 border p-2">
          <span>{t('lib.method')}</span>
          <RadioGroup className="flex" value={method} onValueChange={setMethod}>
            {options.map((v) => (
              <div key={v.key} className="flex gap-1">
                <RadioGroupItem id={v.key} value={v.key} />
                <Label>{v.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
