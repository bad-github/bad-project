'use client';

import {useEffect} from 'react';

type Props = Readonly<{
  error: Error & {digest?: string};
  unstable_retry: () => void;
}>;

/**
 * 整个 App Router 的最后一道错误边界。
 * global-error.tsx 位于 app 根目录，可以在根 layout 或根
 * template 渲染失败时接管页面。
 *
 * 触发后，Next.js 会用本组件替换根 layout，所以这里必须：
 * - 自己输出 <html> 和 <body>；
 * - 通过 <title> 设置标题，因为客户端组件不能导出 metadata；
 * - 避免依赖根 layout 提供的 next-intl、ThemeProvider、共享 UI 和全局样式。
 *
 * 这份界面有意使用系统字体和独立 CSS。即使布局依赖或应用样式本身导致
 * 异常，用户仍能看到一个可操作的恢复页面。
 */
export default function GlobalError({error, unstable_retry}: Props) {
  useEffect(() => {
    // 生产环境中的服务端错误信息会被 Next.js 隐去；digest 可用于关联服务端日志。
    console.error(error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <title>页面出现错误</title>
        <style>{`
          * { box-sizing: border-box; }
          html, body { min-width: 320px; min-height: 100%; margin: 0; }
          body {
            background: #fafafa;
            color: #18181b;
            font-family: Arial, Helvetica, sans-serif;
          }
          .global-error-main {
            min-height: 100dvh;
            display: grid;
            place-items: center;
            padding: 24px;
          }
          .global-error-panel {
            width: min(100%, 480px);
            padding: 32px;
            border: 1px solid #e4e4e7;
            border-radius: 16px;
            background: #fff;
            text-align: center;
            box-shadow: 0 12px 32px rgb(0 0 0 / 6%);
          }
          .global-error-title { margin: 0; font-size: 24px; line-height: 1.3; }
          .global-error-description { margin: 12px 0 0; color: #71717a; line-height: 1.6; }
          .global-error-digest { margin: 16px 0 0; color: #71717a; font: 12px/1.5 monospace; }
          .global-error-button {
            margin-top: 24px;
            padding: 10px 18px;
            border: 0;
            border-radius: 8px;
            background: #18181b;
            color: #fff;
            font: inherit;
            cursor: pointer;
          }
          .global-error-button:hover { background: #3f3f46; }
          .global-error-button:focus-visible { outline: 3px solid #a1a1aa; outline-offset: 3px; }
          @media (prefers-color-scheme: dark) {
            body { background: #09090b; color: #fafafa; }
            .global-error-panel { border-color: #27272a; background: #18181b; }
            .global-error-description, .global-error-digest { color: #a1a1aa; }
            .global-error-button { background: #fafafa; color: #18181b; }
            .global-error-button:hover { background: #d4d4d8; }
          }
        `}</style>
        <main className="global-error-main">
          <section className="global-error-panel" role="alert" aria-labelledby="global-error-title">
            <h1 id="global-error-title" className="global-error-title">
              页面暂时无法显示
            </h1>
            <p className="global-error-description">发生了意外错误，请稍后重试。</p>
            {error.digest ? <p className="global-error-digest">错误编号：{error.digest}</p> : null}
            <button className="global-error-button" type="button" onClick={unstable_retry}>
              重试
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
