import {cn} from '@badnpm/ui';
import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {areEqual, type ListChildComponentProps, VariableSizeList} from 'react-window';
import {useMeasure} from 'react-use';
import {mockData2} from '../tool';

const Row = memo(
  (
    props: ListChildComponentProps & {
      handleSizeChange: (index: number, size: number) => void;
      itemSizeMap: Record<number, number>;
    }
  ) => {
    const {index, style, data, handleSizeChange, itemSizeMap} = props;
    const id = data?.[index]?.id;
    // 直接data[index]也可以，因为条件执行handleSizeChange，那么父组件不会重新render，则data的引用也是稳定的
    const itemData = useMemo(() => data[index], [index, id]);
    const itemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const timer = requestAnimationFrame(() => {
        if (itemRef.current) {
          const height = itemRef.current.offsetHeight;
          /**
           * 防止无限render：方案二
           * 若没有这个判断：则调用setItemSizeMap导致状态更新 => 触发父组件render => Row重新render => 再次调用handleSizeChange => setItemSizeMap
           */
          if (height !== itemSizeMap[index]) {
            handleSizeChange(index, height);
          }
        }
      });

      return () => cancelAnimationFrame(timer);
    }, []);

    return (
      <div style={style}>
        <div ref={itemRef} className={cn('flex flex-col p-2', index % 2 === 0 ? 'bg-card' : 'bg-muted')}>
          <div className="text-primary font-medium">
            {itemData.id}-{itemData.name}
          </div>
          <div>{itemData.text}</div>
        </div>
      </div>
    );
  },
  areEqual
);

export default function VirtualVariable() {
  const [wrapperRef, {height = 12}] = useMeasure<HTMLDivElement>();
  const [data, _setData] = useState(mockData2);
  // 可以扩展最小、最大尺寸
  const defaultItemSize = useMemo(() => 64, []);
  // 根据索引记录每个元素的高度
  const [itemSizeMap, setItemSizeMap] = useState<Record<number, number>>({0: defaultItemSize});
  const listRef = useRef<VariableSizeList>(null);

  const getItemSize = useCallback((index: number) => itemSizeMap[index] || defaultItemSize, [itemSizeMap]);

  const handleSizeChange = useCallback((index = 0, size = defaultItemSize) => {
    setItemSizeMap((prev) => {
      // 防止无限render：方案一
      if (prev[index] === size) {
        return prev;
      }
      return {...prev, [index]: size};
    });
    /**
     * VariableSizeList出于性能目的，缓存每个索引的偏移量和度量值。此方法清除指定索引之后（包括）所有项的缓存数据。每当项目的大小发生变化时，都应调用它
     * 默认情况下，该列表将在重置索引后自动重新渲染。如果你想延迟这个重新渲染，例如在父组件中完成状态更新，请为第二个可选参数指定一个值 false
     */
    listRef.current?.resetAfterIndex(index, false);
  }, []);

  console.log(itemSizeMap);

  return (
    <div>
      <div className="flex h-full">
        <div className="min-w-100 flex-1 pr-3" ref={wrapperRef}>
          <VariableSizeList
            layout="vertical"
            ref={listRef}
            overscanCount={5}
            itemCount={data.length}
            itemSize={getItemSize}
            height={height}
            width="50%"
            itemData={data}
          >
            {(props) => <Row {...props} handleSizeChange={handleSizeChange} itemSizeMap={itemSizeMap} />}
          </VariableSizeList>
        </div>
      </div>
    </div>
  );
}
