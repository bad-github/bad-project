import {StorageKeys} from '../../../../utils/storage-keys';

import {Button, Label, Checkbox, RadioGroup, RadioGroupItem, BadTooltip} from '@badnpm/ui';
import {type Dispatch, type SetStateAction, useMemo} from 'react';
import {BackgroundVariant, useReactFlow, MarkerType} from '@xyflow/react';
import type {DefaultEdgeOptions, Edge, Node, ReactFlowInstance, Viewport} from '@xyflow/react';
import type {UseMeasureRect} from 'react-use/lib/useMeasure';
import {useTranslation} from 'react-i18next';
import IconQuestion from '@/assets/svg/circle-question-mark.svg?react';
import {getNextId} from './tool';
import {EdgeType, NodeType, type TEdgeType, type TNodeType} from '../types';
import {buildNode} from '../create-node';
import type {ELKLayout} from '@/class/elk-provider';
import {LS} from '@/utils/storage';

import {customNodeProps} from '../components/tool';

type TProps = {
  flowSize: UseMeasureRect;
  showDevTools: boolean;
  setShowDevTools: Dispatch<SetStateAction<boolean>>;
  showWatermark: boolean;
  setShowWatermark: Dispatch<SetStateAction<boolean>>;
  showMiniMap: boolean;
  setShowMiniMap: Dispatch<SetStateAction<boolean>>;
  showControls: boolean;
  setShowControls: Dispatch<SetStateAction<boolean>>;
  backgroundType: BackgroundVariant;
  setBackgroundType: Dispatch<SetStateAction<BackgroundVariant>>;
  showMenu: boolean;
  setShowMenu: Dispatch<SetStateAction<boolean>>;
  edgeType: TEdgeType;
  setEdgeType: Dispatch<SetStateAction<TEdgeType>>;
  allowSelfConnection: boolean;
  setAllowSelfConnection: Dispatch<SetStateAction<boolean>>;
  markEnd: boolean;
  setMarkEnd: Dispatch<SetStateAction<boolean>>;
  setEdgeOptions: Dispatch<SetStateAction<any>>;
  handleLayout: (nodes: Node[], edges: Edge[], type: ELKLayout) => void;
  rfInstance: ReactFlowInstance<Node, Edge> | null;
};

const offset = 12;

/**
 *
 * @param position 节点位置
 * @param x
 * @param y
 * @param zoom
 * @param flowSize 画布尺寸
 * @returns
 */
const calcCornerPosition = (
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight',
  viewport: Viewport,
  flowSize: UseMeasureRect
) => {
  const {x, y, zoom} = viewport;
  if (position === 'topLeft') {
    return {x: -x / zoom + offset, y: -y / zoom + offset};
  } else if (position === 'topRight') {
    return {x: (flowSize.width - x) / zoom - customNodeProps.width - offset, y: -y / zoom + offset};
  } else if (position === 'bottomLeft') {
    return {x: -x / zoom + offset, y: (flowSize.height - y) / zoom - customNodeProps.height - offset};
  } else {
    return {
      x: (flowSize.width - x) / zoom - customNodeProps.width - offset,
      y: (flowSize.height - y) / zoom - customNodeProps.height - offset,
    };
  }
};

export default function Action(props: TProps) {
  const {
    flowSize,
    showDevTools,
    setShowDevTools,
    showWatermark,
    setShowWatermark,
    showMiniMap,
    setShowMiniMap,
    showControls,
    setShowControls,
    backgroundType,
    setBackgroundType,
    showMenu,
    setShowMenu,
    edgeType,
    setEdgeType,
    allowSelfConnection,
    setAllowSelfConnection,
    markEnd,
    setMarkEnd,
    setEdgeOptions,
    handleLayout,
    rfInstance,
  } = props;
  const {getViewport, addNodes, addEdges, getNodes, getEdges, setViewport, setEdges, setNodes} = useReactFlow();
  const {t} = useTranslation();

  const backgroundTypes = useMemo(() => {
    return [
      {value: BackgroundVariant.Cross, label: t('lib.cross')},
      {value: BackgroundVariant.Dots, label: t('lib.dots')},
      {value: BackgroundVariant.Lines, label: t('lib.lines')},
    ];
  }, [t]);

  const edgeOptions = useMemo(() => {
    return [
      {value: EdgeType.default, label: t('lib.defaultEdge')},
      {value: EdgeType.commonEdge, label: t('lib.commonEdge')},
    ];
  }, [t]);

  const handleAddNode = (type: TNodeType, data?: any) => {
    const id = `n${getNextId()}`;
    const finalData = data ? {...data, label: id} : {label: id};
    requestAnimationFrame(() => {
      const viewport = getViewport();
      addNodes([buildNode({type, id, position: calcCornerPosition('topRight', viewport, flowSize), data: finalData})]);
    });
  };

  const handleAddEdge = (type: TEdgeType) => {
    addEdges({id: 'n7-n8', source: 'n7', target: 'n8', type});
  };

  const handleDragStart = (e: React.DragEvent<HTMLElement>) => {
    e.dataTransfer.setData('application/addNode', JSON.stringify({type: NodeType.default}));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSave = () => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      LS.set(StorageKeys.flowDemo, JSON.stringify(flow));
    }
  };

  const handleRestore = () => {
    const flow = JSON.parse(LS.get(StorageKeys.flowDemo) || '{}');
    if (flow) {
      const {x = 0, y = 0, zoom = 1} = flow.viewport;
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      setViewport({x, y, zoom});
    }
  };

  const newLocal = 'lib.showDevtools';
  return (
    <div className="flex flex-wrap gap-2 [&>*]:rounded-md [&>*]:border-1 [&>*]:p-2">
      <Label>
        <Checkbox checked={showDevTools} onCheckedChange={(checked: boolean) => setShowDevTools(checked)} />
        {t(newLocal)}
      </Label>
      <Label>
        <Checkbox checked={showWatermark} onCheckedChange={(checked: boolean) => setShowWatermark(checked)} />
        {t('lib.showWatermark')}
      </Label>
      <Label>
        <Checkbox checked={showMiniMap} onCheckedChange={(checked: boolean) => setShowMiniMap(checked)} />
        {t('lib.showMiniMap')}
      </Label>
      <Label>
        <Checkbox checked={showControls} onCheckedChange={(checked: boolean) => setShowControls(checked)} />
        {t('lib.showControls')}
      </Label>
      <Label>
        <Checkbox
          checked={allowSelfConnection}
          onCheckedChange={(checked: boolean) => setAllowSelfConnection(checked)}
        />
        {t('lib.allowSelfConnection')}
      </Label>
      <Label>
        <Checkbox checked={showMenu} onCheckedChange={(checked: boolean) => setShowMenu(checked)} />
        {t('lib.showContextMenu')}
      </Label>
      <Label>
        <Checkbox
          checked={markEnd}
          onCheckedChange={(checked: boolean) => {
            setMarkEnd(checked);
            if (checked) {
              setEdgeOptions((prev: DefaultEdgeOptions) => ({
                ...prev,
                markerEnd: {type: MarkerType.ArrowClosed, width: 32, height: 32},
              }));
            } else {
              setEdgeOptions((prev: DefaultEdgeOptions) => {
                const newOptions = {...prev};
                delete newOptions.markerEnd;
                return newOptions;
              });
            }
          }}
        />
        {t('lib.addMarkEnd')}
        <BadTooltip
          trigger={{
            render: <IconQuestion className="size-4" />,
          }}
          content={{children: t('lib.connectRule')}}
        />
      </Label>

      <Label>
        <RadioGroup
          className="flex flex-wrap"
          defaultValue={backgroundType}
          onValueChange={(value) => setBackgroundType(value as BackgroundVariant)}
        >
          {backgroundTypes.map((v) => (
            <div className="flex items-center gap-1" key={v.value}>
              <RadioGroupItem id={`background-${v.value}`} value={v.value} />
              <Label htmlFor={`background-${v.value}`}>{v.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </Label>
      <Label>
        <RadioGroup
          className="flex flex-wrap"
          defaultValue={edgeType}
          onValueChange={(value) => setEdgeType(value as TEdgeType)}
        >
          {edgeOptions.map((v) => (
            <div className="flex items-center gap-1" key={v.value}>
              <RadioGroupItem id={`edge-${v.value}`} value={v.value} />
              <Label htmlFor={`edge-${v.value}`}>{v.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </Label>
      <Label className="cursor-grab" onDragStart={handleDragStart} draggable>
        {t('lib.dragDefaultNode')}
      </Label>
      <hr className="w-full border-none p-0!" />
      <Button onClick={() => handleAddEdge(EdgeType.default)}>{t('lib.addDefaultEdge')}[n7-n8]</Button>
      <Button onClick={() => handleAddNode(NodeType.default)}>{t('lib.addDefaultNode')}</Button>
      <Button onClick={() => handleAddNode(NodeType.commonNode)}>{t('lib.addCommonNode')}</Button>
      <Button onClick={() => handleAddNode(NodeType.multipleSourceNode)}>{t('lib.addMultipleSourceNode')}</Button>
      <Button onClick={() => handleAddNode(NodeType.connectionLimitNode, {connectionCount: 1})}>
        {t('lib.addConnectionLimitNode')}
      </Button>
      <Button onClick={() => handleAddNode(NodeType.placeholderNode)}>{t('lib.addPlaceholderNode')}</Button>
      <Button onClick={() => handleLayout(getNodes(), getEdges(), 'vertical')}>{t('lib.verticalLayout')}</Button>
      <Button onClick={() => handleLayout(getNodes(), getEdges(), 'horizontal')}>{t('lib.horizontalLayout')}</Button>
      {/* 节点中渲染为children的无法持久化 */}
      <Button onClick={handleSave}>{t('common.save')}</Button>
      <Button onClick={handleRestore}>{t('common.restore')}</Button>
    </div>
  );
}
