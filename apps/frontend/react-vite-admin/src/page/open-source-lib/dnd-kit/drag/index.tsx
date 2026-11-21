import {Label, Checkbox, RadioGroup, RadioGroupItem, cn, BadTooltip} from '@badnpm/ui';
import {useMemo, useState} from 'react';
import type {Modifier, Modifiers, PointerActivationConstraint} from '@dnd-kit/core';
import {
  restrictToHorizontalAxis,
  restrictToVerticalAxis,
  restrictToWindowEdges,
  restrictToParentElement,
  restrictToFirstScrollableAncestor,
  createSnapModifier,
  snapCenterToCursor,
} from '@dnd-kit/modifiers';
import {useTranslation} from 'react-i18next';
import {useShallow} from 'zustand/shallow';
import IconQuestion from '@/assets/svg/circle-question-mark.svg?react';
import useDnDStore from '@/store/dnd-store';
import DraggableOverlay from '../components/draggable-overlay';
import DraggableItem from '../components/draggable-item';

export default function Drag() {
  const {t} = useTranslation();
  const {coordinates, modifiers, setModifiers, activationConstraint, setActivationConstraint} = useDnDStore(
    useShallow((state) => ({
      coordinates: state.coordinates,
      modifiers: state.modifiers,
      setModifiers: state.setModifiers,
      activationConstraint: state.activationConstraint,
      setActivationConstraint: state.setActivationConstraint,
    }))
  );
  const [gridSize, _] = useState(30);
  // 是否启用dnd的overlay渲染：若启用那么在拖拽时目标就应该保留在原位置（即不应用各种style），然后自定义一个拖拽过程中的浮层
  const [enableOverlay, setEnableOverlay] = useState(false);
  const [handle, setHandle] = useState(false);
  const constraints = useMemo<
    Array<{key: string; label: string; tip: string; value: PointerActivationConstraint}>
  >(() => {
    return [
      {key: 'euclidean', label: t('lib.euclideanDistance'), tip: t('lib.moveAnyAngle'), value: {distance: 96}},
      {key: 'horizontal', label: t('lib.horizontalDistance'), tip: t('lib.moveHorizontal'), value: {distance: {x: 96}}},
      {key: 'vertical', label: t('lib.verticalDistance'), tip: t('lib.moveVertical'), value: {distance: {y: 48}}},
    ];
  }, [t]);
  const delayConstraint = useMemo<PointerActivationConstraint>(() => ({delay: 1000, tolerance: 96}), []);
  // 每次拖拽移动的距离都是gridSize的倍数
  const snapToGrid = useMemo<Modifier>(() => createSnapModifier(gridSize), [gridSize]);
  const modifiersOption = useMemo<Array<{key: string; label: string; tip?: string; modifiers: Modifiers}>>(() => {
    return [
      {key: 'none', label: t('lib.unlimited'), modifiers: []},
      {key: 'horizontal', label: t('lib.horizontal'), modifiers: [restrictToHorizontalAxis]},
      {key: 'vertical', label: t('lib.vertical'), modifiers: [restrictToVerticalAxis]},
      // ref绑定元素的上层元素就是父容器
      {key: 'parent', label: t('lib.dragWithinParent'), modifiers: [restrictToParentElement]},
      {
        key: 'firstScrollAncestor',
        label: t('lib.firstScrollableAncestor'),
        modifiers: [restrictToFirstScrollableAncestor],
        tip: t('lib.dragRightOrDown'),
      },
      // 只能在浏览器窗口内拖动，边界是浏览器可视区域
      {key: 'window', label: t('lib.browserWindow'), modifiers: [restrictToWindowEdges]},
      {key: 'grid', label: t('lib.grid'), modifiers: [snapToGrid], tip: t('lib.dragStepGridMultiple')},
      {
        key: 'center',
        label: t('lib.mouseCentered'),
        modifiers: [snapCenterToCursor],
        tip: t('lib.dragMouseAutoCenter'),
      },
    ];
  }, [snapToGrid, t]);

  const endStyle = useMemo<React.CSSProperties>(
    () => ({position: 'relative', left: coordinates.x, top: coordinates.y}),
    [coordinates]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 text-sm">
        {t('lib.scrollableAncestor')}
        <BadTooltip
          trigger={{
            render: <IconQuestion className="size-4" />,
          }}
          content={{children: t('lib.setAncestorOverflowVisible')}}
        />
      </div>
      <div className="flex min-h-0 flex-1 gap-2">
        <div
          className={cn(
            'min-w-0 flex-1 border-1',
            modifiers?.[0] === restrictToFirstScrollableAncestor ? 'overflow-auto' : 'overflow-visible'
          )}
        >
          <div className="flex items-center gap-1 text-sm">
            <span>{t('lib.firstScrollableAncestor')}</span>
          </div>
          {/* 
            拖拽的默认行为：就算没有设置modifiers，在遇到滚动祖先也会限制在该区域内
            解决办法：
            (1)不设置modifiers
            (2)将所有祖先元素的overflow设置为visible 
          */}
          <div className="relative m-2 h-1/2 border-1">
            {modifiers?.[0] === snapToGrid && <div className="bg-grid" style={{'--grid-size': `${gridSize}px`}}></div>}

            <div className="text-sm">{t('lib.parentElement')}</div>
            {/* 在父容器上拖拽时不包裹组件 */}
            <DraggableItem
              id="draggable-item"
              wrapper={modifiers?.[0] !== restrictToParentElement}
              handle={handle}
              endStyle={enableOverlay ? {} : endStyle}
            />
            {enableOverlay && <DraggableOverlay />}
          </div>
        </div>
        <div className="w-100 flex-shrink-0 border-1 px-4 py-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Label className="flex items-center gap-1 rounded-md border-1 p-2">
              <Checkbox checked={handle} onCheckedChange={(checked: boolean) => setHandle(checked)} />
              {t('lib.setDragTarget')}
              <BadTooltip
                trigger={{
                  render: <IconQuestion className="size-4" />,
                }}
                content={{children: t('lib.setDragTargetTip')}}
              />
            </Label>
            <Label className="flex items-center gap-1 rounded-md border-1 p-2">
              <Checkbox
                // 需要用!!消除控制台警告：若初始渲染是undefined，则组件会认为是非受控组件，而onCheckedChange后下次checked={true}，现在变成了受控组件
                checked={
                  !!activationConstraint &&
                  'delay' in activationConstraint &&
                  JSON.stringify(activationConstraint) === JSON.stringify(delayConstraint)
                }
                onCheckedChange={(checked: boolean) => setActivationConstraint(checked ? delayConstraint : undefined)}
              />
              {t('lib.longPressDrag')}
              <BadTooltip
                trigger={{
                  render: <IconQuestion className="size-4" />,
                }}
                content={{children: t('lib.longPressDragCondition')}}
              />
            </Label>
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
            <div className="flex w-full flex-col gap-2 rounded-md border-1 p-2">
              <div className="flex items-center gap-1">
                <span>{t('lib.moveThenDrag')}</span>
                <BadTooltip
                  trigger={{
                    render: <IconQuestion className="size-4" />,
                  }}
                  content={{children: t('lib.dragThresholdDistance')}}
                />
              </div>
              <RadioGroup
                value={JSON.stringify(activationConstraint || constraints[0].value)}
                className="flex flex-wrap"
                onValueChange={(value) => setActivationConstraint(JSON.parse(value))}
              >
                {constraints.map((v) => (
                  <div key={v.key} className="flex items-center gap-1">
                    <RadioGroupItem id={`constraints_${v.key}`} value={JSON.stringify(v.value)} />
                    <Label htmlFor={`constraints_${v.key}`}>{v.label}</Label>
                    <BadTooltip
                      trigger={{
                        render: <IconQuestion className="size-4" />,
                      }}
                      content={{children: v.tip}}
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="flex w-full flex-col gap-2 rounded-md border-1 p-2">
              <div className="flex items-center">
                <span>{t('lib.dragBehavior')}</span>
              </div>
              <RadioGroup
                // 这儿不用value，因为setModifiers不是绑定的key
                defaultValue={modifiersOption[0].key}
                className="flex flex-wrap"
                onValueChange={(value) => {
                  const modify = modifiersOption.find((v) => v.key === value);
                  if (modify) setModifiers(modify.modifiers);
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
    </div>
  );
}
