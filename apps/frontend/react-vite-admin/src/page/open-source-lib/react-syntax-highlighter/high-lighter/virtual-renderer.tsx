import {useMemo} from 'react';
import {FixedSizeList, type ListChildComponentProps} from 'react-window';
import {createElement} from 'react-syntax-highlighter';
import type {HLRendererProps} from './index';

type TVirtual = {
  rowHeight: number; // 每一行高度
  height?: number;
  overscanCount?: number;
  autoScrollBottom?: boolean; // 是否自动滚动到底部
};

const Row = ({index, style, rows, stylesheet, useInlineStyles}: ListChildComponentProps & HLRendererProps) => {
  const row = useMemo(() => rows[index], [rows, index]);
  return (
    <div style={{...style, padding: '0 12px', display: 'flex', alignItems: 'center'}}>
      {createElement({key: index, node: row, stylesheet, useInlineStyles})}
    </div>
  );
};

const VirtualRenderer = (props: HLRendererProps & TVirtual) => {
  const {rows, stylesheet, useInlineStyles, rowHeight, overscanCount = 16, height = 500} = props;

  // const listRef = useListRef(null);

  // 自动滚动的两种方案：react-window需要v2版本
  /* useInterval(() => {
    if (!listRef.current) return;
    if (scrollCount.current < rows.length) {
      listRef.current.scrollToRow({behavior: 'smooth', index: scrollCount.current});
      scrollCount.current += 10;
    }
  }, 200); */

  /* const throttled = throttle(() => {
    const element = listRef.current?.element;
    if (!element) return;
    listRef.current?.scrollToRow({behavior: 'smooth', index: rows.length - 1});
  }, 500);

  useEffect(() => {
    if (!autoScrollBottom) return;
    throttled();
  }, [rows.length]); */

  return (
    <FixedSizeList
      layout="vertical"
      itemSize={rowHeight}
      itemCount={rows.length}
      width="100%"
      height={height}
      overscanCount={overscanCount}
    >
      {(props) => <Row {...props} rows={rows} stylesheet={stylesheet} useInlineStyles={useInlineStyles} />}
    </FixedSizeList>
  );
};

export default VirtualRenderer;
