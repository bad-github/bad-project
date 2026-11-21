import {useTranslation} from 'react-i18next';
import {MoonIcon, SunIcon} from 'lucide-react';
import {Button} from '@badnpm/ui';
import {useTheme} from '@/hooks/use-theme';
import {flushSync} from 'react-dom';
// import './index.css';

export default function ThemeSwitch() {
  const {resolvedTheme, setTheme} = useTheme();
  const {t} = useTranslation();

  const toggleTheme = async (e: React.MouseEvent) => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    const rect = e.currentTarget.getBoundingClientRect();

    // const x = e.clientX;
    // const y = e.clientY;
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Math.hypot(a, b) === Math.sqrt(a * a + b * b)，计算直角三角形斜边长度
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 600;

    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }
    // 调用此方法后：浏览器对页面截图，生成两个伪元素
    const transition = document.startViewTransition(async () => {
      flushSync(() => {
        setTheme(nextTheme);
      });
    });

    transition.ready.then(() => {
      // circle(圆半径 at 圆心坐标)
      const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];
      document.documentElement.animate(
        // 始终从小圆放大
        {clipPath},
        {
          duration: 1000,
          easing: 'ease-in-out',
          /**
           * 浏览器 View Transitions API 提供的伪元素
           * ::view-transition-old(root): 主题切换前（旧状态）的页面截图
           * ::view-transition-new(root): 主题切换后（新状态）的页面截图
           */
          // 指定动画作用的伪元素：始终让新主题放大覆盖旧主题
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  return (
    <Button
      onClick={toggleTheme}
      disabled={!resolvedTheme}
      variant="ghost"
      size="icon"
      className="relative size-7 rounded-md"
      aria-label={t('common.toggle-theme')}
    >
      <SunIcon aria-hidden="true" className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonIcon aria-hidden="true" className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      {/* 
      屏幕阅读器，可以删除，因为加了 aria-label 
      sr-only 只是 CSS 类名，不是屏幕阅读器标准。它通常把文字从视觉上隐藏，但保留在无障碍树中
      <button> 默认会用内部文字作为可访问名称，所以阅读器能读到“切换主题”
      */}
      <span className="sr-only">{t('common.toggle-theme')}</span>
    </Button>
  );
}
