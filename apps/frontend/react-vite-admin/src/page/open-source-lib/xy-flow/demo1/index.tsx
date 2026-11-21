import {toast} from '@badnpm/ui';
import '@xyflow/react/dist/style.css';
import './index.css';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ControlButton,
  ReactFlow,
  ReactFlowProvider,
  reconnectEdge,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import type {
  Edge,
  Node,
  NodeMouseHandler,
  OnConnect,
  OnEdgesChange,
  OnNodeDrag,
  OnNodesChange,
  OnReconnect,
  ReactFlowInstance,
  SnapGrid,
} from '@xyflow/react';
import {useMeasure} from 'react-use';
import {useTheme} from '@/hooks/use-theme';
import {getNextId, initialEdges, initialNodes} from './tool';
import DevTools from '../components/devtools';
import FlowMap from '../components/flow-map';
import Action from './action';
import {EdgeType, type TEdgeType} from '../types';
import ConnectionLine from '../components/connection-line';
import {EdgeTypeComponent} from '../components/edge';
import {NodeTypeComponent} from '../components/node';
import {type ELKLayout, elkProvider} from '@/class/elk-provider';
import FlowControls from '../components/flow-controls';
import {RotateCcw} from 'lucide-react';
import {buildNode} from '../create-node';
import {defaultEdgeOptions, defaultFlowProps} from '../components/tool';
import {useFloatingNode} from '@/hooks/use-floating-node';
import Menu from './context-menu';

// 可以配置多个自定义节点类型
const nodeTypes = {
  // 会对应的key添加到节点的样式类中
  ...NodeTypeComponent,
};

const edgeTypes = {
  ...EdgeTypeComponent,
};
const BasicFlow = () => {
  const {addNodes, getIntersectingNodes, fitView, screenToFlowPosition} = useReactFlow();
  const [measureRef, size] = useMeasure<HTMLDivElement>();
  const flowRef = useRef<HTMLDivElement | null>(null);
  const getFlowRef = (dom: HTMLDivElement | null) => {
    flowRef.current = dom;
    if (dom) {
      measureRef(dom);
    }
  };
  const {open, close, floatingNode} = useFloatingNode();
  const {resolvedTheme: theme = 'light'} = useTheme();
  const [showDevTools, setShowDevTools] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [backgroundType, setBackgroundType] = useState<BackgroundVariant>(BackgroundVariant.Dots);
  const [allowSelfConnection, setAllowSelfConnection] = useState(false);
  const [markEnd, setMarkEnd] = useState(true);
  const [edgeType, setEdgeType] = useState<TEdgeType>(EdgeType['default']);
  const [edgeOptions, setEdgeOptions] = useState(defaultEdgeOptions);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<Node, Edge> | null>(null);
  const [menu, setMenu] = useState<Record<string, any> | null>(null);
  const [showMenu, setShowMenu] = useState(true);

  const snapProps = useMemo<{snapGrid: SnapGrid; snapToGrid: boolean}>(() => {
    return {
      snapToGrid: backgroundType === BackgroundVariant.Lines,
      snapGrid: [32, 32],
    };
  }, [backgroundType]);

  // 需要引入ReactFlowProvider
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const nodesInitialized = useNodesInitialized();

  const handleLayout = useCallback(
    (nodes: Node[], edges: Edge[], type: ELKLayout) => {
      elkProvider.onLayout(nodes, edges, type).then((res) => {
        const {nodes: layoutedNodes, edges: layoutedEdges} = res || {};
        setNodes(layoutedNodes || nodes);
        setEdges(layoutedEdges || edges);
        if (nodesInitialized) {
          fitView({duration: 200});
        } else {
          setTimeout(() => {
            fitView({duration: 200});
          }, 200);
        }
      });
    },
    [nodesInitialized, fitView, setEdges, setNodes]
  );

  useEffect(() => {
    if (!initialEdges.length || !initialNodes.length) return;
    handleLayout(initialNodes, initialEdges, 'horizontal');
  }, [initialNodes, initialEdges]);

  // 添加节点也会导致nodesInitialized变化
  /* useEffect(() => {
    if (!nodesInitialized) return;
    fitView({duration: 200});
  }, [nodesInitialized]); */

  const handleNodeChange: OnNodesChange = useCallback(
    (changes) => {
      console.log(changes, 'handleNodeChange');
      /**
       * 触发的时机，可以自定义一些逻辑
       * (1)添加一个节点会执行两次
       *    (1.1)type=add：添加节点
       *    (1.2)type=dimensions：更新节点尺寸
       * (2)删除节点：type=remove
       * (3)选中节点：type=select
       */
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgeChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  // 添加连线
  const handleConnect: OnConnect = useCallback(
    (params) => {
      console.log('onConnect', params, edgeType);
      setEdges((edgesSnapshot) => addEdge({...params, type: edgeType}, edgesSnapshot));
    },
    [edgeType, setEdges]
  );

  const handleReconnect: OnReconnect = useCallback(
    (oldEdge, newConnection) => setEdges((els) => reconnectEdge(oldEdge, newConnection, els)),
    [setEdges]
  );

  const handleNodeDrag: OnNodeDrag = useCallback(
    (_, node) => {
      const intersections = getIntersectingNodes(node).map((n) => n.id);
      setNodes((ns) =>
        ns.map((n) => ({
          ...n,
          className: intersections.includes(n.id) ? 'highlight' : '',
        }))
      );
      // console.log('drag event', node.data);
    },
    [setNodes, getIntersectingNodes]
  );

  const handleNodeClick: NodeMouseHandler = useCallback((event, node) => {
    console.log('node click', event, node);
    toast.add({title: node.id, type: 'info'});
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault(); // 保证drop触发
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      const {type} = JSON.parse(event.dataTransfer.getData('application/addNode') || '{}');
      if (!type) return;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const id = `n${getNextId()}`;

      addNodes([buildNode({type, id, position, data: {label: `Node ${id}`}})]);
    },
    [screenToFlowPosition, addNodes]
  );

  const onNodeContextMenu: NodeMouseHandler = (event, node) => {
    event.preventDefault();
    setMenu({
      style: {position: 'fixed', zIndex: 10, left: event.clientX, top: event.clientY},
      open: true,
      event: {
        clientX: event.clientX,
        clientY: event.clientY,
      },
      data: node,
    });
  };
  // @ts-expect-error unused
  const _onNodeContextMenu: NodeMouseHandler = (event, node) => {
    if (!flowRef.current) return;
    open(event, {
      clientX: event.clientX,
      clientY: event.clientY,
      // 如果你想让菜单挂载在某个局部容器内，请取消下面注释
      container: flowRef.current,
      node: (
        <div className="bg-accent rounded-md p-2 text-xs shadow-xs">
          <h1>{node.id}</h1>
          <div
            className="hover:bg-card cursor-pointer whitespace-nowrap"
            onClick={() => {
              toast.add({title: `click ${node.id}`, type: 'info'});
              close();
            }}
          >
            long long text
          </div>
        </div>
      ),
    });
  };

  return (
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1" ref={getFlowRef}>
        <ReactFlow
          className="my-react-flow"
          onInit={setRfInstance}
          colorMode={theme}
          {...defaultFlowProps}
          defaultEdgeOptions={edgeOptions}
          // 去掉水印
          proOptions={{hideAttribution: !showWatermark}}
          // 水印位置
          attributionPosition="bottom-right"
          {...snapProps}
          // 不允许自连接
          isValidConnection={(connection) => {
            if (allowSelfConnection) return true;
            return connection.source !== connection.target;
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          // fitView
          // fitViewOptions={fitViewOptions} // 并不会对fitView生效
          // 没有自定义connectionLineComponent时，可以设置connectionLineType来控制连线的样式
          connectionLineType={ConnectionLineType.Bezier}
          // 自定义拖拽连线时（还没放下之前）那条跟随鼠标的线条，此时connectionLineType无效，连线的样式由自定义实现
          connectionLineComponent={(props) => <ConnectionLine {...props} type={ConnectionLineType.Bezier} />}
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodeChange}
          onEdgesChange={handleEdgeChange}
          onConnectStart={(_e) => {
            console.log('onConnectStart');
          }}
          onConnectEnd={(_e) => {
            console.log('onConnectEnd');
          }}
          onConnect={handleConnect}
          // 可以拖动线的source、target，从而改变连线的路径
          onReconnect={handleReconnect}
          onNodeDrag={handleNodeDrag}
          onNodeClick={handleNodeClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          // 右键点击节点
          onNodeContextMenu={onNodeContextMenu}
          // 点击空白画布
          onPaneClick={close}
        >
          {/* 
          gap：默认值20
              对 Dots：间距
              对 Cross：间距
              对 Lines：矩形宽高
          size：
              对 Dots：控制每个点的半径（radius）
              对 Cross：控制每个十字的大小
              对 Lines：无效
           */}
          <Background variant={backgroundType} gap={[32, 32]} />
          {showControls && (
            <>
              {/* 内置 */}
              {/* <Controls /> */}
              <FlowControls>
                <ControlButton onClick={() => handleLayout(initialNodes, initialEdges, 'horizontal')}>
                  <RotateCcw className="fill-none!" />
                </ControlButton>
              </FlowControls>
            </>
          )}
          {showDevTools && <DevTools />}
          {showMiniMap && <FlowMap />}
          {showMenu && floatingNode}
          {showMenu && <Menu {...menu} />}
        </ReactFlow>
      </div>
      <div className="w-100 flex-shrink-0 border-1 px-4 py-2">
        <Action
          flowSize={size}
          showControls={showControls}
          setShowControls={setShowControls}
          showDevTools={showDevTools}
          setShowDevTools={setShowDevTools}
          showMiniMap={showMiniMap}
          setShowMiniMap={setShowMiniMap}
          showWatermark={showWatermark}
          setShowWatermark={setShowWatermark}
          backgroundType={backgroundType}
          setBackgroundType={setBackgroundType}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          edgeType={edgeType}
          setEdgeType={setEdgeType}
          allowSelfConnection={allowSelfConnection}
          setAllowSelfConnection={setAllowSelfConnection}
          markEnd={markEnd}
          setMarkEnd={setMarkEnd}
          setEdgeOptions={setEdgeOptions}
          handleLayout={handleLayout}
          rfInstance={rfInstance}
        />
      </div>
    </div>
  );
};

export default function ReactFlowDemo1() {
  return (
    <ReactFlowProvider>
      <BasicFlow />
    </ReactFlowProvider>
  );
}
