import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ready} from './i18n';
import '@/styles/index.css';
import {observeWebVitals} from './performance/web-vitals';
import {reportWebVital} from './performance/report-web-vital';
// 首次语言加载完成后再渲染，避免页面短暂显示翻译键。
const rootElement = document.getElementById('g-root')!;
ready
  .then(() => {
    createRoot(rootElement).render(<App />);
  })
  .catch((error) => {
    console.error('Failed to initialize application translations', error);
    rootElement.textContent = '页面加载失败，请刷新重试。 / Failed to load. Please refresh.';
  });

console.log('process.env.BUILD_ENV', process.env.BUILD_ENV);

// 开发环境直接查看指标；生产环境仅在配置上报地址后加载监控代码。
if (import.meta.env.DEV || import.meta.env.VITE_WEB_VITALS_ENDPOINT) {
  observeWebVitals(reportWebVital);
}
