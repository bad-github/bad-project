import {Loading} from '@badnpm/ui';
import {toast, Label, Checkbox, RadioGroup, RadioGroupItem, BadTooltip, BadEmpty} from '@badnpm/ui';
import {useEffect, useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {
  rectSortingStrategy,
  SortableContext,
  type SortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {closestCenter, type CollisionDetection, MeasuringStrategy, type Modifiers} from '@dnd-kit/core';
import {restrictToFirstScrollableAncestor, restrictToVerticalAxis, restrictToWindowEdges} from '@dnd-kit/modifiers';
import {useTranslation} from 'react-i18next';
import {useShallow} from 'zustand/shallow';
import useDnDStore from '@/store/dnd-store';
import IconQuestion from '@/assets/svg/circle-question-mark.svg?react';
import {getSortItems} from '../../api';
import DraggableOverlay from '../../components/draggable-overlay';
import SortableItem from '../../components/sortable-item';

export default function SortVertical() {
  const {t} = useTranslation();
  const [enableOverlay, setEnableOverlay] = useState(true);
  const [disabledFirst, setDisabledFirst] = useState(false);
  const [handle, setHandle] = useState(false);
  const [action, setAction] = useState(false);

  const {sortData, setSortData, setModifiers, strategy, setStrategy, setCollisionDetection, setMeasuring} = useDnDStore(
    useShallow((state) => ({
      sortData: state.sortData,
      setSortData: state.setSortData,
      setModifiers: state.setModifiers,
      strategy: state.strategy,
      setStrategy: state.setStrategy,
      setCollisionDetection: state.setCollisionDetection,
      setMeasuring: state.setMeasuring,
    }))
  );
  const {data, isLoading, isSuccess, isError, error} = useQuery({
    queryKey: ['sortItems'],
    retry: 0,
    queryFn: () => getSortItems({count: 20}),
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

  const modifiersOption = useMemo<
    Array<{
      key: string;
      label: string;
      tip?: string;
      modifiers: Modifiers;
      strategy?: SortingStrategy;
      collisionDetection?: CollisionDetection;
    }>
  >(() => {
    return [
      /**
       * 任意方向拖拽
       * strategy：若没设置拖拽到（没使用overlay）底部时会无限变换
       * collisionDetection：若没设置横向拖拽时，拖拽（没使用overlay）距离超出拖拽元素宽度时就会回到原位置
       */
      {
        key: 'none',
        label: t('lib.unlimited'),
        modifiers: [],
        strategy: rectSortingStrategy,
        collisionDetection: closestCenter,
      },
      {
        key: 'vertical',
        label: t('lib.vertical'),
        tip: t('lib.scrollBottomCanContinue'),
        modifiers: [restrictToVerticalAxis, restrictToWindowEdges],
        strategy: verticalListSortingStrategy,
        collisionDetection: closestCenter,
      },
      {
        key: 'firstScrollAncestor',
        label: t('lib.firstScrollableAncestor'),
        tip: t('lib.scrollBottomCannotContinue'),
        modifiers: [restrictToFirstScrollableAncestor],
        strategy: verticalListSortingStrategy,
        collisionDetection: closestCenter,
      },
    ];
  }, [t]);

  useEffect(() => {
    setStrategy(modifiersOption[0].strategy);
    setCollisionDetection(modifiersOption[0].collisionDetection);
  }, []);

  useEffect(() => {
    setMeasuring(action ? {droppable: {strategy: MeasuringStrategy.Always}} : undefined);
  }, [action]);

  const handleAction = (e: React.MouseEvent<HTMLButtonElement>, type: 'edit' | 'delete', data: Record<string, any>) => {
    e.stopPropagation();
    switch (type) {
      case 'edit':
        toast.add({title: `${t('common.edit')} [${data.name}]`, type: 'info'});
        break;
      case 'delete': {
        /**
         * 删除有动画需要设置：useSortable-animateLayoutChanges、DndContext-measuring
         */
        toast.add({title: `${t('common.delete')} [${data.name}]`, type: 'info'});
        const res = sortData?.filter((v) => v.id !== data.id) || [];
        setSortData([...res]);
        break;
      }
      default:
        break;
    }
  };
  if (isLoading) return <Loading text={t('common.loading')} />;
  if (!sortData || !sortData?.length) return <BadEmpty text={t('common.no-data')} type="page" />;
  return (
    <div className="flex gap-2">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <SortableContext items={sortData.map((v) => v.id)} strategy={strategy}>
          <div className="grid w-100 grid-cols-1 space-y-2">
            {sortData.map((v, index) => (
              <SortableItem
                key={v.id}
                id={v.id}
                index={index}
                disabled={v.disabled}
                data={v as any}
                enableOverlay={enableOverlay}
                handle={handle}
                action={action}
                handleAction={handleAction}
                className="bg-muted h-20 rounded-md border-1 p-2"
              >
                <div>
                  [id:{v.id}]-[index:{index}]
                </div>
              </SortableItem>
            ))}
          </div>
          {enableOverlay && (
            <DraggableOverlay>
              <div className="bg-muted h-20 rounded-md border-1 p-2">{t('lib.overlay')}</div>
            </DraggableOverlay>
          )}
        </SortableContext>
      </div>
      <div className="w-100 flex-shrink-0 border-1 px-4 py-2">
        <div className="flex flex-wrap gap-2">
          <Label className="flex items-center gap-1 rounded-md border-1 p-2">
            <Checkbox checked={enableOverlay} onCheckedChange={(checked: boolean) => setEnableOverlay(checked)} />
            {t('lib.customOverlay')}
            <BadTooltip
              trigger={{
                render: <IconQuestion className="size-4" />,
              }}
              content={{children: t('lib.customOverlayBehavior')}}
            />
          </Label>
          <Label className="flex items-center gap-1 rounded-md border-1 p-2">
            <Checkbox checked={handle} onCheckedChange={(checked: boolean) => setHandle(checked)} />
            {t('lib.setDragTarget')}
            <BadTooltip
              trigger={{
                render: <IconQuestion className="size-4" />,
              }}
              content={{children: t('lib.defaultDragWholeCard')}}
            />
          </Label>
          <Label className="flex items-center gap-1 rounded-md border-1 p-2">
            <Checkbox
              checked={disabledFirst}
              onCheckedChange={(checked: boolean) => {
                setDisabledFirst(checked);
                setSortData(
                  sortData.map((v, index) => ({
                    ...v,
                    disabled: checked && index === 0,
                  }))
                );
              }}
            />
            {t('lib.disableFirst')}
          </Label>
          <Label className="flex items-center gap-1 rounded-md border-1 p-2">
            <Checkbox checked={action} onCheckedChange={(checked: boolean) => setAction(checked)} />
            {t('lib.showActions')}
            <BadTooltip
              trigger={{
                render: <IconQuestion className="size-4" />,
              }}
              content={{children: t('lib.dragTargetRequired')}}
            />
          </Label>
          <div className="flex w-full flex-col gap-2 rounded-md border-1 p-2">
            <div className="flex items-center">
              <span>{t('lib.dragBehavior')}</span>
            </div>
            <RadioGroup
              defaultValue={modifiersOption[0].key}
              className="flex flex-wrap"
              onValueChange={(value) => {
                const entity = modifiersOption.find((v) => v.key === value);
                if (entity) {
                  setModifiers(entity.modifiers);
                }
              }}
            >
              {modifiersOption.map((v) => (
                <div key={v.key} className="flex items-center gap-1">
                  <RadioGroupItem id={`modifier_${v.key}`} value={v.key} />
                  <Label htmlFor={`modifier_${v.key}`}>
                    {v.label}
                    {v.tip && (
                      <BadTooltip
                        trigger={{
                          render: <IconQuestion className="size-4" />,
                        }}
                        content={{children: v.tip}}
                      />
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
