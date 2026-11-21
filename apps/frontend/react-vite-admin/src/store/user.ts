import {StorageKeys} from '../utils/storage-keys';
import {create} from 'zustand';
import {persist} from 'zustand/middleware';

type State = {
  user: Record<string, any>;
};

type Action = {
  setUser: (user: Record<string, any>) => void;
};
const useUserStore = create<State & Action>()(
  persist(
    (set) => ({
      user: {},
      setUser: (user) => set({user}),
    }),
    {
      name: StorageKeys.user,
      partialize(state) {
        return {
          user: state.user,
        };
      },
    }
  )
);

export default useUserStore;
