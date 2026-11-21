import {create} from 'zustand';

type State = {
  isFull: boolean;
};

type Action = {
  toggleFull: (isFull: boolean) => void;
};
const useFullScreenStore = create<State & Action>()((set) => ({
  isFull: false,
  toggleFull: (isFull: boolean) => set({isFull}),
}));

export default useFullScreenStore;
