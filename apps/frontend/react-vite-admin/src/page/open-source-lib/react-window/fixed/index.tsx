import {memo, useEffect, useMemo, useRef, useState} from 'react';
import {areEqual, FixedSizeList, type ListChildComponentProps} from 'react-window';
import {useMeasure} from 'react-use';
import {mockData1} from '../tool';
import {useTranslation} from 'react-i18next';

import {Button, Switch, cn} from '@badnpm/ui';

const Row = memo((props: ListChildComponentProps) => {
  const {index, style, data} = props;
  const id = data?.[index]?.id;
  const itemData = useMemo(() => data[index], [index, id]);

  return (
    <div style={style}>
      <div
        className={cn(
          'text-primary flex h-full flex-col items-center justify-center overflow-hidden font-medium',
          index % 2 === 0 ? 'bg-card' : 'bg-muted'
        )}
      >
        {itemData.id}-{itemData.name}
      </div>
    </div>
  );
}, areEqual);

export default function VirtualFixed() {
  const {t} = useTranslation();
  const [wrapperRef, {height = 12, width = 12}] = useMeasure<HTMLDivElement>();
  const [data, _setData] = useState(mockData1);
  const listRef = useRef<FixedSizeList>(null);
  const [layout, setLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const itemSizeMap = useMemo(() => {
    return {
      vertical: 64, // 垂直时每个元素的高度
      horizontal: 128, // 水平时每个元素的宽度
    };
  }, []);
  const heightMap = {
    vertical: height, // 垂直时虚拟列表的高度
    horizontal: '20%', // 水平时虚拟列表的高度
  };
  const widthMap = {
    vertical: '50%', // 垂直时虚拟列表的宽度
    horizontal: width, // 水平时虚拟列表的宽度
  };

  useEffect(() => {
    // setWidthMap({...widthMap, horizontal: width});
  }, [width]);

  return (
    <div>
      <div className="flex h-full">
        <div className="min-w-100 flex-1 pr-3" ref={wrapperRef}>
          <FixedSizeList
            // useIsScrolling
            layout={layout}
            ref={listRef}
            overscanCount={5}
            itemCount={data.length}
            itemSize={itemSizeMap[layout]}
            // 纵向滚动时高度只能是number，宽度可以是number | string。横向的width同理
            height={heightMap[layout]}
            width={widthMap[layout]}
            itemData={data}
          >
            {(props) => <Row {...props} />}
          </FixedSizeList>
        </div>
        <div className="w-100 flex-shrink-0 border-1 px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center">
              {layout === 'vertical' ? t('lib.vertical') : t('lib.horizontal')}&nbsp;
              <Switch
                checked={layout === 'vertical'}
                onCheckedChange={(v) => setLayout(v ? 'vertical' : 'horizontal')}
              />
            </div>
            <Button onClick={() => listRef?.current?.scrollToItem(99, 'start')}>
              {t('lib.scrollToNum', {num: 100})}
            </Button>
            <Button onClick={() => listRef?.current?.scrollTo(256)}>{t('lib.scrollPx', {value: '256px'})}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
