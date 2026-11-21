import {Button} from '@badnpm/ui';
import {type FC, useEffect, useRef} from 'react';

/**
 *
 * 在捕获阶段：合成事件优先于原生事件执行。在冒泡阶段：原生事件优先于合成事件执行
 */

const App: FC = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const documentCapture = (): void => {
      console.log('原生事件：document 捕获');
    };

    const documentBubble = (): void => {
      console.log('原生事件：document 冒泡');
    };

    const parentCapture = (): void => {
      console.log('原生事件：父元素 DOM 捕获');
    };

    const parentBubble = (): void => {
      console.log('原生事件：父元素 DOM 冒泡');
    };

    const childCapture = (): void => {
      console.log('原生事件：子元素 DOM 捕获');
    };

    const childBubble = (): void => {
      console.log('原生事件：子元素 DOM 冒泡');
    };

    document.addEventListener('click', documentCapture, true);
    document.addEventListener('click', documentBubble);

    const parent = parentRef.current;
    const child = childRef.current;

    parent?.addEventListener('click', parentCapture, true);
    parent?.addEventListener('click', parentBubble);

    child?.addEventListener('click', childCapture, true);
    child?.addEventListener('click', childBubble);

    return () => {
      document.removeEventListener('click', documentCapture, true);
      document.removeEventListener('click', documentBubble);

      parent?.removeEventListener('click', parentCapture, true);
      parent?.removeEventListener('click', parentBubble);

      child?.removeEventListener('click', childCapture, true);
      child?.removeEventListener('click', childBubble);
    };
  }, []);

  const reactParentCapture = () => {
    console.log('React 事件：父元素捕获');
  };

  const reactChildCapture = () => {
    console.log('React 事件：子元素捕获');
  };

  const reactParentBubble = () => {
    console.log('React 事件：父元素冒泡');
  };

  const reactChildBubble = () => {
    console.log('React 事件：子元素冒泡');
  };

  const reactChildBubbleStop = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 阻止子元素原生和合成事件的冒泡
    e.stopPropagation();

    console.log('React 事件：按钮冒泡（stopPropagation）');
  };

  return (
    <div ref={parentRef} onClick={reactParentBubble} onClickCapture={reactParentCapture} className="p-4">
      <h2>React 合成事件与原生事件</h2>

      <p
        ref={childRef}
        onClick={reactChildBubble}
        onClickCapture={reactChildCapture}
        className="cursor-pointer border border-green-400 p-2"
      >
        点击我（普通情况）
      </p>

      <Button onClick={reactChildBubbleStop} className="mt-2">
        点击我（stopPropagation）
      </Button>
    </div>
  );
};

export default App;
