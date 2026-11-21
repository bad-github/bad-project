'use client';

import {useEffect, useRef, type ComponentPropsWithoutRef} from 'react';
import {useTheme} from 'next-themes';
import {cn} from '@badnpm/ui';

export type InteractiveGridProps = ComponentPropsWithoutRef<'div'> & {
  /** 网格边长，单位 CSS px；内部限制最小 20，避免过密。 */
  gridSize?: number;
  /** 聚光灯与形变的影响半径，单位 CSS px。 */
  radius?: number;
  /** 网格最大目标偏移，单位 CSS px；设为 0 时仅保留照明。 */
  strength?: number;
  /** 回弹弹簧刚度，越大回位越快；内部限制为 20～400。 */
  stiffness?: number;
  /** 可选 CSS 颜色；默认亮色主题用黑色、暗色主题用白色，透明度由绘制逻辑控制。 */
  color?: string;
};

type Point = {x: number; y: number; originX: number; originY: number; vx: number; vy: number};

/**
 * 通用交互网格容器：Canvas 是绝对定位的装饰背景，children 保持正常文档流。
 * 组件无需知道使用区域的尺寸；外层可用 className 设置高度、圆角、内边距。
 * 帧动画与指针位置都保存在 effect 闭包中，不会因鼠标移动而触发 React 重渲染。
 */
export default function InteractiveGrid({
  children, className, gridSize = 48, radius = 180, strength = 18, stiffness = 180, color, ...props
}: InteractiveGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {resolvedTheme} = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!container || !canvas || !context) return;

    // 第二张画布专门绘制“亮网格”，再用径向遮罩擦掉远处部分。
    // 这样被照亮的线与暗网格共用形变坐标，不会出现两张网格错位。
    const lightCanvas = document.createElement('canvas');
    const lightContext = lightCanvas.getContext('2d');
    if (!lightContext) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const spacing = Math.max(20, Number.isFinite(gridSize) ? gridSize : 48);
    const influence = Math.max(20, Number.isFinite(radius) ? radius : 180);
    const displacement = Math.max(0, Math.min(60, Number.isFinite(strength) ? strength : 18));
    const spring = Math.max(20, Math.min(400, Number.isFinite(stiffness) ? stiffness : 180));
    const ink = color ?? (resolvedTheme === 'dark' ? '#ffffff' : '#000000');
    const dark = resolvedTheme === 'dark';
    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let subdivisions = 3;
    let points: Point[] = [];
    let frame = 0;
    let previousTime = 0;
    let visible = true;
    let disposed = false;
    const pointer = {active: false, clientX: 0, clientY: 0, x: 0, y: 0};
    const light = {x: 0, y: 0, opacity: 0};

    // 每条网格线用多个采样点表示，通过相邻点的中点绘制二次曲线。
    // 曲线而不是逐段折线，让局部受力时出现柔和弯曲，离开后恢复笔直。
    function drawLine(ctx: CanvasRenderingContext2D, line: Point[]) {
      if (line.length < 2) return;
      ctx.moveTo(line[0].x, line[0].y);
      for (let i = 1; i < line.length - 1; i++) {
        const p = line[i];
        const next = line[i + 1];
        ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
      }
      const last = line[line.length - 1];
      ctx.lineTo(last.x, last.y);
    }

    function drawGrid(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      for (let row = 0; row < rows; row += subdivisions) {
        drawLine(ctx, points.slice(row * columns, (row + 1) * columns));
      }
      for (let col = 0; col < columns; col += subdivisions) {
        const line: Point[] = [];
        for (let row = 0; row < rows; row++) line.push(points[row * columns + col]);
        drawLine(ctx, line);
      }
      ctx.stroke();
    }

    function schedule() {
      // 离屏、后台或无有效尺寸时不运行；动画收敛后也会主动停止 RAF。
      if (!disposed && !frame && visible && !document.hidden && width && height) {
        frame = requestAnimationFrame(draw);
      }
    }

    function draw(time: number) {
      frame = 0;
      // 使用时间步长而非“每帧固定移动”，兼容 60/120Hz；限制后台恢复时的大步长。
      const dt = previousTime ? Math.min((time - previousTime) / 1000, 1 / 30) : 1 / 60;
      previousTime = time;
      const active = pointer.active && !media.matches;
      const rect = container!.getBoundingClientRect();
      pointer.x = pointer.clientX - rect.left;
      pointer.y = pointer.clientY - rect.top;
      let moving = false;

      for (const p of points) {
        const dx = p.originX - pointer.x;
        const dy = p.originY - pointer.y;
        const distance = Math.hypot(dx, dy);
        // 以原始位置计算影响，避免点被推开后因距离变化而抖动。
        // 平方衰减使影响半径边缘的位移与斜率都自然趋向零。
        const falloff = active ? Math.max(0, 1 - distance / influence) ** 2 : 0;
        const force = displacement * falloff / Math.max(distance, 1);
        const targetX = p.originX + dx * force;
        const targetY = p.originY + dy * force;
        if (media.matches) {
          p.x = p.originX; p.y = p.originY; p.vx = 0; p.vy = 0;
          continue;
        }
        // 弹簧力拉向目标，阻尼消耗速度；鼠标离开后目标自动回到原点。
        // 阻尼接近临界值，保留轻微弹性而避免长时间震荡。
        const damping = 1.8 * Math.sqrt(spring);
        p.vx += ((targetX - p.x) * spring - p.vx * damping) * dt;
        p.vy += ((targetY - p.y) * spring - p.vy * damping) * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (Math.abs(p.x - targetX) + Math.abs(p.y - targetY) > 0.03 || Math.abs(p.vx) + Math.abs(p.vy) > 0.05) moving = true;
      }

      const blend = 1 - Math.exp(-14 * dt);
      if (active && light.opacity < 0.001) { light.x = pointer.x; light.y = pointer.y; }
      light.x += (pointer.x - light.x) * blend;
      light.y += (pointer.y - light.y) * blend;
      const targetOpacity = active ? 1 : 0;
      light.opacity = media.matches ? 0 : light.opacity + (targetOpacity - light.opacity) * blend;
      if (Math.abs(light.opacity - targetOpacity) > 0.002 || (active && Math.hypot(light.x - pointer.x, light.y - pointer.y) > 0.1)) moving = true;

      const ctx = context!;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 0.7;
      ctx.globalAlpha = dark ? 0.16 : 0.12;
      drawGrid(ctx);
      ctx.globalAlpha = 1;

      if (light.opacity > 0.002) {
        const glow = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, influence);
        glow.addColorStop(0, ink); glow.addColorStop(1, 'transparent');
        ctx.globalAlpha = light.opacity * (dark ? 0.10 : 0.06);
        ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height); ctx.globalAlpha = 1;
        const lit = lightContext!;
        lit.clearRect(0, 0, width, height);
        lit.strokeStyle = ink; lit.lineWidth = 1;
        drawGrid(lit);
        const mask = lit.createRadialGradient(light.x, light.y, 0, light.x, light.y, influence);
        mask.addColorStop(0, `rgba(0,0,0,${light.opacity * 0.8})`);
        mask.addColorStop(1, 'transparent');
        lit.globalCompositeOperation = 'destination-in';
        lit.fillStyle = mask; lit.fillRect(0, 0, width, height);
        lit.globalCompositeOperation = 'source-over';
        ctx.drawImage(lightCanvas, 0, 0, width, height);
      }
      if (moving) schedule();
      else previousTime = 0;
    }

    function resize() {
      width = container!.clientWidth; height = container!.clientHeight;
      // 控制采样密度，并将 DPR 限制为 2，避免大容器或高分屏占用过多内存。
      subdivisions = Math.max(1, Math.min(3, Math.floor(spacing / Math.max(12, Math.sqrt(width * height / 8000)))));
      const step = spacing / subdivisions;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const target of [canvas!, lightCanvas]) {
        target.width = Math.round(width * dpr); target.height = Math.round(height * dpr);
      }
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
      lightContext!.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.ceil(width / step) + 1; rows = Math.ceil(height / step) + 1;
      points = Array.from({length: columns * rows}, (_, i) => {
        const x = (i % columns) * step; const y = Math.floor(i / columns) * step;
        return {x, y, originX: x, originY: y, vx: 0, vy: 0};
      });
      schedule();
    }

    function move(event: PointerEvent) {
      // 不阻止默认事件，不捕获指针；链接、文字选择和手机滚动保持正常。
      if (event.pointerType === 'touch' || media.matches) return;
      pointer.active = true; pointer.clientX = event.clientX; pointer.clientY = event.clientY;
      schedule();
    }
    function leave() { pointer.active = false; schedule(); }
    function visibilityChange() {
      if (document.hidden || !visible) { cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
      else schedule();
    }
    function preferenceChange() { pointer.active = false; schedule(); }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting; visibilityChange();
    });
    intersectionObserver.observe(container);
    container.addEventListener('pointermove', move);
    container.addEventListener('pointerleave', leave);
    container.addEventListener('pointercancel', leave);
    window.addEventListener('resize', resize);
    // 滚动时仍按最新容器位置计算鼠标坐标，避免容器移动后光照位置偏移。
    window.addEventListener('scroll', schedule, {capture: true, passive: true});
    document.addEventListener('visibilitychange', visibilityChange);
    media.addEventListener('change', preferenceChange);

    return () => {
      disposed = true; cancelAnimationFrame(frame);
      resizeObserver.disconnect(); intersectionObserver.disconnect();
      container.removeEventListener('pointermove', move);
      container.removeEventListener('pointerleave', leave);
      container.removeEventListener('pointercancel', leave);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', schedule, true);
      document.removeEventListener('visibilitychange', visibilityChange);
      media.removeEventListener('change', preferenceChange);
    };
  }, [gridSize, radius, strength, stiffness, color, resolvedTheme]);

  return (
    <div ref={containerRef} className={cn('relative isolate overflow-hidden', className)} {...props}>
      {/* 仅对背景做上下渐隐，避免网格在容器边界突然截断；前景内容不受遮罩影响。 */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
        style={{maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)'}}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
