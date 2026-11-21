import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';

type State = {
  count1: number;
  count2: number;
  count3: number;
};
type Action = {
  setCount1: (count1: number) => void;
  setCount2: (count2: number) => void;
  setCount3: (count3: number) => void;
};

export const useCommonStore = create<State & Action>()(
  subscribeWithSelector((set) => ({
    count1: 0,
    count2: 0,
    count3: 0,
    setCount1: (count1) => set({count1}),
    setCount2: (count2) => set({count2}),
    setCount3: (count3) => set({count3}),
  }))
);
