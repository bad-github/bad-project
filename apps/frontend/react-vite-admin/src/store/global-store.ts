import {create} from 'zustand';

type State = {
  base: string;
  shadowHost: HTMLDivElement | null; // 微应用shadow root的父元素
  isInMicro: boolean;
};

type Action = {
  setGlobal: (global: Partial<State>) => void;
  reset: () => void;
};

const initialState: State = {
  base: '',
  shadowHost: null,
  isInMicro: false,
};
const useGlobalStore = create<State & Action>()((set) => ({
  ...initialState,
  setGlobal: (global) => set((state) => ({...state, ...global})),
  reset: () => set(initialState),
}));

export default useGlobalStore;
