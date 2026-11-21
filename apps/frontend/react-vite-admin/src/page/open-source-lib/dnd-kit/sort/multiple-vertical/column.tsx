import {LoadingOverlay} from '@badnpm/ui';
import {Button, BadTooltip, BadEmpty} from '@badnpm/ui';
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';

import SortableItem from '../../components/sortable-item';
import {ApiMap, DestinationNotAllowed, type TColumn} from '../../types';
import {BanIcon, XIcon} from 'lucide-react';
import IconQuestion from '@/assets/svg/circle-question-mark.svg?react';
import {useTranslation} from 'react-i18next';

type TProps = {
  type: string;
  dataMap: TColumn;
  disabled?: boolean;
  canDelete?: boolean;
  handleDelColumn?: (type: string) => void;
  handleItemAction?: (
    e: React.MouseEvent<HTMLButtonElement>,
    type: 'edit' | 'delete',
    data: Record<string, any>
  ) => void;
};
export default function Column(props: TProps) {
  const {t} = useTranslation();
  const {type, disabled, canDelete, dataMap: {data, isFetching} = {}, handleDelColumn, handleItemAction} = props;

  return (
    /**
     * 为什么我限制了只能垂直拖拽，还是能任意方向:
     * 一旦你声明了多个 SortableContext（多个 droppable 容器），dnd-kit 的默认逻辑就是：
     *    (1)拖动中的 item 可以被任意 droppable 容器接收。
     *    (2)strategy 仍然只负责“在容器内如何排序”，不会真正限制拖拽范围，modifiers 可以限制拖拽范围，
     *    所以你会看到 item 可以被拖到别的列里去。
     */
    <SortableContext items={(data || []).map((v) => v.id)} strategy={verticalListSortingStrategy}>
      <div className="flex h-full min-h-0 flex-col rounded-md border-1">
        <div className="bg-card flex h-10 items-center gap-2 rounded-tl-md rounded-tr-md border-b-1 px-2 font-bold">
          {type}
          {DestinationNotAllowed[type]?.tip && (
            <BadTooltip
              trigger={{
                render: <IconQuestion className="size-4 translate-y-[-1px] cursor-pointer" />,
              }}
              content={{children: DestinationNotAllowed[type].tip}}
            />
          )}
          {canDelete && (
            <Button size="icon" variant="ghost" className="mr-8 ml-auto size-7" onClick={() => handleDelColumn?.(type)}>
              <XIcon />
            </Button>
          )}
        </div>
        <LoadingOverlay text={t('common.loading')} loading={isFetching} className="min-h-0 flex-1">
          <div className="bg-muted relative flex h-full flex-col gap-2 overflow-auto p-2">
            {data && data?.length > 0 ? (
              data?.map((v) => (
                <SortableItem
                  key={v.id}
                  id={v.id}
                  data={v}
                  enableOverlay
                  style={{zIndex: 40}}
                  handle
                  handleProps={{style: {translate: '0 -50%'}}}
                  action
                  actionProps={{className: 'top-1/2 translate-y-[-50%] right-8'}}
                  handleAction={handleItemAction}
                  className="flex-shrink-0"
                >
                  <div
                    style={{borderColor: ApiMap[v.type]?.color, backgroundColor: 'var(--card)'}}
                    className="bg-card h-12 rounded-xs border-l-4 p-2 shadow-xs"
                  >
                    {v.id}
                  </div>
                </SortableItem>
              ))
            ) : (
              <BadEmpty text={t('common.no-data')} />
            )}
            {disabled && (
              <div className="text-destructive absolute inset-0 z-99 flex cursor-not-allowed items-center justify-center p-2 text-xl font-bold select-none">
                <BanIcon />
                {t('lib.notDroppable')}
              </div>
            )}
          </div>
        </LoadingOverlay>
      </div>
    </SortableContext>
  );
}
