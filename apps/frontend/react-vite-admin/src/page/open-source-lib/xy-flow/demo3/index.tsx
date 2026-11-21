import './index.css';
import '@xyflow/react/dist/style.css';
import {useCallback, useEffect, useRef} from 'react';
import {
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import type {Edge, Node, OnEdgesChange, OnNodesChange} from '@xyflow/react';
import {useTheme} from '@/hooks/use-theme';
import {edgeSeparator, initialEdges, initialNodes, routes} from './tool';
import {type ELKLayout, elkProvider} from '@/class/elk-provider';
import FlowMap from '../components/flow-map';
import {EdgeTypeComponent} from '../components/edge';
import {NodeTypeComponent} from '../components/node';
import {Button} from '@badnpm/ui';
import {animateEdgeId} from '../components/edge/animated-edge';
import useFlowStore from '@/store/flow-store';
import {EdgeType} from '../types';

// 可以配置多个自定义节点类型
const nodeTypes = {
  // 会对应的key添加到节点的样式类中
  ...NodeTypeComponent,
};

const edgeTypes = {
  ...EdgeTypeComponent,
};
const BasicFlow = () => {
  const {fitView, deleteElements, addEdges} = useReactFlow();
  const {resolvedTheme: theme = 'light'} = useTheme();
  // 在 Node 环境中返回的是 NodeJS.Timeout，在浏览器环境中返回的是 number
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const edgePath = useFlowStore((s) => s.edgePath);

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
        fitView({duration: 200});
      });
    },
    [setNodes, setEdges, fitView]
  );

  useEffect(() => {
    if (!initialEdges.length || !initialNodes.length) return;
    handleLayout(initialNodes, initialEdges, 'graph');
  }, [initialNodes, initialEdges]);

  useEffect(() => {
    if (!nodesInitialized) return;
    fitView({duration: 200});
  }, [nodesInitialized]);

  const handleNodeChange: OnNodesChange = useCallback(
    (changes) => {
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

  const handleAddEdge = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (!timeoutRef.current) return;
      // 有多条路径
      const paths: string[][] = [];
      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        paths[i] = [];
        for (let j = 0; j < route.length - 1; j++) {
          const curNode = route[j];
          const nextNode = route[j + 1];
          const edgeId = `${curNode.name}${edgeSeparator}${nextNode.name}`;
          const reverseEdgeId = `${nextNode.name}${edgeSeparator}${curNode.name}`;
          if (edgePath.has(edgeId)) {
            paths[i].push(edgePath.get(edgeId)?.opposite || '');
          } else if (edgePath.has(reverseEdgeId)) {
            paths[i].push(edgePath.get(reverseEdgeId)?.reverse || '');
          }
        }
      }
      if (routes.length > 0) {
        const startNode = routes[0]?.[0];
        const endNode = routes[0]?.[routes[0].length - 1];
        deleteElements({edges: [{id: animateEdgeId}]});
        requestAnimationFrame(() => {
          addEdges({
            type: EdgeType.animatedEdge,
            id: animateEdgeId,
            source: startNode.name,
            target: endNode.name,
            data: {paths},
          });
        });
      }
      timeoutRef.current = null;
    }, 200);
  };

  return (
    <ReactFlow
      className="my-react-flow3"
      colorMode={theme}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodes={nodes}
      edges={edges}
      onEdgesChange={handleEdgeChange}
      onNodesChange={handleNodeChange}
    >
      <FlowMap />
      <Controls />
      <Panel>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleAddEdge();
          }}
        >
          路径动画
        </Button>
      </Panel>
    </ReactFlow>
  );
};

export default function ReactFlowDemo3() {
  return (
    <ReactFlowProvider>
      <BasicFlow />
    </ReactFlowProvider>
  );
}
