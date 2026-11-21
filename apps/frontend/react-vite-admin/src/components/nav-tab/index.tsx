import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useShallow} from 'zustand/shallow';
import {useLocation, useNavigate} from 'react-router';
import {ChevronLeftIcon, ChevronRightIcon, FullscreenIcon, PinIcon, XIcon} from 'lucide-react';
import {debounce} from 'lodash-es';
import type {TRoute} from '@/router/types';
import useTabStore from '@/store/tab-store';
import useFullScreenStore from '@/store/full-screen-store';

import {Button, cn} from '@badnpm/ui';
import ActionMenu from './action-menu';
import {findOpenRoutes} from '../route-menu/tool';

export default function NavTab({fullScreenRef: _}: {fullScreenRef?: React.RefObject<HTMLDivElement | null>}) {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const {tabs, activeRoute, allRoutes, removeTab, setActiveRoute, addOpenKeys} = useTabStore(
    useShallow((state) => ({
      tabs: state.tabs,
      activeRoute: state.activeRoute,
      allRoutes: state.allRoutes,
      removeTab: state.removeTab,
      setActiveRoute: state.setActiveRoute,
      addOpenKeys: state.addOpenKeys,
    }))
  );
  const {isFull, toggleFull} = useFullScreenStore(
    useShallow((state) => ({
      isFull: state.isFull,
      toggleFull: state.toggleFull,
    }))
  );
  const tabsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showButtons, setShowButtons] = useState(false);
  const [disablePrev, setDisablePrev] = useState(true);
  const [disableNext, setDisableNext] = useState(false);

  // 更新按钮显隐和禁用状态
  const update = () => {
    if (!containerRef.current || !tabsRef.current) return;
    const container = containerRef.current;
    const tabsEl = tabsRef.current;

    const containerWidth = container.offsetWidth;
    const tabsWidth = tabsEl.scrollWidth;

    const needButtons = tabsWidth > containerWidth;
    setShowButtons(needButtons);

    if (needButtons) {
      const scrollLeft = Math.round(container.scrollLeft);
      const maxScroll = tabsWidth - containerWidth;
      setDisablePrev(scrollLeft <= 1);
      setDisableNext(scrollLeft >= maxScroll - 1);
    } else {
      setDisablePrev(true);
      setDisableNext(true);
    }
  };

  // 监听滚动和窗口缩放
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    update();
    container.addEventListener('scroll', update);
    return () => {
      container.removeEventListener('scroll', update);
    };
  }, []);

  // 滚动到指定 tab，居中显示
  const scrollTabIntoView = (tab: TRoute) => {
    if (!containerRef.current || !tabsRef.current) return;
    const index = tabs.findIndex((v) => v.key === tab.key);
    const container = containerRef.current;
    const tabsEl = tabsRef.current;
    const tabEl = tabsEl.children[index] as HTMLElement;
    if (!tabEl) return;

    const containerRect = container.getBoundingClientRect();
    const offset = tabEl.offsetLeft;
    // 滚动到页面中指定的固定位置，多次调用会覆盖前一个目标，不用优化
    container.scrollTo({
      left: offset - (containerRect.width - tabEl.offsetWidth) / 2,
      behavior: 'smooth',
    });
  };

  // const handleResize = useMemo(
  //   () =>
  //     debounce(() => {
  //       update();
  //       if (activeRoute) scrollTabIntoView(activeRoute);
  //     }, 200),
  //   // 依赖项：只有当 update 或逻辑依赖变动时才重新创建防抖函数
  //   [update, activeRoute]
  // );
  // useEffect(() => {
  //   handleResizeRef.current = debounce(() => {
  //     update();
  //     if (activeRoute) scrollTabIntoView(activeRoute);
  //   }, 200);

  //   return () => {
  //     handleResizeRef.current?.cancel();
  //   };
  // }, [activeRoute, update]);

  // 页面缩放后，高亮回到中间
  useEffect(() => {
    const handleResize = debounce(() => {
      update();
      if (activeRoute) scrollTabIntoView(activeRoute);
    }, 200);

    const handleWheel = (e: WheelEvent) => {
      /**
       * 禁用浏览器的默认滚动，因为希望鼠标滚轮上下滚 → 转换成左右滚动
       * passive
       *    true：事件处理函数不会调用 preventDefault()，浏览器不用等我的 JS 执行完，可以直接处理默认行为。滚动性能更好
       *    false：事件处理函数可能会调用 preventDefault()，浏览器需要考虑我是否会阻止默认行为。可以阻止默认行为，可能影响滚动性能
       */
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      // 只有上下滚动时才处理
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX) || e.deltaY === 0) return;
      container.scrollLeft += e.deltaY;
    };
    const container = containerRef.current;
    if (!container) return;
    window.addEventListener('resize', handleResize);
    container.addEventListener('wheel', handleWheel, {passive: false});
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [activeRoute]);

  useEffect(() => {
    // todo
    const handleResize = debounce(() => {
      update();
      if (activeRoute) scrollTabIntoView(activeRoute);
    }, 200);
    let frameId: number;
    const unSub = useTabStore.subscribe((cur, prev) => {
      if (cur.tabs.length !== prev.tabs.length) {
        cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => {
          handleResize();
        });
      }
    });
    return () => {
      unSub();
      cancelAnimationFrame(frameId);
    };
  }, []);

  // 切换页码按钮滚动
  const scrollByPage = (direction: number) => {
    if (!containerRef.current || !tabsRef.current) return;
    const container = containerRef.current;
    const tabsEl = tabsRef.current;
    const containerWidth = container.offsetWidth;
    const maxScrollLeft = tabsEl.scrollWidth - containerWidth;
    const newScroll = Math.min(Math.max(container.scrollLeft + direction * containerWidth, 0), maxScrollLeft);
    container.scrollTo({left: newScroll, behavior: 'smooth'});
  };

  const handleClickTab = (v: TRoute) => {
    if (v.fullPath === location.pathname) return;
    setActiveRoute(v);
    scrollTabIntoView(v);
    if (v.fullPath) {
      const openRoutes = findOpenRoutes(v.fullPath!, allRoutes);
      addOpenKeys(openRoutes.map((v) => v.key));
      navigate(v.fullPath);
    }
  };

  const handleCloseTab = (e: React.MouseEvent, tab: TRoute, index: number) => {
    e.stopPropagation();
    removeTab(tab);
    if (tab.key === activeRoute?.key) {
      const prevTab = tabs[index - 1];
      const nextTab = tabs[index + 1];
      if (prevTab) {
        setActiveRoute(prevTab);
        navigate(prevTab.fullPath!);
      } else if (nextTab) {
        setActiveRoute(nextTab);
        navigate(nextTab.fullPath!);
      }
    }
  };

  return (
    <div className="shadow-accent relative flex h-[36px] w-full items-center shadow-lg/70">
      {/* 下边框 */}
      <span className="bg-border absolute right-0 bottom-0 left-0 z-10 h-[1px]"></span>
      {/* 左按钮 */}
      {showButtons ? (
        <Button size="icon" variant="ghost" disabled={disablePrev} onClick={() => scrollByPage(-1)}>
          <ChevronLeftIcon />
        </Button>
      ) : (
        <span className="w-2"></span>
      )}

      {/* tabs容器，可设置 overflow-hidden 或  overflow-auto 决定是横向手势或纵向手势 */}
      <div ref={containerRef} className="h-full min-w-0 flex-1 overflow-hidden text-sm">
        <div ref={tabsRef} className="flex h-full w-full">
          {tabs.map((v, i) => {
            const isActive = activeRoute?.key === v.key;
            const activeIndex = tabs.findIndex((v) => v.key === activeRoute?.key);
            return (
              <ActionMenu key={v.key} index={i} tab={v} handleCloseTab={handleCloseTab}>
                <div
                  className={cn(
                    'text-muted-foreground relative flex max-w-[160px] flex-shrink-0 cursor-pointer items-center border-r pr-6 pl-4 transition-colors duration-300',
                    'group/tab',
                    'hover:bg-muted hover:border-r-transparent',
                    activeIndex === i && 'text-foreground'
                  )}
                  title={t(v.title!)}
                  // 告诉屏幕阅读器这是一个 tab，从而参与“tab list”的语义结构
                  role="tab"
                  // HTML中只有某些元素默认可聚焦（如 <button>、<input>），而<div>默认不可聚焦，加上tabIndex便可以通过键盘导航tab获得焦点
                  tabIndex={0}
                  // 告诉屏幕阅读器当前这个tab是否被选中
                  aria-selected={isActive}
                  onClick={() => handleClickTab(v)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      // 键盘tab切换时，可直接点击
                      handleClickTab(v);
                    }
                  }}
                >
                  <span
                    className={cn(
                      'transition-color absolute right-0 bottom-0 left-0 z-10 h-[2px] opacity-100 transition-opacity duration-300',
                      isActive ? 'bg-primary' : 'bg-transparent'
                    )}
                  ></span>
                  <span className="truncate">{t(v.title!)}</span>
                  {tabs.length > 1 && (
                    <>
                      {v.isPin ? (
                        <PinIcon size={12} className="absolute top-1/2 right-1.5 shrink-0 -translate-y-1/2" />
                      ) : (
                        <XIcon
                          size={12}
                          className={cn(
                            'top-1/2 right-1.5 hidden shrink-0 -translate-y-1/2 group-hover/tab:absolute group-hover/tab:block',
                            activeIndex === i && 'absolute block'
                          )}
                          onClick={(e) => handleCloseTab(e, v, i)}
                        />
                      )}
                    </>
                  )}
                </div>
              </ActionMenu>
            );
          })}
        </div>
      </div>

      {/*  右按钮 */}
      {showButtons && (
        <Button size="icon" variant="ghost" onClick={() => scrollByPage(1)} disabled={disableNext}>
          <ChevronRightIcon />
        </Button>
      )}
      <span className="flex h-full w-16 shrink-0 items-center justify-center border-l">
        <FullscreenIcon
          size={18}
          className="cursor-pointer"
          // 若使用浏览器全屏API，任何需要弹出的层（Select, Modal, Message, Tooltip）都必须挂载到全屏元素内部，否则它们会被挡在全屏层“下面
          // onClick={() => {
          //   const element = fullScreenRef?.current;
          //   if (!element) return;
          //   if (document.fullscreenElement) {
          //     document.exitFullscreen?.();
          //   } else {
          //     element?.requestFullscreen();
          //   }
          // }}
          onClick={() => toggleFull(!isFull)}
        />
      </span>
    </div>
  );
}
