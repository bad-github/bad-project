'use client';
import {Sun, Moon, Monitor} from 'lucide-react';
import {useTheme} from 'next-themes';
import {Button, cn} from '@badnpm/ui';
import {flushSync} from 'react-dom';
import './index.css';

export type ThemeSwitchProps = {
  /** 是否启用切换主题时的圆形扩散动画，默认关闭。 */
  enableAnimation?: boolean;
};

export function ThemeSwitch({enableAnimation = false}: ThemeSwitchProps) {
  //  next-themes 在首屏时拿到的 theme 往往不是稳定值，结果就是服务端输出和客户端首次渲染不一致，turbopack/Next 在开发态就会报“渲染错误”或 hydration mismatch
  const {theme, setTheme} = useTheme();

  const toggleTheme = (e: React.MouseEvent, mode: string) => {
    if (!enableAnimation || !document.startViewTransition) {
      setTheme(mode);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 800;
    const transition = document.startViewTransition(async () => {
      flushSync(() => {
        setTheme(mode);
      });
    });
    transition.ready.then(() => {
      const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];
      document.documentElement.animate(
        {clipPath},
        {
          duration: 1000,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  return (
    <div className="bg-area inline-flex h-9 items-center gap-0.5 rounded-full px-3">
      <Button
        variant="secondary"
        className={cn('hover:bg-input size-6 rounded-full', theme === 'light' ? 'bg-input' : 'bg-transparent')}
        onClick={(e) => toggleTheme(e, 'light')}
      >
        <Sun />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className={cn('hover:bg-input size-6 rounded-full', theme === 'dark' ? 'bg-input' : 'bg-transparent')}
        onClick={(e) => toggleTheme(e, 'dark')}
      >
        <Moon />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className={cn('hover:bg-input size-6 rounded-full', theme === 'system' ? 'bg-input' : 'bg-transparent')}
        onClick={(e) => toggleTheme(e, 'system')}
      >
        <Monitor />
      </Button>
    </div>
  );
}
