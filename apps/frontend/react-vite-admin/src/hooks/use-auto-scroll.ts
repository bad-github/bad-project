import {useCallback, useEffect, useRef} from 'react';

/**
 * 滚动容器距离容器底部距离小于 threshold 时，自动滚动到底部
 * 适用于实时日志
 * @param threshold
 * @returns
 */
type ScrollMode = 'auto' | 'bottom' | 'continuous';

export function useAutoScroll<T extends HTMLElement>(threshold = 300) {
  const ref = useRef<T | null>(null);
  const shouldFollowRef = useRef(true);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      // 只要离底部太远，就标记为不跟随
      shouldFollowRef.current = distanceToBottom < threshold;
    };

    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const scroll = useCallback((mode: ScrollMode) => {
    const el = ref.current;
    if (!el) return;
    if (mode === 'bottom') {
      // 立马滚动到底部
      el.scrollTop = el.scrollHeight;
    } else if (mode === 'auto') {
      // 只有底部小于阈值时才滚动到地步
      if (shouldFollowRef.current) {
        el.scrollTop = el.scrollHeight;
      }
    } else if (mode === 'continuous') {
      // 每帧滚动一点，实现缓慢滑动
      const step = () => {
        if (!el) return;
        const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distanceToBottom > 0) {
          el.scrollTop += Math.min(1, distanceToBottom);
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
        }
      };

      step();
    }
  }, []);

  return {ref, scroll};
}
