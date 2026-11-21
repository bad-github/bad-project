import React, {useCallback, useEffect, useState, useRef, useLayoutEffect} from 'react';
import {createPortal} from 'react-dom';

/** 开启菜单的参数 */
type OpenOptions = {
  clientX: number; // 鼠标点击的屏幕 X 坐标
  clientY: number; // 鼠标点击的屏幕 Y 坐标
  container?: HTMLElement; // 可选的父容器
  node: React.ReactNode; // 要渲染的内容
};

type FloatingState = {
  visible: boolean;
  x: number;
  y: number;
  node: React.ReactNode | null;
  container?: HTMLElement;
  measured: boolean; // 是否已完成尺寸测量并校准位置
};

export function useFloatingNode() {
  const [state, setState] = useState<FloatingState>({
    visible: false,
    x: 0,
    y: 0,
    node: null,
    measured: false,
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  // 使用 Ref 存储点击位置，避免其变化导致 useLayoutEffect 频繁执行
  const clickPosRef = useRef({clientX: 0, clientY: 0});

  const close = useCallback(() => {
    setState((s) => ({...s, visible: false, measured: false}));
  }, []);

  const open = useCallback((event: React.MouseEvent | MouseEvent, opt: OpenOptions) => {
    event.preventDefault();
    event.stopPropagation();
    const {clientX, clientY, container, node} = opt;
    if (container) {
      container.style.position = 'relative';
    }
    clickPosRef.current = {clientX, clientY};

    setState({
      visible: true,
      x: clientX, // 初始位置先设为点击处
      y: clientY,
      node,
      container,
      measured: false, // 标记为待测量
    });
  }, []);

  useLayoutEffect(() => {
    if (state.visible && !state.measured && wrapperRef.current) {
      const {clientX, clientY} = clickPosRef.current;
      const {container} = state;

      const menuRect = wrapperRef.current.getBoundingClientRect();
      const menuW = menuRect.width;
      const menuH = menuRect.height;

      // --- 关键修改：确定碰撞边界 ---
      let boundaryRight = window.innerWidth;
      let boundaryBottom = window.innerHeight;

      if (container) {
        const containerRect = container.getBoundingClientRect();
        boundaryRight = containerRect.right;
        boundaryBottom = containerRect.bottom;
      }

      // 1. 基于边界计算是否需要翻转 (此时还是基于视口坐标 ClientX/Y)
      let finalClientX = clientX;
      let finalClientY = clientY;

      // 如果 鼠标位置 + 菜单宽度 > 边界右侧 -> 向左翻转
      if (clientX + menuW > boundaryRight) {
        finalClientX = clientX - menuW;
      }
      // 如果 鼠标位置 + 菜单高度 > 边界底部 -> 向上翻转
      if (clientY + menuH > boundaryBottom) {
        finalClientY = clientY - menuH;
      }

      // 2. 边界纠偏（防止翻转后超出了左侧或顶部边界）
      if (container) {
        const containerRect = container.getBoundingClientRect();
        finalClientX = Math.max(containerRect.left, finalClientX);
        finalClientY = Math.max(containerRect.top, finalClientY);
      } else {
        finalClientX = Math.max(0, finalClientX);
        finalClientY = Math.max(0, finalClientY);
      }

      // 3. 转换为容器内部的相对坐标
      let finalX = finalClientX;
      let finalY = finalClientY;

      if (container) {
        const containerRect = container.getBoundingClientRect();
        finalX = finalClientX - containerRect.left + container.scrollLeft;
        finalY = finalClientY - containerRect.top + container.scrollTop;
      }

      // 4. 更新状态
      const rafId = requestAnimationFrame(() => {
        setState((prev) => ({
          ...prev,
          x: finalX,
          y: finalY,
          measured: true,
        }));
      });

      return () => cancelAnimationFrame(rafId);
    }
  }, [state.visible, state.measured, state.container]);

  // 核心逻辑：测量与二次定位
  /* useLayoutEffect(() => {
    if (state.visible && !state.measured && wrapperRef.current) {
      const {clientX, clientY} = clickPosRef.current;
      const {container} = state;

      // 获取菜单实际宽高
      const menuRect = wrapperRef.current.getBoundingClientRect();
      const menuW = menuRect.width;
      const menuH = menuRect.height;

      // 1. 视口溢出检测 (基于 window)
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      

      let finalClientX = clientX;
      let finalClientY = clientY;

      // 右侧/下方溢出则翻转
      if (clientX + menuW > screenW) finalClientX = clientX - menuW;
      if (clientY + menuH > screenH) finalClientY = clientY - menuH;

      // 兜底，防止超出左上角
      finalClientX = Math.max(5, finalClientX);
      finalClientY = Math.max(5, finalClientY);

      // 2. 坐标系转换 (如果存在 container)
      let finalX = finalClientX;
      let finalY = finalClientY;

      if (container) {
        const containerRect = container.getBoundingClientRect();
        // 相对坐标 = 视口坐标 - 容器位置 + 容器滚动距离
        finalX = finalClientX - containerRect.left + container.scrollLeft;
        finalY = finalClientY - containerRect.top + container.scrollTop;
      }

      // 3. 使用 rAF 避开 React 的同步级联渲染警告
      const rafId = requestAnimationFrame(() => {
        setState((prev) => ({
          ...prev,
          x: finalX,
          y: finalY,
          measured: true,
        }));
      });

      return () => cancelAnimationFrame(rafId);
    }
  }, [state.visible, state.measured, state.container]); */

  // 全局交互处理
  useEffect(() => {
    if (!state.visible) return;

    const handleOutsideAction = (e: MouseEvent) => {
      // 点击菜单内部不关闭
      if (wrapperRef.current?.contains(e.target as Node)) return;
      close();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    // 监听 mousedown (比 click 响应更快，更像原生) 和 contextmenu (右键别处也关闭)
    window.addEventListener('mousedown', handleOutsideAction);
    window.addEventListener('contextmenu', handleOutsideAction);
    window.addEventListener('keydown', handleKeyDown);
    // 捕获阶段监听滚动，防止菜单跟丢
    window.addEventListener('scroll', close, true);

    return () => {
      window.removeEventListener('mousedown', handleOutsideAction);
      window.removeEventListener('contextmenu', handleOutsideAction);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', close, true);
    };
  }, [state.visible, close]);

  // 渲染节点
  const floatingNode =
    state.visible && state.node
      ? createPortal(
          <div
            ref={wrapperRef}
            style={{
              position: state.container ? 'absolute' : 'fixed',
              left: state.x,
              top: state.y,
              zIndex: 9999,
              // 关键：未测量完成前完全透明，避免位置闪烁
              opacity: state.measured ? 1 : 0,
              pointerEvents: state.measured ? 'auto' : 'none',
              // 禁止选择，模拟原生菜单感
              userSelect: 'none',
            }}
          >
            {state.node}
          </div>,
          state.container || document.body
        )
      : null;

  return {open, close, floatingNode};
}
