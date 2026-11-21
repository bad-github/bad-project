export type ReactTreeLocale = {
  expand: string;
  collapse: string;
  supportsAsync: string;
  createNode: string;
  editNode: string;
  deleteNode: string;
  cannotCreateEmptyNode: string;
  cannotSaveEmptyNode: string;
};

export const defaultTreeLocale: ReactTreeLocale = {
  expand: '展开',
  collapse: '收起',
  supportsAsync: '支持异步',
  createNode: '创建节点',
  editNode: '编辑节点',
  deleteNode: '删除节点',
  cannotCreateEmptyNode: '不能创建空节点',
  cannotSaveEmptyNode: '节点名称不能为空',
};
