import {useDroppable} from '@dnd-kit/core';

import {Button, cn} from '@badnpm/ui';
import {TrashIcon} from 'lucide-react';
import {useTranslation} from 'react-i18next';

export default function Trash({id}: {id: string}) {
  const {t} = useTranslation();
  const {setNodeRef, isOver} = useDroppable({id});
  return (
    <div
      ref={setNodeRef}
      className={cn('flex h-full min-h-0 items-center justify-center rounded-md border-1', isOver && 'border-primary')}
    >
      <Button variant="outline">
        <TrashIcon />
        {t('lib.dragHereToDelete')}
      </Button>
    </div>
  );
}
