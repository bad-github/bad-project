import {useLayoutEffect} from 'react';
import {Outlet, useLocation} from 'react-router';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  type Over,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {arrayMove} from '@dnd-kit/sortable';
import {useShallow} from 'zustand/shallow';
import useDnDStore from '@/store/dnd-store';
import type {TSortItem} from './types';

export default function DndKit() {
  const {
    modifiers,
    setCoordinates,
    activationConstraint,
    setOver,
    collisionDetection,
    active,
    setActive,
    sortData,
    setSortData,
    measuring,
    reset,
  } = useDnDStore(
    useShallow((state) => ({
      setCoordinates: state.setCoordinates,
      modifiers: state.modifiers,
      activationConstraint: state.activationConstraint,
      over: state.over,
      setOver: state.setOver,
      collisionDetection: state.collisionDetection,
      active: state.active,
      setActive: state.setActive,
      sortData: state.sortData,
      setSortData: state.setSortData,
      measuring: state.measuring,
      reset: state.reset,
    }))
  );
  const {pathname} = useLocation();
  // 阻塞子组件渲染，保证先清除，子组件在useEffect中对store对更新才不会被清除
  useLayoutEffect(() => {
    reset();
  }, [pathname]);
  const mouseSensor = useSensor(MouseSensor, {activationConstraint});
  const touchSensor = useSensor(TouchSensor, {activationConstraint});
  /*  useSensor(KeyboardSensor, {
    // Disable smooth scrolling in Cypress automated tests
    scrollBehavior: 'Cypress' in window ? 'auto' : undefined,
    sortableKeyboardCoordinates
  }); */
  const keyboardSensor = useSensor(KeyboardSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const getIndex = (id: UniqueIdentifier, items: TSortItem[]) => items.map((v) => v.id).indexOf(id);
  const activeIndex = active != null ? getIndex(active.id, sortData || []) : -1;
  const handleSort = (over: Over | null) => {
    if (over) {
      const overIndex = getIndex(over.id, sortData || []);
      if (activeIndex !== overIndex) {
        setSortData(arrayMove(sortData || [], activeIndex, overIndex));
      }
    }
  };

  const handleDragStart = (e: DragStartEvent) => {
    if (!e.active) {
      return;
    }
    setActive(e.active);
  };

  const handleDragCancel = () => {
    setActive(null);
  };
  /**
   * onDragEnd 没有默认值的移动、放置等行为，需要手动控制
   * 比如 setCoordinates 控制拖动中的元素移动，setOver 控制放置后的表现形式
   * 若直接 return 便没有任何效果
   */
  const handleDragEnd = (e: DragEndEvent) => {
    const {delta, over, active} = e;
    console.log('拖拽结束:', over, active);
    setActive(null);
    setOver(over);
    setCoordinates(delta); // 使用overlay就不必set
    handleSort(over);
  };

  console.log('DndContext render=======', modifiers);
  return (
    <DndContext
      sensors={sensors}
      // 拖动还没碰到任何droppable区时自由移动拖动，放到了droppable区后限制只能在某个方向、某个区域内继续移动
      // modifiers={over ? modifiers : undefined}
      modifiers={modifiers}
      collisionDetection={collisionDetection}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <Outlet />
    </DndContext>
  );
}
