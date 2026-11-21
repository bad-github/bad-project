/**
 * 树相关的函数
 */

import type {
  TreeNode,
  TreeNodeConfig,
  TreeSearch,
  TreePredicate,
  TreeCollection,
  TreeItemFactory,
  TreeNodePath,
} from './types';

const defaultTreeNodeConfig = {uniqueKey: 'id', labelKey: 'label', childrenKey: 'children', keyPath: 'idPath'};

function searchTree(tree: TreeNode[], keyword: string, config: TreeNodeConfig = {}): TreeSearch {
  const {labelKey, uniqueKey, childrenKey} = {...defaultTreeNodeConfig, ...config};
  const parentKeys = new Set<string>();
  const normalizedKeyword = keyword.toLowerCase();

  function dfs(nodes: TreeNode[], parents: string[]): TreeNode[] {
    const result: TreeNode[] = [];

    for (const node of nodes) {
      const title = node[labelKey];
      const key = node[uniqueKey];
      const children = node[childrenKey] as TreeNode[] | undefined;

      // 数字标签参与搜索；缺失标签或 React 节点等对象不参与文本匹配。
      const label = typeof title === 'string' || typeof title === 'number' ? String(title).toLowerCase() : null;
      const match = label !== null && label.includes(normalizedKeyword);
      const filteredChildren = children ? dfs(children, [...parents, key]) : [];

      // 命中关键字 or 子节点命中
      if (match || filteredChildren.length > 0) {
        if (match) parents.forEach((p) => parentKeys.add(p));
        result.push({...node, [childrenKey]: filteredChildren});
      }
    }
    return result;
  }
  const filteredTree = dfs(tree, []);
  return {tree: filteredTree, parentKeys};
}

/**
 * (1)只保留命中的节点路径
 * (2)如果命中的是叶子节点 → 返回该节点 + 所有父级
 * (3)如果一个节点自身未命中，子节点也未命中 → 整个节点被删除
 * (4)如果节点命中，但没有任何子节点命中 → 删除它的 children
 * @returns
 */

function filterTreeBySelected<T extends TreeNode>(
  tree: readonly T[],
  selectedIds: readonly any[] | Set<any>,
  config: TreeNodeConfig = {}
): T[] {
  const {uniqueKey, childrenKey} = {...defaultTreeNodeConfig, ...config};
  const selectedSet = selectedIds instanceof Set ? selectedIds : new Set(selectedIds);
  const result: T[] = [];
  for (let i = 0; i < tree.length; i++) {
    const node = dfs(tree[i]);
    if (node) result.push(node);
  }

  return result;

  function dfs(node: T): T | null {
    const nodeId = node[uniqueKey];
    const children = node[childrenKey] as T[] | undefined;

    let hasMatchedChild = false;
    let filteredChildren: T[] | undefined;

    if (children && children.length > 0) {
      for (let i = 0; i < children.length; i++) {
        const child = dfs(children[i]);
        if (child) {
          if (!filteredChildren) filteredChildren = [];
          filteredChildren.push(child);
          hasMatchedChild = true;
        }
      }
    }

    const isSelected = selectedSet.has(nodeId);

    if (!isSelected && !hasMatchedChild) {
      return null;
    }

    // 只在必要时 clone
    const nextNode = {...node};

    if (hasMatchedChild) {
      (nextNode as Record<string, any>)[childrenKey] = filteredChildren!;
    } else {
      // 命中自身但子节点无命中 → 删除 children
      if (childrenKey in nextNode) {
        delete nextNode[childrenKey];
      }
    }

    return nextNode;
  }
}

/**
 * 将满足规则的树扁平化
 * @param tree
 * @param predicate
 * @param config
 * @returns
 */
function collectTreeNodes<T extends TreeNode>(
  tree: readonly T[],
  predicate: TreePredicate<T>,
  config: TreeNodeConfig = {}
): TreeCollection<T> {
  const {childrenKey, uniqueKey} = {...defaultTreeNodeConfig, ...config};

  const nodes: T[] = [];
  const ids = new Set<any>();

  for (let i = 0; i < tree.length; i++) {
    dfs(tree[i], undefined);
  }

  return {nodes, ids};

  function dfs(node: T, parentNode?: T) {
    if (predicate(node, parentNode)) {
      nodes.push(node);
      ids.add(node[uniqueKey]);
    }

    const children = node[childrenKey] as T[] | undefined;
    if (!children || children.length === 0) return;

    for (let i = 0; i < children.length; i++) {
      dfs(children[i], node);
    }
  }
}

/**
 * 将 JSON 对象转换为树结构
 * @param obj 传入的 JSON 对象
 * @param options
 */
function jsonToTree(obj: Record<string, any>, config: TreeNodeConfig = {}): TreeNode[] {
  const {childrenKey, uniqueKey} = {...defaultTreeNodeConfig, ...config};

  const build = (node: any, level: number): any[] => {
    // 对象 => 有子节点
    if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
      return Object.entries(node).map(([key, value]) => ({
        [uniqueKey]: key,
        level,
        [childrenKey]: build(value, level + 1),
        // ...(() => {
        //   const children = build(value, level + 1);
        //   return children.length ? {[childrenField]: children} : {};
        // })()
      }));
    } else {
      // 叶子节点
      return [{[uniqueKey]: node, level, isLeaf: true}];
    }
  };

  return build(obj, 1);
}

// 找到树节点中的展开keys，不包含最后一层
function findExpandKeys(data: Record<string, any>[], config: TreeNodeConfig = {}) {
  const {uniqueKey, childrenKey} = {...defaultTreeNodeConfig, ...config};
  const keys: string[] = [];
  const deep = (data: Record<string, any>[]) => {
    data.forEach((v) => {
      if (v[childrenKey]?.length) {
        keys.push(v[uniqueKey]);
        deep(v[childrenKey]);
      }
    });
  };
  deep(data);
  return keys;
}

// 找到树节点的所有子节点
function findChildrenKeys(data: Record<string, any>[], config: TreeNodeConfig = {}) {
  const {uniqueKey, childrenKey} = {...defaultTreeNodeConfig, ...config};
  const keys: string[] = [];
  data.forEach((v) => {
    keys.push(v[uniqueKey]);
    if (v[childrenKey]?.length) {
      const childrenKeys = findChildrenKeys(v[childrenKey], config);
      keys.push(...childrenKeys);
    }
  });
  return keys;
}

// 生成通用树结构
function generateSameTree(
  depth: number,
  breadth: number,
  prefix = 'node' // 默认 id 前缀
): any[] {
  function build(level: number, path: string): any[] {
    if (level > depth) return [];

    return Array.from({length: breadth}, (_, i) => {
      const idPath = path ? `${path}-${i}` : `${i}`;
      const id = `${prefix}-${idPath}`;
      const name = `name-${idPath}`;
      const children = build(level + 1, idPath);
      return children.length > 0 ? {id, name, children} : {id, name};
    });
  }

  return build(1, '');
}
// 生成通用树结构
function generateDifferentTree(
  breadths: number[], // 每一层的数量，例如 [2, 3, 4] 表示第1层2个节点，第2层3个节点，第3层4个节点
  prefix = 'node'
): any[] {
  function build(level: number, path: string): any[] {
    if (level > breadths.length) return [];

    const breadth = breadths[level - 1]; // 当前层的节点数
    return Array.from({length: breadth}, (_, i) => {
      const idPath = path ? `${path}-${i}` : `${i}`;
      const id = `${prefix}-${idPath}`;
      const name = `name-${idPath}`;
      const children = build(level + 1, idPath);
      return children.length > 0 ? {id, name, children} : {id, name};
    });
  }

  return build(1, '');
}

function generateNestedData<T>(createItem: TreeItemFactory<T>, config: TreeNodeConfig = {}, ...lens: number[]): T[] {
  const {uniqueKey, keyPath, childrenKey} = {...defaultTreeNodeConfig, ...config};

  const makeDataLevel = (depth = 0, parentPath: string[] = [], parentId = ''): T[] => {
    const len = lens[depth];
    if (len === undefined) return [];

    return Array.from({length: len}).map((_, index): T => {
      const item = createItem(depth);
      // 加入完整父级 ID，避免不同分支生成相同的子节点 ID。
      const currentId = parentId ? `${parentId}-${index}` : `${depth}-${index}`;
      const currentIdPath = [...parentPath, currentId];
      const node = {
        ...item,
        [uniqueKey]: currentId,
        [keyPath]: currentIdPath,
      };
      const nextDepth = depth + 1;

      if (lens[nextDepth] !== undefined) {
        return {
          ...node,
          [childrenKey]: makeDataLevel(nextDepth, currentIdPath, currentId),
        };
      }

      return node;
    });
  };

  return makeDataLevel();
}

function buildFormField(id: string | number, treeData: TreeNode[]): string {
  // 递归查找路径
  const findPathToTarget = (nodes: TreeNode[], targetId: string | number, path: number[] = []): number[] | null => {
    for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i];
      path.push(i);
      if (currentNode.id === targetId) return [...path];
      if (currentNode.children) {
        const result = findPathToTarget(currentNode.children, targetId, path);
        if (result) return result;
      }
      path.pop();
    }
    return null;
  };

  const pathToTarget = findPathToTarget(treeData, id);
  if (!pathToTarget) return '';

  let str = '';
  pathToTarget.forEach((value, index) => {
    str = index === 0 ? `${value}` : `${str}.children.${value}`;
  });

  return `treeForm.${str}`;
}
/**
 * 查找目标节点在树中的路径
 * 返回数组形式路径，例如 [0, 'children', 1]
 * @param id 目标节点 id
 * @param treeData 树数据
 * @returns 数组形式路径，未找到返回 null
 */
function findNodePath(id: string | number, treeData: TreeNode[]): TreeNodePath | null {
  const helper = (nodes: TreeNode[], targetId: string | number, path: TreeNodePath = []): TreeNodePath | null => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const currentPath = [...path, i];

      if (node.id === targetId) return currentPath;

      if (node.children) {
        const childPath = helper(node.children, targetId, [...currentPath, 'children']);
        if (childPath) return childPath;
      }
    }
    return null;
  };
  return helper(treeData, id);
}

/** 树搜索、筛选、生成与路径查找。 */
export const tree = {
  defaultConfig: defaultTreeNodeConfig,
  searchTree,
  filterTreeBySelected,
  collectTreeNodes,
  jsonToTree,
  findExpandKeys,
  findChildrenKeys,
  generateSameTree,
  generateDifferentTree,
  generateNestedData,
  buildFormField,
  findNodePath,
};
