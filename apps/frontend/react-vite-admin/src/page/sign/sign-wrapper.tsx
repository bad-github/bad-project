import React, {useRef, useState} from 'react';
import PaletteSwitch from '../../components/palette-switch';
import LngSwitch from '../../components/lng-switch';
import ThemeSwitch from '../../components/theme-switch';
import SignAnimation from './sign-animation';

export default function SignWrapper({children}: {children: React.ReactNode}) {
  // 将鼠标绝对坐标状态提升到整页的最顶层
  const [mousePos, setMousePos] = useState({x: 0, y: 0});
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({x: e.clientX, y: e.clientY});
  };

  const handleMouseLeave = () => {
    // 鼠标移出浏览器视口时，让全场动画完美回正
    // setMousePos({ x: 0, y: 0 });
  };
  return (
    <div
      className="grid min-h-svh lg:grid-cols-2"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <SignAnimation mousePos={mousePos} containerRef={containerRef} />
      <div className="relative flex items-center justify-center p-6 md:p-10">
        {children}
        <div className="bg-accent absolute top-4 right-4 flex rounded-full px-3 items-center py-1">
          <PaletteSwitch />
          <LngSwitch />
          <ThemeSwitch />
        </div>
        <div className="text-muted-foreground *:[a]:hover:text-primary absolute bottom-4 text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
          Copyright © 2025 G
        </div>
      </div>
    </div>
  );
}
