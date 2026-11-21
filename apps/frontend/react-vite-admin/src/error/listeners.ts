import {errorManager} from './error-manager';

export function initGlobalErrorListeners() {
  // 1️⃣ 同步错误
  window.onerror = (event, _source, _lineno, _colno, error) => {
    errorManager.report(error || event, {type: 'onerror'});
  };

  // 2️⃣ Promise 未捕获
  window.addEventListener('unhandledrejection', (event) => {
    errorManager.report(event.reason, {type: event.type ||'unhandledrejection'});
  });

  // 3️⃣ 资源加载错误（必须设置capture=true），因为资源 error 不冒泡
  window.addEventListener(
    'error',
    (event: any) => {
      const target = event.target;

      if (target instanceof HTMLImageElement) {
        errorManager.report(new Error(`Image load failed: ${target.src}`), {type: 'image load error'});
      }

      if (target instanceof HTMLScriptElement) {
        errorManager.report(new Error(`Script load failed: ${target.src}`), {type: 'script load error'});
      }
    },
    true
  );
}
