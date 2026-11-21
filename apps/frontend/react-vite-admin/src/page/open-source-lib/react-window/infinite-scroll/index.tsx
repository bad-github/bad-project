import {Loading} from '@badnpm/ui';
import {Button, cn, BadEmpty} from '@badnpm/ui';
import {useEffect, useState, useRef, useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {ChevronsDownIcon} from 'lucide-react';

import {getTodoData} from '../api';
import type {User} from '@workspace/mock';

export default function InfiniteScroll() {
  const {t} = useTranslation();
  const [items, setItems] = useState<User[]>([]);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState({pageNum: 1, pageSize: 20, total: 0});
  const [loading, setLoading] = useState(false);
  const [initRequest, setInitRequest] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const loadMore = async (pageNum?: number) => {
    if (items.length > 0 && items.length >= page.total) return;
    pageNum = pageNum || page.pageNum + 1;
    try {
      setLoading(true);
      setPage((prev) => ({...prev, pageNum}));
      const res = await getTodoData((pageNum - 1) * page.pageSize, page.pageSize);
      if (res.code === 200) {
        const data = res.data.users;
        const total = res.data.total || 0;
        setItems((prev) => [...prev, ...data]);
        setPage((prev) => ({...prev, total}));
      }
    } finally {
      setLoading(false);
      setInitRequest(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitRequest(true);
    loadMore(1);
  }, []);

  const hasMore = useMemo(() => items.length < page.total && page.total > 0, [items.length, page.total]);

  useEffect(() => {
    const target = loaderRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        console.log(entries[0].isIntersecting, 'entries[0].isIntersecting');
        if (entries[0].isIntersecting && hasMore) loadMore();
      },
      {
        root: ref?.current, // 默认是和视口的交叉
        threshold: 0, // 元素进入视口的比例，0表示刚进入视口，1表示完全进入，范围0-1
        /**
         * 该元素距离视口128px时：entries[0].isIntersecting=true
         * 注意是相对于视口的，若观察的元素有父容器且有滚动条，不会生效。需要将root设置为父容器
         */
        rootMargin: '128px',
      }
    );
    // 观察loaderRef.current元素
    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
    // items数据变化需要重新观察
  }, [hasMore, items.length]);

  return (
    <div className="flex gap-2">
      <div className="h-full w-1/2 overflow-auto" ref={ref}>
        {items.map((v, index) => (
          <div key={index} className={cn('flex h-16 items-center px-4', index % 2 === 0 ? 'bg-card' : 'bg-muted')}>
            {v.id}-{v.name}
          </div>
        ))}
        {hasMore || initRequest ? (
          <div ref={loaderRef} className="border-primary flex h-16 items-center justify-center border-1">
            {/* 自动触发加载更多 */}
            {loading ? <Loading text={t('common.loading')} /> : `ready to ${t('common.loadMore')}`}
          </div>
        ) : (
          <div className="border-primary flex h-16 items-center justify-center border-1">
            <BadEmpty text={t('common.no-data')} />
          </div>
        )}
      </div>
      <div className="h-full w-1/2 overflow-auto">
        {items.map((v, index) => (
          <div key={index} className={cn('flex h-16 items-center px-4', index % 2 === 0 ? 'bg-card' : 'bg-muted')}>
            {v.id}-{v.name}
          </div>
        ))}
        {hasMore || initRequest ? (
          <div className="border-primary flex h-16 items-center justify-center border-1">
            {loading ? (
              <Loading text={t('common.loading')} />
            ) : (
              <>
                <span>{t('common.loadMore')}</span>
                {/* 手动触发加载更多 */}
                <Button className="size-7 rounded-md" variant="ghost" size="icon" onClick={() => loadMore()}>
                  <ChevronsDownIcon />
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="border-primary flex h-16 items-center justify-center border-1">
            <BadEmpty text={t('common.no-data')} />
          </div>
        )}
      </div>
    </div>
  );
}
