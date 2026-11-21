import {Label, Checkbox, RadioGroup, RadioGroupItem, BadTooltip} from '@badnpm/ui';
import {useMemo, useState} from 'react';
import {type Active, closestCenter, closestCorners, pointerWithin, rectIntersection} from '@dnd-kit/core';
import {useShallow} from 'zustand/shallow';
import useDnDStore from '@/store/dnd-store';
import IconQuestion from '@/assets/svg/circle-question-mark.svg?react';
import DraggableOverlay from '../components/draggable-overlay';
import Droppable from '../components/droppable';
import DraggableItem from '../components/draggable-item';
import {useTranslation} from 'react-i18next';

const DragType = 'drag-type1';

export default function Drop() {
  const {t} = useTranslation();
  const {active, over, setCollisionDetection} = useDnDStore(
    useShallow((state) => ({
      active: state.active,
      over: state.over,
      setCollisionDetection: state.setCollisionDetection,
    }))
  );
  const [checkedDrops, setCheckedDrops] = useState<string[]>(['a', 'b']);
  const dropList = useMemo(() => {
    // 可在onDragEnd中判断哪些draggable能够放到哪些droppable
    const drops: Record<string, any>[] = [
      {id: 'a', label: 'drop a', data: {value: 'drop a', accepts: []}},
      {id: 'b', label: 'drop b', data: {value: 'drop b', accepts: []}},
      {id: 'c', label: 'drop c', data: {value: 'drop c', accepts: []}},
    ];
    drops.map((v) => {
      if (checkedDrops.includes(v.id)) {
        const w = {...v};
        w.data.accepts = [DragType];
        return w;
      }
      return v;
    });
    return drops;
  }, [checkedDrops]);
  const collisionOptions = useMemo<Array<{key: string; label: string; tip?: string; algorithm: any}>>(() => {
    return [
      {
        key: 'rectIntersection',
        label: t('lib.overlapDefault'),
        algorithm: rectIntersection,
        tip: t('lib.draggableDroppableOverlap'),
      },
      {key: 'pointerWithin', label: t('lib.mousePointer'), algorithm: pointerWithin, tip: t('lib.mouseInDroppable')},
      {
        key: 'closestCenter',
        label: t('lib.centerPoint'),
        algorithm: closestCenter,
        tip: t('lib.nearestDroppableByCenter'),
      },
      {key: 'closestCorners', label: t('lib.angle'), algorithm: closestCorners, tip: t('lib.nearestDroppableByCorner')},
    ];
  }, [t]);

  const disabledDrop = (dropData: Record<string, any>, active: Active | null) => {
    if (dropData?.accepts && active?.data?.current?.type && !dropData.accepts.includes(active.data.current.type))
      return true;
    return false;
  };

  const handleDropCheck = (checked: boolean, record: Record<string, any>) => {
    if (checked) {
      if (!checkedDrops.includes(record.id)) {
        setCheckedDrops([...checkedDrops, record.id]);
      }
    } else {
      setCheckedDrops(checkedDrops.filter((v) => v !== record.id));
    }
  };

  const DragItem = <DraggableItem data={{type: DragType}} id="drop-item" />;
  return (
    <div className="flex gap-2">
      <div className="flex min-w-0 flex-1 gap-2">
        <div className="grid flex-1 auto-rows-[320px] grid-cols-[repeat(2,minmax(100px,1fr))] gap-2">
          {dropList.map((v) => (
            <Droppable
              key={v.id}
              id={v.id}
              data={v.data}
              disabled={disabledDrop(v.data, active)}
              classname="px-4 py-2 border-1 rounded-md bg-card flex flex-col"
            >
              {v.label}
              {over?.id === v.id && DragItem}
            </Droppable>
          ))}
        </div>
        {/* over不为null说明被放到了某个droppable，那么肯定需要清除原有的dom */}
        <div className="w-[192px]">{!over && DragItem}</div>
        <DraggableOverlay adjustScale={false} />
      </div>
      <div className="w-100 flex-shrink-0 border-1 px-4 py-2">
        <div className="flex w-full flex-col gap-2 rounded-md border-1 p-2">
          <div className="flex items-center">
            <span>{t('lib.collisionBehavior')}</span>
          </div>
          <RadioGroup
            // 这儿不用value，因为setModifiers不是绑定的key
            defaultValue={collisionOptions[0].key}
            className="flex flex-wrap"
            onValueChange={(value) => {
              const collision = collisionOptions.find((v) => v.key === value);
              if (collision) setCollisionDetection(collision.algorithm);
            }}
          >
            {collisionOptions.map((v) => (
              <div key={v.key} className="flex items-center gap-1">
                <RadioGroupItem id={`collision_${v.key}`} value={v.key} />
                <Label htmlFor={`collision_${v.key}`}>
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
        <div className="mt-2 flex w-full flex-col gap-2 space-y-2 rounded-md border-1 p-2">
          <div className="flex items-center">
            <span>{t('lib.droppableArea')}</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {dropList.map((v) => (
              <Label key={v.id}>
                <Checkbox
                  checked={checkedDrops.includes(v.id)}
                  onCheckedChange={(checked: boolean) => handleDropCheck(checked, v)}
                />
                <span>{v.label}</span>
              </Label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
