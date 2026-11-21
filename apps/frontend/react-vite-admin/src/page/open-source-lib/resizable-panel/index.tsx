import {Button} from '@badnpm/ui';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {type ReactNode, useMemo, useRef, useState} from 'react';
import {Group, Panel, Separator, useGroupRef, usePanelRef} from 'react-resizable-panels';

type TProps = {
  leftSize?: number;
  rightSize?: number;
  groupId?: string;
  leftId?: string;
  rightId?: string;
  left: ReactNode;
  right: ReactNode;
};

function ResizablePanel(props: TProps) {
  const {
    leftSize: originLeftSize,
    rightSize: originRightSize,
    groupId = 'group',
    leftId = 'leftId',
    rightId = 'rightId',
    left,
    right,
  } = props;
  /**
   * 左右size皆有：则以左size为准
   * 左右size皆无：则默认设置左size为300
   * 左size无，右size有：则以右size为准
   * 左size有，右size无：则以左size为准
   */
  const hasLeft = !!originLeftSize;
  const hasRight = !!originRightSize;
  const leftSize = useMemo(() => {
    if (hasLeft && hasRight) return originLeftSize!;
    if (!hasLeft && !hasRight) return 300;
    if (hasLeft && !hasRight) return originLeftSize!;
  }, [hasLeft, hasRight, originLeftSize]);

  const rightSize = useMemo(() => {
    if (hasRight && !hasLeft) return originRightSize!;
  }, [hasRight, hasLeft, originRightSize]);

  // 都没传递size时，默认以left为准
  // const leftSize = !originLeftSize && !originRightSize ? 300 : originLeftSize;
  const groupRef = useGroupRef();
  const leftPanelRef = usePanelRef();
  const rightPanelRef = usePanelRef();
  const [leftIsCollapsed, setLeftIsCollapsed] = useState(false);
  const [rightIsCollapsed, setRightIsCollapsed] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleLeft = () => {
    const leftCollapsed = leftPanelRef.current?.isCollapsed();
    const rightCollapsed = rightPanelRef.current?.isCollapsed();
    if (leftCollapsed) return;
    if (rightCollapsed) {
      setRightIsCollapsed(false);
      if (leftSize) {
        if (elementRef.current) {
          rightPanelRef.current?.resize(elementRef.current.offsetWidth - leftSize);
        }
      } else if (rightSize) {
        rightPanelRef.current?.resize(rightSize);
      }
    } else {
      setLeftIsCollapsed(true);
      leftPanelRef.current?.collapse();
    }
  };

  const handleRight = () => {
    const leftCollapsed = leftPanelRef.current?.isCollapsed();
    const rightCollapsed = rightPanelRef.current?.isCollapsed();
    if (rightCollapsed) return;
    if (leftCollapsed) {
      setLeftIsCollapsed(false);
      if (leftSize) {
        leftPanelRef.current?.resize(leftSize);
      } else if (rightSize) {
        if (elementRef.current) {
          leftPanelRef.current?.resize(elementRef.current.offsetWidth - rightSize);
        }
      }
    } else {
      setRightIsCollapsed(true);
      rightPanelRef.current?.collapse();
    }
  };

  return (
    <Group id={groupId} groupRef={groupRef} elementRef={elementRef} orientation="horizontal" className="h-full">
      <Panel
        id={leftId}
        panelRef={leftPanelRef}
        defaultSize={leftSize}
        collapsible
        onResize={() => {
          if (leftPanelRef.current?.isCollapsed()) {
            setLeftIsCollapsed(true);
          } else {
            setLeftIsCollapsed(false);
          }
        }}
      >
        {left}
      </Panel>
      {/* 遗留问题:在按钮上仍然可以拖拽,拖拽结束后会触发按钮事件 */}
      <Separator className="bg-accent flex w-8 flex-col items-center justify-center gap-2 outline-none">
        {!leftIsCollapsed && (
          <Button variant="outline" size="icon" className="size-6 cursor-pointer!" onClick={handleLeft}>
            <ChevronLeft />
          </Button>
        )}
        {!rightIsCollapsed && (
          <Button variant="outline" size="icon" className="size-6 cursor-pointer!" onClick={handleRight}>
            <ChevronRight />
          </Button>
        )}
      </Separator>
      <Panel
        id={rightId}
        panelRef={rightPanelRef}
        defaultSize={rightSize}
        collapsible
        onResize={() => {
          if (rightPanelRef.current?.isCollapsed()) {
            setRightIsCollapsed(true);
          } else {
            setRightIsCollapsed(false);
          }
        }}
      >
        {right}
      </Panel>
    </Group>
  );
}

export default function ResizablePanelPage() {
  return (
    <ResizablePanel
      rightSize={400}
      left={<div className="h-full border border-pink-400">left</div>}
      right={<div className="h-full border border-pink-400">right</div>}
    />
  );
}
