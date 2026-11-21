import { useMemo, useState } from "react";

type IAliveProps = {
  children: React.ReactElement;
  active: boolean;
};
// todo
/* export function StyleKeepAlive1(props: IAliveProps) {
  const {children, active} = props;
  // 缓存子组件，避免不必要的重复渲染
  const renderedRef = useRef(false);
  const childRef = useRef<ReactNode | null>(null);

  // 当组件首次可见时缓存子组件
  if (active && !renderedRef.current) {
    renderedRef.current = true;
    childRef.current = children;
  }
  // 仅当组件曾经可见过时才渲染
  if (!renderedRef.current) return null;

  // 不缓存用法: {children}，缓存用法: {childRef.current}
  return (
    <div
      style={{
        display: active ? 'block' : 'none',
        height: '100%',
        width: '100%',
      }}
    >
      {childRef.current}
    </div>
  );
} */

export function StyleKeepAlive(props: IAliveProps) {
  const { children, active } = props;

  // 1. 记录是否曾经激活过
  const [hasActivated, setHasActivated] = useState(false);

  if (active && !hasActivated) {
    setHasActivated(true);
  }

  // 2. 使用 useMemo 锁定 children
  // 只有当第一次激活时，这个缓存才会被填充
  const cachedChild = useMemo(() => {
    return children;
  }, [hasActivated]); // 注意：这里仅在 hasActivated 变化时才重新计算

  if (!hasActivated && !active) return null;

  return (
    <div
      style={{
        display: active ? 'block' : 'none',
        height: '100%',
        width: '100%',
      }}
    >
      {/* 使用缓存的 React Element */}
      {cachedChild}
    </div>
  );
}
