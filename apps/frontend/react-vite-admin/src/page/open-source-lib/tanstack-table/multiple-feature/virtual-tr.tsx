import React from 'react';
import {type VirtualItem, Virtualizer} from '@tanstack/react-virtual';
import classes from './index.module.less';

interface TableBodyRowProps {
  virtualRow: VirtualItem;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
  children: React.ReactNode;
}

export default function VirtualTr(props: TableBodyRowProps) {
  const {virtualRow, rowVirtualizer, children} = props;
  return (
    <div
      className={classes.tr}
      data-index={virtualRow.index}
      ref={(node) => rowVirtualizer.measureElement(node as any)}
      style={{
        display: 'flex',
        position: 'absolute',
        transform: `translateY(${virtualRow.start}px)`,
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}
