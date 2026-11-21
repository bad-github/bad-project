import {useCommonStore} from './store';

export function changeCount1() {
  // useCommonStore(s => s.count1) // 不建议在非react中使用此写法
  const {count1, setCount1} = useCommonStore.getState();
  setCount1(count1 + 1);
  // 最新的值需要再次获取
  const latestCount1 = useCommonStore.getState().count1;
  console.log('latest count1', count1, latestCount1);
}

// 默认监听整个store
useCommonStore.subscribe((state, prevState) => {
  console.log('store changed', state, prevState);
});

// 使用中间件subscribeWithSelector实现监听某一个state
useCommonStore.subscribe(
  (state) => state.count1,
  (count, prevCount) => {
    console.log('count1 changed', count, prevCount);
  },
  // 订阅默认只有在下一次改变时才会触发，不会自动同步当前值，设置为true则立刻触发
  {fireImmediately: true}
);

useCommonStore.subscribe(
  // 订阅只有在下一次改变时才会触发，不会自动同步当前值
  (state) => ({count1: state.count1, count2: state.count2}),
  (cur, prev) => {
    console.log('count1 or count2 changed', cur, prev);
  }
);
