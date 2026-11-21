import {create} from 'zustand';

type State = {
  showPassword: boolean;
  focused: boolean;
};

type Action = {
  setShowPassword: (showPassword: boolean) => void;
  setFocused: (focused: boolean) => void;
};
const useSignStore = create<State & Action>()((set) => ({
  showPassword: false,
  focused: false,
  setShowPassword: (showPassword) => set({showPassword}),
  setFocused: (focused) => set({focused}),
}));

export default useSignStore;
