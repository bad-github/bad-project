import {useEffect, useMemo, useRef, useState} from 'react';
import './index.css';
import {useMovePosition} from './hooks/use-move-position';
import {usePupilPosition} from './hooks/use-pupil-position';
import useSignStore from '../sign-in/sign-store';
import {useShallow} from 'zustand/shallow';

interface EyeProps {
  mousePos: {x: number; y: number};
  variant?: 'full' | 'dot';
  isBlinking: boolean;
  blinkDuration: number;
  id?: string;
}

export default function Eye({mousePos, variant = 'full', isBlinking, blinkDuration, id}: EyeProps) {
  const {focused, showPassword} = useSignStore(useShallow((s) => ({focused: s.focused, showPassword: s.showPassword})));
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);

  const blinkCssVariable = {
    '--blink-duration': `${blinkDuration}ms`,
  } as React.CSSProperties;
  const eyeRef = useRef<HTMLDivElement>(null);

  const override = useMemo(() => {
    if (!isLookingAtEachOther) return null;
    if (id === '1') return 'down';
    if (id === '3') return 'up';
    return null;
  }, [id, isLookingAtEachOther]);

  const eyeStyle = useMovePosition(eyeRef, mousePos, 16, 12, showPassword ? 'left' : override);
  const pupilStyle = usePupilPosition(eyeRef, mousePos, 6, 200, showPassword ? 'up-left' : override);

  useEffect(() => {
    let lookTimer: ReturnType<typeof setTimeout>;

    if (focused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLookingAtEachOther(true); // 瞬间开启对视
      lookTimer = setTimeout(() => {
        setIsLookingAtEachOther(false);
      }, 500);
    } else {
      // 失去焦点时：确保所有状态瞬间重置回初始值
      setIsLookingAtEachOther(false);
    }

    return () => {
      clearTimeout(lookTimer);
    };
  }, [focused]);

  // 纯黑点眼睛类型
  if (variant === 'dot') {
    return (
      <div ref={eyeRef} className="transition-transform duration-300 ease-out will-change-transform" style={eyeStyle}>
        <div
          className={`size-3 rounded-full bg-black will-change-transform ${showPassword ? 'scale-y-20 rounded-none' : isBlinking ? 'animate-blink' : ''}`}
          style={blinkCssVariable}
        />
      </div>
    );
  }

  // 完整大眼睛类型
  return (
    <div ref={eyeRef} className="transition-transform duration-300 ease-out will-change-transform" style={eyeStyle}>
      {/* 中层节点：专门用来负责眨眼缩放。
        这样即使它变成了 scaleY(0)，也不会去动外层的平移距离。
      */}
      <div
        className={`flex size-5 items-center justify-center rounded-full bg-white transition-transform duration-300 ease-out will-change-transform ${
          isBlinking ? 'animate-blink' : ''
        }`}
        style={blinkCssVariable}
      >
        {/* 内层节点：负责眼珠独立转动 */}
        <div
          className="size-2 rounded-full bg-black transition-transform duration-300 ease-out will-change-transform"
          style={pupilStyle}
        ></div>
      </div>
    </div>
  );
}
