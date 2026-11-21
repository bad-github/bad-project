import {cn} from '@badnpm/ui';
import {useCallback, useMemo, useRef, useState} from 'react';
import {FixedSizeList} from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import {debounce} from 'lodash-es';
import {getTodoData} from '../api';
import type {User} from '@workspace/mock';

const ITEM_HEIGHT = 64;
const BATCH_SIZE = 10;

/**
 * minimumBatchSize：每次加载数据时，最少的数量。即使当前只有一个未加载，它也会加载该size个
 * threshold：滚动到距离底部设置的数量之前，执行loadMoreItems触发预加载
 */

export default function InfiniteFixed() {
  const [items, setItems] = useState<(User | undefined)[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const loadingSet = useRef<Set<string>>(new Set());

  const isItemLoaded = useCallback(
    (index: number) => {
      return index < items.length && items[index] !== undefined;
    },
    [items]
  );
  // 在任何一个区间内，只要有未加载的项，就触发一次。所以加上防抖
  const loadItems = useCallback(async (startIndex: number, stopIndex: number) => {
    const key = `${startIndex}-${stopIndex}`;
    if (loadingSet.current.has(key)) return;
    try {
      loadingSet.current.add(key);
      /**
       * 0 19
       * 20 39
       * 40 59
       * 60 79
       * 61 81 // 滑动过快时，这是正常行为
       * 64 84
       */
      const res = await getTodoData(startIndex, stopIndex - startIndex + 1);
      if (res.code === 200) {
        const data = res.data.users;
        const total = res.data.total || 0;
        setTotalCount(total);
        // 只更新当前item，是没有总数据的
        setItems((prev) => {
          const updated = [...prev];
          for (let i = startIndex; i <= stopIndex && i < total; i++) {
            updated[i] = data[i - startIndex];
          }
          return updated;
        });
      }
    } finally {
      loadingSet.current.delete(key);
    }
  }, []);
  // eslint-disable-next-line react-hooks/refs -- debounce 仅保存回调，ref 在列表触发加载后才读取。
  const loadMoreItems = useMemo(() => debounce(loadItems, 300), [loadItems]);

  const safeItemCount = totalCount ?? BATCH_SIZE;

  return (
    <div>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={safeItemCount}
        loadMoreItems={loadMoreItems}
        threshold={5}
        minimumBatchSize={BATCH_SIZE}
      >
        {({onItemsRendered, ref}) => (
          <FixedSizeList
            height={500}
            itemCount={safeItemCount}
            itemSize={ITEM_HEIGHT}
            onItemsRendered={onItemsRendered}
            ref={ref}
            width="50%"
          >
            {({index, style}) => {
              const item = items[index];
              return (
                <div style={style}>
                  <div className={cn('flex h-full items-center px-4', index % 2 === 0 ? 'bg-card' : 'bg-muted')}>
                    {isItemLoaded(index) ? (
                      <div>
                        {item?.id}-{item?.name}
                      </div>
                    ) : (
                      'Loading...'
                    )}
                  </div>
                </div>
              );
            }}
          </FixedSizeList>
        )}
      </InfiniteLoader>
    </div>
  );
}
