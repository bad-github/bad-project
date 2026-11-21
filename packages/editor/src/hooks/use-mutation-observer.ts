import {useEffect, useLayoutEffect, useRef} from 'react';

/**
 * @param callback 变化时的回调
 * @param options 配置项 (attributes, childList, etc.)
 * @param target 监听的目标节点 (默认 body)
 */
export function useMutationObserver(
  callback: MutationCallback,
  target: HTMLElement | (() => HTMLElement) | React.RefObject<HTMLElement> | null = () => document.documentElement,
  options: MutationObserverInit = {
    attributes: true,
    attributeFilter: [],
  }
) {
  // 使用 Ref 保持回调函数最新，彻底避免闭包陷阱
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // 解析目标节点
    let targetElement;
    if (typeof target === 'function') {
      targetElement = target();
    } else if (target && 'current' in target) {
      targetElement = target.current;
    } else {
      targetElement = target;
    }

    if (!targetElement) return;

    // 实例化原生侦听器
    const observer = new MutationObserver((mutations, obs) => {
      callbackRef.current(mutations, obs);
    });

    // 开始观察
    observer.observe(targetElement, options);

    // 销毁时断开连接，防止内存泄漏
    return () => {
      observer.disconnect();
    };
  }, [options, target]); // 仅在配置或目标变化时重启
}
