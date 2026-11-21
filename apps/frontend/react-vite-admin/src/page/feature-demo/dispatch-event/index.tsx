import {Button} from '@badnpm/ui';
import {useEffect} from 'react';

/**
 * EventTarget 的 dispatchEvent() 方法会向一个指定的事件目标派发一个 Event，并以合适的顺序（同步地）调用所有受影响的 EventListener。
 */
export default function DispatchEventPage() {
  // 自定义事件（微应用通信、全局bus(主题切换)、组件库内部通信、三方SDK回调），完全解耦
  const event1 = new CustomEvent('app:navigate', {
    detail: {
      path: '/user',
      replace: true,
    },
    bubbles: true, // 表示该事件是否会在 DOM 中冒泡，例如Web Components对外通信，因为Web Component内部元素不一定被外部直接访问
    cancelable: true, // 表示该事件是否可以被取消，例如表单提交拦截、路由跳转守卫、组件库modal before close拦截
    composed: true, // 表示事件是否可以穿过 Shadow DOM 和常规 DOM 之间的边界进行冒泡
  });

  useEffect(() => {
    window.addEventListener('app:navigate', (e) => {
      console.log(e.detail.path);
    });
  }, []);

  return (
    <div>
      <Button onClick={() => window.dispatchEvent(event1)}>自定义事件-通信</Button>
    </div>
  );
}
