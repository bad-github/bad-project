// 浏览器
/** 浏览器 DOM 属性过滤选项。 */
export type SafePropsOptions = {excludeKeys: string[]};

// 颜色
export type ColorFormat = 'hex' | 'rgb';

// 文件
export type UploadProgressOptions = {
  /** 模拟的总字节数，例如 file.size 或 chunk.size。 */
  total: number;
  /** 模拟剩余上传所需时间，单位毫秒。默认 2000，0 表示立即完成。 */
  duration?: number;
  /** 进度回调间隔，单位毫秒，默认 100。 */
  interval?: number;
  /** 已上传字节数，默认 0；可用于演示从指定进度继续上传。 */
  initialLoaded?: number;
  /** 调用对应 controller.abort() 可停止进度，并使 Promise 以 AbortError 拒绝。 */
  signal?: AbortSignal;
  /** 接收 ProgressEvent，可通过 loaded / total 计算进度；空文件需单独处理 total === 0。 */
  onProgress?: (event: ProgressEvent) => void;
};

// 快捷键
export type ShortcutPlatform = 'mac' | 'windows';

export type ShortcutKey = {
  // [快捷文本，绑定热键]
  mac: [string, string];
  windows: [string, string];
};

export type ShortcutAction = 'signOut' | 'save' | 'globalSearch';

// 时间
export type TimeUnit = 'ms' | 's' | 'm' | 'h' | 'd';

export type DateInput = Date | number | string;

export type NanosecondInput = string | number | bigint;

export type NanosecondFormatOptions = {
  /** 小数位数，范围 0–100；超过纳秒精度的部分补零。 */
  fractionDigits?: number;
  unit?: 's' | 'min' | 'h' | 'd';
};

/** 相对日期结果；通过 unit 可以收窄对应的 value 类型。 */
export type RelativeDate =
  {unit: 'minutes' | 'hours' | 'days'; value: number} | {unit: 'date'; value: Date} | {unit: 'invalid'; value: ''};

// 树结构
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

export type TreeSearch = {
  tree: TreeNode[]; // 过滤后的树
  parentKeys: Set<string>; // 搜索到树节点的所有祖先key集合
};

export type TreePredicate<T extends TreeNode> = (node: T, parentNode?: T) => boolean;

export type TreeCollection<T extends TreeNode> = {nodes: T[]; ids: Set<any>};

export type TreeItemFactory<T> = (depth: number) => T;

export type TreeNodePath = (number | 'children')[];
