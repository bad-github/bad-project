import {customNodeProps} from '@/page/open-source-lib/xy-flow/components/tool';
import type {Edge, Node} from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import type {ELK as ELKType} from 'elkjs/lib/elk.bundled.js';

// 布局类型
export type ELKLayout = 'vertical' | 'horizontal' | 'graph' | 'nested';

export class ElkProvider {
  private elk: ELKType;

  // 默认配置，也可以通过构造函数传入进行扩展
  static configs: Record<string, any> = {
    vertical: {
      'elk.algorithm': 'layered',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      'elk.spacing.nodeNode': '80',
      'elk.direction': 'DOWN',
    },
    horizontal: {
      'elk.algorithm': 'layered',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.spacing.nodeNodeBetweenLayers': '300',
      'elk.spacing.nodeNode': '80',
      'elk.direction': 'RIGHT',
    },
    graph: {
      'elk.algorithm': 'stress',
      'elk.spacing.nodeNode': '80',
      'elk.stress.desiredEdgeLength': '180',
      'elk.stress.maxIterations': '400',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.stress.gravity': '0.05',
    },
    nested: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.spacing.nodeNode': '200',
      'elk.layered.spacing.nodeNodeBetweenLayers': '300',
    },
    // 垂直顺序
    orderVertical: {
      'elk.algorithm': 'layered',
      // 表示层级从左向右流动，没有连线elk会将children判断为同一层级。处于“同一层”的节点必须在垂直方向上排开，以避免重叠
      'elk.direction': 'RIGHT',
      // 如果在同一层内无法通过连线确定先后，就严格参考输入数据的数组顺序。
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      // 拆掉了所有 children 之间的隐形隔板，强迫它们进入同一个排队系统
      'elk.separateConnectedComponents': 'false',
      'elk.padding': '[top=60,left=20,bottom=40,right=20]', // 容器内边距
      'elk.spacing.nodeNode': '40',
    },
  };

  constructor() {
    this.elk = new ELK();
  }

  public async onLayout(nodes: any[], edges: any[], type: ELKLayout) {
    const options = ElkProvider.configs[type];
    switch (type) {
      case 'vertical':
        return await this.getVerticalLayout(nodes, edges, options);
      case 'horizontal':
        return await this.getHorizontalLayout(nodes, edges, options);
      case 'graph':
        return await this.getGraphLayout(nodes, edges, options);
      case 'nested':
        return await this.getNestedLayout(nodes, edges, options);
      default:
        throw new Error(`Unsupported layout type: ${type}`);
    }
  }

  // 水平布局
  private async getHorizontalLayout(nodes: Node[], edges: Edge[], options: any) {
    const graph = {
      id: 'elk-horizontal-root',
      layoutOptions: options,
      edges: edges,
      children: nodes.map((node) => ({
        ...node,
        targetPosition: 'left',
        sourcePosition: 'right',
        id: node.id,
        width: node.width || customNodeProps.width,
        height: node.height || customNodeProps.height,
        origNode: node,
      })),
    };
    try {
      const layouted = await this.elk.layout(graph as any);
      return {
        nodes: layouted.children?.map((node: any) => ({
          ...node,
          position: {x: node.x, y: node.y},
        })),
        edges: layouted.edges,
      };
    } catch (err) {
      console.error('Error ELK:', err);
      return {nodes: [], edges: []};
    }
  }

  // 垂直布局
  private async getVerticalLayout(nodes: Node[], edges: Edge[], options: any) {
    const graph = {
      id: 'elk-vertical-root',
      layoutOptions: options,
      edges: edges,
      children: nodes.map((node) => ({
        ...node,
        targetPosition: 'top',
        sourcePosition: 'bottom',
        id: node.id,
        width: node.width || customNodeProps.width,
        height: node.height || customNodeProps.height,
        origNode: node,
      })),
    };
    try {
      const layouted = await this.elk.layout(graph as any);
      return {
        nodes: layouted.children?.map((node: any) => ({
          ...node,
          position: {x: node.x, y: node.y},
        })),
        edges: layouted.edges,
      };
    } catch (err) {
      console.error('Error ELK:', err);
      return {nodes: [], edges: []};
    }
  }

  // 图布局
  private async getGraphLayout(nodes: Node[], edges: Edge[], options: any) {
    const graph = {
      id: 'elk-graph-root',
      layoutOptions: options,
      edges: edges,
      children: nodes.map((node) => ({
        id: node.id,
        width: node.width || customNodeProps.width,
        height: node.height || customNodeProps.height,
        origNode: node,
      })),
    };

    try {
      const layouted = await this.elk.layout(graph as any);
      return {
        nodes: layouted.children?.map((node: any) => ({
          ...node.origNode,
          position: {x: node.x, y: node.y},
          style: {...node.origNode.style, width: node.width, height: node.height},
        })),
        edges: layouted.edges,
      };
    } catch (err) {
      console.error('Error ELK:', err);
      return {nodes: [], edges: []};
    }
  }
  /**
   * 嵌套布局
   * 节点数据结构必须拥有children属性，且里层有一个基础的宽高
   */
  private async getNestedLayout(nodes: any[], edges: any[], options: any) {
    const graph = {
      id: 'elk-nested-root',
      layoutOptions: options,
      children: nodes,
      edges,
    };
    try {
      const layouted = await this.elk.layout(graph as any);
      const flattenedNodes: any[] = [];
      const flattenedEdges: any[] = [];

      const traverse = (node: any, parentId?: string) => {
        // 排除掉 root 虚拟节点
        if (node.id !== 'elk-nested-root') {
          flattenedNodes.push({
            ...node,
            // 下面都是elk会改变的属性
            position: {x: node.x, y: node.y},
            parentId,
            width: node.width,
            height: node.height,
            style: {...node.style, width: node.width, height: node.height},
            children: undefined, // 拍平后移除 children 属性
          });
        }

        if (node.children) {
          node.children.forEach((child: any) => traverse(child, node.id === 'elk-nested-root' ? undefined : node.id));
        }

        if (node.edges) {
          flattenedEdges.push(...node.edges);
        }
      };

      traverse(layouted);
      return {nodes: flattenedNodes, edges: flattenedEdges};
    } catch (err) {
      // 一条edge必须被定义在source与target的最近公共祖先graph中，若存在跨层级节点的连线，则会抛出异常
      console.error('Error ELK:', err);
      return {nodes: [], edges: []};
    }
  }
}

export const elkProvider = new ElkProvider();
