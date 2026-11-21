import {useEffect, useState, type RefObject} from 'react';

interface MousePos {
  x: number;
  y: number;
}

// 计算内层黑眼珠的磁吸转动
export function usePupilPosition(
  elementRef: RefObject<HTMLDivElement | null>,
  mousePos: MousePos,
  maxRadius = 6,
  influenceRadius = 200,
  override?: 'up' | 'down' | 'left' | 'right' | 'up-left' | 'down-left' | 'up-right' | 'down-right' | null
) {
  const [style, setStyle] = useState({transform: 'translate(0px, 0px)'});

  useEffect(() => {
    // 如果处于对视状态，直接强行往上/下顶满最大活动半径，并提早结束
    // sin(45°) = cos(45°) ≈ 0.7071
    const diagonalOffset = maxRadius * 0.7071;
    if (override === 'down') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStyle({transform: `translate(0px, ${maxRadius}px)`});
      return;
    }
    if (override === 'up') {
      setStyle({transform: `translate(0px, -${maxRadius}px)`});
      return;
    }
    if (override === 'left') {
      setStyle({transform: `translate(-${maxRadius}px, 0px)`});
      return;
    }
    if (override === 'right') {
      setStyle({transform: `translate(${maxRadius}px, 0px)`});
      return;
    }
    // 左上 45°：X 轴向左(-)，Y 轴向上(-)
    if (override === 'up-left') {
      setStyle({transform: `translate(${-diagonalOffset}px, ${-diagonalOffset}px)`});
      return;
    }
    // 左下 45°：X 轴向左(-)，Y 轴向下(+)
    if (override === 'down-left') {
      setStyle({transform: `translate(${-diagonalOffset}px, ${diagonalOffset}px)`});
      return;
    }
    // 右上 45°：X 轴向右(+)，Y 轴向上(-)
    if (override === 'up-right') {
      setStyle({transform: `translate(${diagonalOffset}px, ${-diagonalOffset}px)`});
      return;
    }
    // 右下 45°：X 轴向右(+)，Y 轴向下(+)
    if (override === 'down-right') {
      setStyle({transform: `translate(${diagonalOffset}px, ${diagonalOffset}px)`});
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

    // 3. 计算鼠标到眼睛中心的“实际绝对距离” (勾股定理)
    const mouseDistance = Math.sqrt(dx * dx + dy * dy);

    // 4. 计算夹角 (弧度)
    const angle = Math.atan2(dy, dx);

    // ==========================================
    // 逻辑 B：计算【内层黑眼珠】在眼眶内的转动位移
    // ==========================================
    // 眼珠在白眼框内的最大活动半径
    const maxPupilRadius = maxRadius; // (白眼框20px - 黑眼珠8px) / 2 = 6

    // 【核心优化2】：定义一个“鼠标感应范围”（单位: 像素）
    // 鼠标在这个范围（比如 200px）内移动时，眼珠会等比例跟随。超出 200px 后，眼珠保持在最大边缘。

    // 根据鼠标距离，计算出眼珠实际应该移动的距离
    // 如果鼠标在眼球正中心，distance 为 0；如果鼠标在 200px 外，currentDistance 为 maxPupilRadius
    const currentDistance = Math.min(maxPupilRadius, (mouseDistance / influenceRadius) * maxPupilRadius);

    // 5. 算出最终的带有渐进距离的位移量
    const pupilX = Math.cos(angle) * currentDistance;
    const pupilY = Math.sin(angle) * currentDistance;

    setStyle({
      transform: `translate(${pupilX}px, ${pupilY}px)`,
    });
  }, [mousePos, maxRadius, influenceRadius, elementRef, override]);

  return style;
}
