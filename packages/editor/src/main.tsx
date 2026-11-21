import {createRoot} from 'react-dom/client';
import {EditorDemo} from './demo/editor-demo';
import './styles/global.css'; // 将global单独引入，因为lib打包模式不需要此样式

// StrictMode 会导致tiptap有些组件生命周期不幂等的执行
createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <EditorDemo />
  // </StrictMode>
);
