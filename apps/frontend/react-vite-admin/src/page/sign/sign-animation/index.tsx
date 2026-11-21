import Eye from './eye';
import Mouth from './mouth';
import {useBlinkCoordinator} from './hooks/use-blink-coordinator';
import {useSkew} from './hooks/use-skew';
import {useEffect, useRef, useState} from 'react';
import useSignStore from '../sign-in/sign-store';
import {useShallow} from 'zustand/shallow';
import newJeansUrl from '@/assets/image/newjeans_sunflower.png';

import {Avatar, AvatarImage, cn} from '@badnpm/ui';

type BlinkGroupProps = {
  children: (blinkProps: {isBlinking: boolean; blinkDuration: number}) => React.ReactNode;
};

// 只负责生出独立的眨眼信号，没有任何标签，不影响任何样式
function BlinkGroup({children}: BlinkGroupProps) {
  const blinkProps = useBlinkCoordinator();
  return <>{children(blinkProps)}</>;
}

type TProps = {
  mousePos: {x: number; y: number};
  containerRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * 动画
 * (1)四根柱子跟随鼠标方向倾斜
 * (2)眼睛跟随鼠标上下左右移动
 * (3)眼珠子跟随鼠标在眼睛内移动
 * (4)聚焦输入登录信息时，其中一根圆柱变高，且两根圆柱互相看一眼
 * (5)密码若明文输入，则眼睛不看
 */

export default function SignAnimation(props: TProps) {
  const {focused, showPassword} = useSignStore(useShallow((s) => ({focused: s.focused, showPassword: s.showPassword})));
  const {mousePos, containerRef} = props;
  const localRef = useRef<HTMLDivElement>(null);
  const [currentAngle3, setCurrentAngle3] = useState(-8);
  const skewStyle1 = useSkew(containerRef, mousePos, 1, showPassword ? 0 : focused ? -12 : -8, localRef);
  const skewStyle2 = useSkew(containerRef, mousePos, 1, showPassword ? 0 : -8, localRef);
  // 聚焦时不在倾斜，但一段时间后恢复
  const skewStyle3 = useSkew(containerRef, mousePos, 1, showPassword ? 0 : currentAngle3, localRef);
  const skewStyle4 = useSkew(containerRef, mousePos, 1.2, showPassword ? 0 : -8, localRef);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (focused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentAngle3(0);
      timer = setTimeout(() => {
        setCurrentAngle3(-8);
      }, 500);
    } else {
      // 失去焦点时：确保回归原位
      setCurrentAngle3(-8);
    }

    return () => clearTimeout(timer);
  }, [focused]);

  return (
    <div
      className="relative hidden h-screen flex-col gap-4 p-4 opacity-40 lg:flex"
      style={{background: 'linear-gradient(180deg, transparent 0%, var(--primary) 80%, transparent 100%)'}}
    >
      {/* <img
        src={newJeansUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
      /> */}

      <div className="flex items-center gap-4 text-xl font-bold">
        <Avatar className={cn('size-8 cursor-pointer')}>
          <AvatarImage src={newJeansUrl} alt="" />
        </Avatar>
        <div>React Vite Admin</div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center" ref={localRef}>
        {/* 得到中间线，根据中间线定位 */}
        <div className="absolute top-0 bottom-1/2 translate-y-1/2">
          {/* 第一个元素 (大眼睛) */}
          <div
            className={`absolute bottom-0 -left-30 z-1 w-50 origin-bottom rounded-t-2xl bg-[oklch(0.488_0.243_264.376)] transition-all duration-500 ease-out ${showPassword ? 'h-110' : focused ? 'h-125' : 'h-110'}`}
            style={skewStyle1}
          >
            <div className="absolute top-8 right-0 left-0 flex justify-center gap-8">
              <BlinkGroup>
                {(blinkProps) => (
                  <>
                    <Eye mousePos={mousePos} {...blinkProps} id="1" />
                    <Eye mousePos={mousePos} {...blinkProps} id="1" />
                  </>
                )}
              </BlinkGroup>
            </div>
          </div>

          {/* 第二个元素 (小黑点眼睛) */}
          <div
            className="absolute bottom-0 -left-55 z-2 h-50 w-60 origin-bottom rounded-t-full bg-[oklch(0.696_0.17_162.48)] transition-all duration-500 ease-out"
            style={skewStyle2}
          >
            <div className="absolute top-18 right-0 left-0 flex justify-center gap-12">
              <BlinkGroup>
                {(blinkProps) => (
                  <>
                    <Eye mousePos={mousePos} variant="dot" {...blinkProps} id="2" />
                    <Eye mousePos={mousePos} variant="dot" {...blinkProps} id="2" />
                  </>
                )}
              </BlinkGroup>
            </div>
          </div>

          {/* 第三个元素 (大眼睛) */}
          <div
            className="absolute bottom-0 left-5 z-2 h-80 w-30 origin-bottom rounded-t-2xl bg-[oklch(0.627_0.265_303.9)] transition-all duration-500 ease-out"
            style={skewStyle3}
          >
            <div className="absolute top-8 right-0 left-0 flex justify-center gap-6">
              <BlinkGroup>
                {(blinkProps) => (
                  <>
                    <Eye mousePos={mousePos} {...blinkProps} id="3" />
                    <Eye mousePos={mousePos} {...blinkProps} id="3" />
                  </>
                )}
              </BlinkGroup>
            </div>
          </div>

          {/* 第四个元素 (小黑点眼睛) */}
          <div
            className="absolute bottom-0 left-25 z-3 h-60 w-30 origin-bottom rounded-t-full bg-[oklch(0.704_0.191_22.216)] transition-all duration-500 ease-out"
            style={skewStyle4}
          >
            <div className="absolute top-12 right-0 left-0 flex flex-col items-center gap-8">
              <BlinkGroup>
                {(blinkProps) => (
                  <>
                    <div className="flex gap-6">
                      <Eye mousePos={mousePos} variant="dot" {...blinkProps} id="4" />
                      <Eye mousePos={mousePos} variant="dot" {...blinkProps} id="4" />
                    </div>
                  </>
                )}
              </BlinkGroup>
              <Mouth mousePos={mousePos} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
