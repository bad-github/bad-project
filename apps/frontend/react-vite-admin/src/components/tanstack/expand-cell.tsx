import {LoadingArea} from '@badnpm/ui';
import {useState} from 'react';
import type {CellContext, Row} from '@tanstack/react-table';

import {ChevronDown, ChevronRight} from 'lucide-react';

type TProps = CellContext<any, any> & {
  addSubRows?: (row: Record<string, any>) => Promise<void>;
  getRowId?: (row: Record<string, any>) => string;
};

export default function ExpandCell(props: TProps) {
  const {row, getValue, addSubRows, getRowId} = props;
  const rowId = getRowId?.(row.original);
  const [loadingMap, setLoadingMap] = useState<Map<string, boolean>>(new Map());

  const handleToggle = async (_e: React.MouseEvent, row: Row<any>) => {
    const nativeToggle = row.getToggleExpandedHandler();
    // 待展开
    const isWillExpand = !row.getIsExpanded();
    if (
      addSubRows &&
      isWillExpand &&
      row.getCanExpand() &&
      (!row.original.subRows || row.original.subRows.length === 0)
    ) {
      if (rowId) {
        setLoadingMap((prev) => new Map(prev).set(rowId, true));
        try {
          await addSubRows?.(row.original);
        } finally {
          setLoadingMap((prev) => prev.set(rowId, false));
        }
      }
    }
    nativeToggle();
  };

  return (
    <div style={{paddingLeft: `${row.depth * 16}px`, display: 'flex', alignItems: 'center', gap: 4}}>
      {row.getCanExpand() ? (
        <button type="button" disabled={rowId ? loadingMap.get(rowId) : false} onClick={(e) => handleToggle(e, row)}>
          {rowId && loadingMap.get(rowId) ? <LoadingArea /> : row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
        </button>
      ) : (
        <ChevronDown style={{opacity: 0, flexShrink: 0}} />
      )}
      <span style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>{getValue<string>()}</span>
    </div>
  );
}
