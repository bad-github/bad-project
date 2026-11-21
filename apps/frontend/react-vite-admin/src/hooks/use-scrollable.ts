import {useRef, useState, useEffect} from 'react';

export default function useScrollable() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScrollable = () => {
      const scrollable = el.scrollHeight > el.clientHeight;
      setIsScrollable(scrollable);
      setScrollbarWidth(el.offsetWidth - el.clientWidth); // 纵向滚动条宽度
    };

    // 初始化
    updateScrollable();

    // 监听内容或容器变化
    const resizeObserver = new ResizeObserver(() => {
      updateScrollable();
    });
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, []);

  return {ref: containerRef, isScrollable, scrollbarWidth};
}
