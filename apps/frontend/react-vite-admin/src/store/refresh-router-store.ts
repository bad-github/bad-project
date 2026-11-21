import {create} from 'zustand';

type State = {
  refreshKey: string;
};

type Action = {
  triggerRefresh: () => void;
};
const useRefreshRouterStore = create<State & Action>()((set) => ({
  refreshKey: Date.now().toString(),
  triggerRefresh: () => set({refreshKey: Date.now().toString()}),
}));

export default useRefreshRouterStore;
