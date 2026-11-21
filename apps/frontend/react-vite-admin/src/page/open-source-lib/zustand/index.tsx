import {useShallow} from 'zustand/shallow';
import {useCommonStore} from './store';
import {changeCount1} from './tool';
import {Button} from '@badnpm/ui';

function A() {
  console.log('A', '只有count1、setCount1变化时才会render');
  // 订阅多个值写法
  const {count1, setCount1} = useCommonStore(
    useShallow((state) => ({count1: state.count1, setCount1: state.setCount1}))
  );
  return <Button onClick={() => setCount1(count1 + 1)}>count1：{count1}</Button>;
}

function B() {
  console.log('B', '只有count2、setCount2变化时才会render');
  // 订阅单个值写法
  const count2 = useCommonStore((state) => state.count2);
  const setCount2 = useCommonStore((state) => state.setCount2);

  return <Button onClick={() => setCount2(count2 + 1)}>count2：{count2}</Button>;
}

function C() {
  console.log('C', 'store任意值变化都会render');
  // 不推荐写法
  const {count3, setCount3} = useCommonStore();
  return <Button onClick={() => setCount3(count3 + 1)}>count3：{count3}</Button>;
}

function D() {
  const count1 = useCommonStore((state) => state.count1);
  return <Button onClick={changeCount1}>非react组件中count1：{count1}</Button>;
}

export default function ZustandPage() {
  return (
    <div className="flex flex-col items-start gap-2">
      <A />
      <B />
      <C />
      <D />
    </div>
  );
}
