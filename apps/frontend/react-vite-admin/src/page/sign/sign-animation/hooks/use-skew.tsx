import { useState, useEffect, type RefObject } from 'react';

interface MousePos {
  x: number;
  y: number;
}

export function useSkew(
  // 1. 保留原本的全局监听容器（其实在 Hook 内部不需要它了，为了不让你改主页面参数，我们保留这个参数位置）
  globalContainerRef: RefObject<HTMLDivElement | null>,
  mousePos: MousePos,
  skewFactor = 1,
  maxSkewAngle = -8, 
  // 新增一个参数：传入左侧小人动画区域的局部 Ref，作为真正的数学测量基准！
  localContainerRef?: RefObject<HTMLDivElement | null>
) {
  const [style, setStyle] = useState({ transform: 'skewX(0deg)' });

  useEffect(() => {
    // 决定使用哪一个容器作为测量基准。如果你传了局部 Ref，就用局部的，否则兜底用全局的
    const targetRef = localContainerRef || globalContainerRef;

    if (!targetRef.current || (mousePos.x === 0 && mousePos.y === 0)) {
      setStyle({ transform: 'skewX(0deg)' });
      return;
    }

    // 获取左侧图区域的几何信息
    const rect = targetRef.current.getBoundingClientRect();

    // 计算鼠标相对于【左侧图区域】左边界的距离
    const mouseXRelative = mousePos.x - rect.left;

    // 换算出以【左侧图区域中心】为 0 点的比例系数
    let ratioX = (mouseXRelative / rect.width) * 2 - 1;

    // 【核心关键】：限制比例在 -1 到 1 之间！
    // 这样当鼠标往右划出左侧区域、进入右侧登录页时，ratioX 会锁定在 1，小人会保持最大右倾斜，不会无限倾斜倒下
    ratioX = Math.max(-1, Math.min(1, ratioX));

    // 计算最终的倾斜度数 (因为 maxSkewAngle 是负数，这里加负号对齐方向)
    const finalAngle = ratioX * maxSkewAngle * skewFactor;

    setStyle({
      transform: `skewX(${finalAngle}deg)`,
    });
  }, [mousePos, globalContainerRef, localContainerRef, maxSkewAngle, skewFactor]);

  return style;
}