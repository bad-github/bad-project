import {useRef} from 'react';
import {useMovePosition} from './hooks/use-move-position';
import useSignStore from '../sign-in/sign-store';

interface Mouth {
  mousePos: {x: number; y: number};
}

export default function Mouth({mousePos}: Mouth) {
  const mouthRef = useRef<HTMLDivElement>(null);
  const showPassword = useSignStore((s) => s.showPassword);

  const style = useMovePosition(mouthRef, mousePos, 16, 8, showPassword ? 'left' : null);

  return (
    <div
      ref={mouthRef}
      style={style}
      className="h-1 w-[50%] rounded-md bg-black transition-transform duration-200 ease-out will-change-transform"
    ></div>
  );
}
