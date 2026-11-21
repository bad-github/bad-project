import '@xyflow/react/dist/style.css';
import {ReactFlow, type Node, useNodesState, useEdgesState, MiniMap, Controls, type Edge} from '@xyflow/react';
import {useTheme} from '@/hooks/use-theme';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: {label: 'Node 0'},
    position: {x: 250, y: 5},
  },
  {
    id: '2',
    data: {label: 'Group A'},
    style: {width: 200, height: 200, backgroundColor: 'skyblue'},
    type: 'group',
    position: {x: 100, y: 100},
  },
  {
    id: '2a',
    data: {label: '[A] Node 0'},
    parentId: '2',
    position: {x: 10, y: 50},
  },
  {
    id: '3',
    data: {label: 'Node 1'},
    position: {x: 320, y: 100},
  },
  {
    id: '4',
    data: {label: 'Group B'},
    style: {width: 400, height: 400, backgroundColor: 'gray'},
    type: 'group',
    position: {x: 320, y: 200},
  },
  {
    id: '4a',
    data: {label: '[B] Node 0'},
    parentId: '4',
    position: {x: 15, y: 65},
  },
  {
    id: '4b',
    data: {label: '[B] Node 1'},
    style: {
      backgroundColor: 'rgba(255, 0, 255, 0.2)',
      height: 200,
      width: 300,
    },
    parentId: '4',
    extent: 'parent', // 限制在父容器内移动
    position: {x: 90, y: 150},
  },
  {
    id: '4b1',
    data: {label: '[B] Node 1 child-0'},
    parentId: '4b',
    extent: 'parent',
    position: {x: 10, y: 40},
  },
  {
    id: '4b2',
    data: {label: '[B] Node 1 child-1'},
    parentId: '4b',
    position: {x: 120, y: 150},
  },
];

const initialEdges: Edge[] = [
  {id: 'e1-3', source: '1', target: '3'},
  {id: 'e2a-4a', source: '2a', target: '4a'},
  {id: 'e3-4b', source: '3', target: '4b'},
  {id: 'e4a-4b1', source: '4a', target: '4b1'},
  {id: 'e4a-4b2', source: '4a', target: '4b2'},
  {id: 'e4b1-4b2', source: '4b1', target: '4b2'},
];

const ReactFlowDemo2 = () => {
  const {resolvedTheme: theme = 'light'} = useTheme();

  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <ReactFlow
      colorMode={theme}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
    >
      <MiniMap />
      <Controls />
    </ReactFlow>
  );
};

export default ReactFlowDemo2;
