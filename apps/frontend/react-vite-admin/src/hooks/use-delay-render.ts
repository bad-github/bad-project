import {useEffect, useState} from 'react';

/**
 * 等待指定帧数后再渲染
 * @param frames 延迟的帧数，默认 2
 */
export function useDelayRender(frames: number = 2) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let count = 0;
    let rafId: number;

    const loop = () => {
      if (count >= frames) {
        setReady(true);
        return;
      }
      count++;
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [frames]);

  return ready;
}
