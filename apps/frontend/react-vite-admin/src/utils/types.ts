export type TreeNode = {
  id?: string;
  children?: TreeNode[];
  [key: string]: any;
};

export type TreeNodeConfig = {
  uniqueKey?: string;
  labelKey?: string;
  keyPath?: string;
  childrenKey?: string;
};

export const defaultTreeNodeConfig = {uniqueKey: 'id', labelKey: 'label', childrenKey: 'children', keyPath: 'idPath'};

export type TreeSearch = {
  tree: TreeNode[]; // 过滤后的树
  parentKeys: Set<string>; // 搜索到树节点的所有祖先key集合
};

export type TimeUnit = 'ms' | 's' | 'm' | 'h' | 'd';
