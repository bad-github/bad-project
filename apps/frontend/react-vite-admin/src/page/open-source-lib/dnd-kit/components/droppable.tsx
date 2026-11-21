import {cn} from '@badnpm/ui';
import React from 'react';
import {type UniqueIdentifier, useDroppable} from '@dnd-kit/core';
import {useTranslation} from 'react-i18next';

type TProps = {
  data?: Record<string, any>;
  disabled?: boolean;
  children: React.ReactNode;
  id: UniqueIdentifier;
  style?: React.CSSProperties;
  classname?: string;
};

export default function Droppable(props: TProps) {
  const {t} = useTranslation();
  const {data, children, id, style, classname, disabled} = props;
  const {isOver, setNodeRef} = useDroppable({id, data, disabled});

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative', classname, isOver && 'border-primary', disabled && 'cursor-not-allowed opacity-50')}
    >
      {disabled && `【${t('lib.notDroppable')}】`}
      {children}
    </div>
  );
}
