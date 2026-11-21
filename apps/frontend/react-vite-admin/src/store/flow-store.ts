import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';

type EdgePath = {
  opposite: string;
  reverse: string;
};

type State = {
  edgePath: Map<string, EdgePath>; // 保存节点之间的路径，包括正反方向
};

type Action = {
  setEdgePath: (id: string, path: EdgePath) => void;
  removeEdgePath: (id: string) => void;
  reset: () => void;
};

const initialState: State = {
  edgePath: new Map(),
};

const useFlowStore = create<State & Action>()(
  // 监听某个store发生变化
  subscribeWithSelector((set) => ({
    ...initialState,
    setEdgePath: (id: string, path: EdgePath) => {
      set((state) => {
        if (state.edgePath.has(id)) return state;
        return {edgePath: new Map(state.edgePath).set(id, path)};
      });
    },
    removeEdgePath: (id: string) => {
      set((state) => {
        if (!state.edgePath.has(id)) return state;
        state.edgePath.delete(id);
        return {edgePath: new Map(state.edgePath)};
      });
    },
    reset: () => set(initialState),
  }))
);

export default useFlowStore;
