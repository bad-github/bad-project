import {create} from 'zustand';
import type {Coordinates} from '@dnd-kit/utilities';
import type {
  Active,
  CollisionDetection,
  MeasuringConfiguration,
  Modifiers,
  Over,
  PointerActivationConstraint,
} from '@dnd-kit/core';
import type {SortingStrategy} from '@dnd-kit/sortable';
import type {TSortItem} from '@/page/open-source-lib/dnd-kit/types';

type State = {
  coordinates: Coordinates;
  modifiers?: Modifiers;
  /**
   * delay必须和tolerance一起使用，distance可单独使用（也可以加入tolerance和delay，表示 distance or (tolerance && delay)，满足任意一个即可拖拽）
   * 例如：{delay: 1000, tolerance: 96, distance: 2}。distance移动距离超过2就可进行拖拽
   * {tolerance: {x:number, y:number}, distance: {x:number, y:number}}
   * 设置x,y表示在水平或垂直方向上移动的距离，没有设置那么就是任意角度的距离，即欧几里得距离
   *
   *
   * delay：鼠标按下或手指按住后，需要等待多少ms后，才会启动拖拽行为
   * tolerance：在delay时间内，允许鼠标或手指移动的最大距离为多少px，超出这个距离，不会触发拖拽行为，而被认为是滑动操作。适用场景：长按拖动，避免误触
   * distance：鼠标或手指按下后，只要移动距离超过了多少px，就会立即触发拖拽。
   */
  activationConstraint?: PointerActivationConstraint;
  /**
   * 如果用户将拖拽项拖到一个有效的 Droppable 区域上并松开鼠标，over就会是这个区域的对象
   * 如果没有放在任何 droppable 上，比如中途松手或放在空白区域，则over为null
   */
  over?: Over | null;
  /**
   * 决定拖拽元素与放置区域的碰撞逻辑
   */
  collisionDetection?: CollisionDetection;
  strategy?: SortingStrategy;
  active: Active | null;
  sortData?: TSortItem[];
  measuring?: MeasuringConfiguration;
};
type Action = {
  setCoordinates: (coordinates: Coordinates) => void;
  setModifiers: (modifiers?: Modifiers) => void;
  setActivationConstraint: (activationConstraint?: PointerActivationConstraint) => void;
  setOver: (over?: Over | null) => void;
  setCollisionDetection: (collisionDetection?: CollisionDetection) => void;
  setActive: (active?: Active | null) => void;
  setStrategy: (strategy?: SortingStrategy) => void;
  setSortData: (sortData?: TSortItem[]) => void;
  setMeasuring: (measuring?: MeasuringConfiguration) => void;
  reset: () => void;
};
const initialState: State = {
  active: null,
  coordinates: {x: 0, y: 0},
  modifiers: [],
  activationConstraint: {distance: 4},
  over: null,
  collisionDetection: undefined,
  strategy: undefined,
  sortData: undefined,
  measuring: undefined,
};
const useDnDStore = create<State & Action>()((set) => ({
  ...initialState,
  setCoordinates: (data) =>
    set((state) => ({
      coordinates: {
        x: state.coordinates.x + data.x,
        y: state.coordinates.y + data.y,
      },
    })),
  setModifiers: (data) => set({modifiers: data}),
  setActivationConstraint: (data) => set({activationConstraint: data}),
  setOver: (data) => set({over: data}),
  setCollisionDetection: (data) => set({collisionDetection: data}),
  setActive: (data) => set({active: data}),
  setStrategy: (data) => set({strategy: data}),
  setSortData: (data) => set({sortData: data}),
  setMeasuring: (data) => set({measuring: data}),
  reset: () => set(initialState),
}));

export default useDnDStore;
