import {useCallback, useEffect, useRef, useState} from 'react';

/**
 * @param maxFrameCount
 * @returns
 * const defer =  useDefer();
 * data((v, index) => <>{defer(index) && <Component/>}</>)
 * 如上渲染解释：
 * 第1帧渲染第1个组件
 * 第2帧渲染第2个组件
 * 第120帧渲染第120组件
 * 即前2秒（120 帧）：index 0 ~ 119 按帧渲染
 * 第121个组件开始（index >= 120）：不再受 defer() 控制，直接一次性渲染剩下的所有个组件
 * 从defer(index)使用方式来看，maxFrameCount作用不是严格限制所有组件必须在2秒内渲染完，只是说，前120个组件按帧渲染，后面的直接渲染
 *
 *
 * 此hook应该在合适场景下使用，因为它会根据maxFrameCount持续触发使用该hook的组件
 * 建议场景：当数据量很大时，可以使用。useDefer(data.length > 100 ? 120 : 0， [data])
 *
 */
export default function useDefer(maxFrameCount = 120, deps: any[] = []) {
  const frameRef = useRef(0);

  const effectKey = JSON.stringify(deps);

  useEffect(() => {
    if (maxFrameCount === 0) return;

    frameRef.current = 0;

    const tick = () => {
      frameRef.current += 1;

      if (frameRef.current < maxFrameCount) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [maxFrameCount, effectKey]);

  return useCallback(
    (showInFrameCount: number) => {
      if (maxFrameCount === 0) return true;
      return frameRef.current >= showInFrameCount;
    },
    [maxFrameCount]
  );
}

export function useDefer2(maxFrameCount = 120, deps: any[] = []) {
  const [frameCount, setFrameCount] = useState(0);
  const effectDeps = JSON.stringify(deps);

  useEffect(() => {
    if (maxFrameCount === 0) return;
    let frame = 0;
    let isMounted = true;
    const updateFrame = () => {
      if (!isMounted) return;
      setFrameCount((prev) => prev + 1);
      if (frame < maxFrameCount) {
        frame++;
        requestAnimationFrame(updateFrame);
      }
    };
    // 当依赖变化时，重置frameCount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrameCount(0);
    requestAnimationFrame(updateFrame);
    return () => {
      isMounted = false;
    };
  }, [maxFrameCount, effectDeps]);

  return function (showInFrameCount: number) {
    if (maxFrameCount === 0) return true;
    return frameCount >= showInFrameCount;
  };
}
