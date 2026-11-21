import {PrismLight as SyntaxHighlighter} from 'react-syntax-highlighter';
// todo，使用一次加载一次？
import {vscDarkPlus, duotoneLight} from 'react-syntax-highlighter/dist/esm/styles/prism';
import VirtualRenderer from './virtual-renderer';
import {useTheme} from '@/hooks/use-theme';
import SimpleRenderer from './simple-renderer';

// SyntaxHighlighter中render的属性
export interface HLRendererProps {
  rows: rendererNode[];
  stylesheet: {[key: string]: React.CSSProperties};
  useInlineStyles: boolean;
}
type TProps = {
  language: string;
  data: string;
  isVirtual?: boolean; // 是否开启虚拟滚动，若开启则需要传递虚拟高度
  virtualHeight?: number;
  autoScrollBottom?: boolean;
  className?: string;
};

export default function Highlighter(props: TProps) {
  const {data, language, isVirtual, virtualHeight = 500, autoScrollBottom} = props;
  const {resolvedTheme: theme = 'light'} = useTheme();
  return (
    <SyntaxHighlighter
      showLineNumbers
      // wrapLongLines，虚拟列表时每行高度是确定的，所以不建议设置此属性
      language={language}
      style={theme === 'dark' ? vscDarkPlus : duotoneLight}
      customStyle={{
        ...(isVirtual ? {height: virtualHeight} : {height: '100%'}),
        minWidth: '100%',
        // width: 'fit-content',
        width: '100%',
        padding: 0,
        margin: 0,
      }}
      renderer={(props) => (
        <>
          {isVirtual ? (
            // 注意设置虚拟化高度时要注意中间容器的padding、border等
            <VirtualRenderer {...props} height={virtualHeight} autoScrollBottom={autoScrollBottom} rowHeight={24} />
          ) : (
            <SimpleRenderer {...props} />
          )}
        </>
      )}
    >
      {data}
    </SyntaxHighlighter>
  );
}
