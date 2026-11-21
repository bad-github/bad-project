import {useState, useEffect} from 'react';

// 统一控制眨眼时间的单一变量（单位：毫秒）
const BLINK_DURATION = 500;

export function useBlinkCoordinator() {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    // 随机一个下次眨眼的时间，让眨眼看起来更自然，而不是死板的卡点
    const getRandomTime = () => Math.random() * 2000 + 4000; // 4s 到 6s 之间随机
    let timeoutId: NodeJS.Timeout;

    const tick = () => {
      setIsBlinking(true);

      // 达到设定的毫秒数后，结束眨眼
      setTimeout(() => {
        setIsBlinking(false);
      }, BLINK_DURATION);

      timeoutId = setTimeout(tick, getRandomTime());
    };

    timeoutId = setTimeout(tick, getRandomTime());
    return () => clearTimeout(timeoutId);
  }, []);

  return {
    isBlinking,
    blinkDuration: BLINK_DURATION,
  };
}
