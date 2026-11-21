import {useState, useEffect, type RefObject} from 'react';

interface MousePos {
  x: number;
  y: number;
}

// --------------------------------------------------
// Hooks 1: 计算整体上下左右平移 (大眼睛的外框 或 纯黑点)
// --------------------------------------------------
export function useMovePosition(
  elementRef: RefObject<HTMLDivElement | null>,
  mousePos: MousePos,
  maxX = 16,
  maxY = 12,
  override?: 'up' | 'down' | 'left' | 'right' | null
) {
  const [style, setStyle] = useState({transform: 'translate(0px, 0px)'});

  useEffect(() => {
    if (override === 'down') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStyle({transform: `translate(0px, ${maxY}px)`}); // 强制向下移动最大距离
      return;
    }
    if (override === 'up') {
      setStyle({transform: `translate(0px, -${maxY}px)`}); // 强制向上移动最大距离
      return;
    }
    if (override === 'left') {
      setStyle({transform: `translate(-${maxX}px, 0px)`}); // 强制向左移动最大距离
      return;
    }
    if (override === 'right') {
      setStyle({transform: `translate(${maxX}px, 0px)`}); // 强制向右移动最大距离
      return;
    }
    // 初始化或鼠标移出时，回归中心
    if (!elementRef.current || (mousePos.x === 0 && mousePos.y === 0)) {
      setStyle({transform: 'translate(0px, 0px)'});
      return;
    }

    // 1. 获取当前这只眼睛在屏幕上的绝对中心点
    const rect = elementRef.current.getBoundingClientRect();
    const eyeCenterX = rect.left + rect.width / 2;
    const eyeCenterY = rect.top + rect.height / 2;

    // 2. 计算鼠标到眼睛中心的 X 和 Y 距离
    const dx = mousePos.x - eyeCenterX;
    const dy = mousePos.y - eyeCenterY;

    // ==========================================
    // 逻辑 A：计算【外层白眼眶】的上下左右整体位移
    // ==========================================
    // 以 300px 为感应半径，映射出 -1 到 1 的比例系数
    const containerRadius = 300;
    const ratioX = Math.max(-1, Math.min(1, dx / containerRadius));
    const ratioY = Math.max(-1, Math.min(1, dy / containerRadius));

    // 按照你的要求：最大水平移动 16px，最大垂直移动 8px
    const eyeX = ratioX * maxX;
    const eyeY = ratioY * maxY;

    setStyle({
      transform: `translate(${eyeX}px, ${eyeY}px)`,
    });
  }, [mousePos, maxX, maxY, elementRef, override]);

  return style;
}
