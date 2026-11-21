import {useTranslation} from 'react-i18next';
import {Loading} from '@badnpm/ui';
import {toast, BadEmpty} from '@badnpm/ui';
import {useEffect} from 'react';
import {rectSortingStrategy, SortableContext} from '@dnd-kit/sortable';
import {useQuery} from '@tanstack/react-query';
import useDnDStore from '@/store/dnd-store';
import {useShallow} from 'zustand/shallow';

import {getSortItems} from '../../api';
import SortableItem from '../../components/sortable-item';
import DraggableOverlay from '../../components/draggable-overlay';

export default function SortGrid() {
  const {t} = useTranslation();
  const {sortData, setSortData} = useDnDStore(
    useShallow((state) => ({
      sortData: state.sortData,
      setSortData: state.setSortData,
    }))
  );
  const {data, isLoading, isSuccess, isError, error} = useQuery({
    queryKey: ['sortItems'],
    retry: 0,
    queryFn: () => getSortItems({count: 30}),
  });
  useEffect(() => {
    if (isError) {
      toast.add({title: error?.message, type: 'error'});
      return;
    }
    if (isSuccess) {
      setSortData(data);
    }
  }, [isError, isSuccess]);

  if (isLoading) return <Loading text={t('common.loading')} />;
  if (!sortData || !sortData?.length) return <BadEmpty text={t('common.no-data')} type="page" />;
  return (
    <div className="overflow-auto">
      {/* rectSwappingStrategy：交换元素 */}
      <SortableContext items={sortData?.map((v) => v.id)} strategy={rectSortingStrategy}>
        <div className="grid auto-rows-[160px] grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
          {sortData.map((v, index) => (
            <SortableItem
              key={v.id}
              id={v.id}
              index={index}
              disabled={v.disabled}
              data={v}
              enableOverlay={true}
              className="bg-muted rounded-md border-1 p-2"
            >
              <div>
                [id:{v.id}]-[index:{index}]
              </div>
            </SortableItem>
          ))}
        </div>
        <DraggableOverlay>
          <div className="bg-muted h-full rounded-md border-1 p-2">overlay</div>
        </DraggableOverlay>
      </SortableContext>
    </div>
  );
}
