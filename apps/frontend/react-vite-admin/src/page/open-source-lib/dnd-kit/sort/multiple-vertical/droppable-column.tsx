import type {Data, UniqueIdentifier} from '@dnd-kit/core';
import React from 'react';
import SortableItem from '../../components/sortable-item';
import type {Disabled} from '@dnd-kit/sortable/dist/types';

type TProps = {
  id: UniqueIdentifier;
  disabled?: boolean | Disabled;
  data?: Data;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export default function DroppableColumn(props: TProps) {
  const {id, className, style, disabled, data, children} = props;
  return (
    <SortableItem
      className={className}
      style={style}
      id={id}
      data={data}
      disabled={disabled}
      enableOverlay
      handle
      handleProps={{className: 'top-[21px] right-2'}}
    >
      {children}
    </SortableItem>
  );
}
