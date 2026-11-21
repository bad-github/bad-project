import {i18n} from '@/i18n';

// export const CHUNK_SIZE = 1 * 1024 ** 2; // 每个分片大小1M
export const CHUNK_SIZE = 2; // 单位M
export const MAX_FILE_SIZE = 1024 ** 3; // 最大文件大小1G
export const CONCURRENCY_NUM = 1; // 并行数量
export const MAX_FILE_NUM = 3; // 上传文件时：同时仅支持3个文件。todo，为什么文件夹上传都能支持100个
export const MAX_FOLDER_FILE_NUM = 5; // 上传文件夹时：最大支持100个子文件

export const ETaskStatus = {
  None: 'none',
  CalcHashDoing: 'calcHashDoing',
  CalcHashDone: 'calcHashDone',
  Creating: 'creating',
  Success: 'success',
  Failed: 'failed',
} as const;
export type TTaskStatus = (typeof ETaskStatus)[keyof typeof ETaskStatus];

export const EChunkStatus = {
  NotUpload: 'notUpload',
  Uploading: 'uploading',
  Success: 'success',
  Failed: 'failed',
  Paused: 'paused',
} as const;
export type TChunkStatus = (typeof EChunkStatus)[keyof typeof EChunkStatus];

export const ChunkStatusMap: Record<TChunkStatus, string> = {
  [EChunkStatus.NotUpload]: i18n.t('feature.notUpload'),
  [EChunkStatus.Uploading]: i18n.t('feature.uploading'),
  [EChunkStatus.Success]: i18n.t('feature.uploadSuccess'),
  [EChunkStatus.Failed]: i18n.t('feature.uploadFailed'),
  [EChunkStatus.Paused]: i18n.t('feature.uploadPaused'),
};

export const EMergeStatus = {
  NotMerge: 'notMerge',
  Merging: 'merging',
  Success: 'success',
  Failed: 'failed',
} as const;

export type TMergeStatus = (typeof EMergeStatus)[keyof typeof EMergeStatus];

export const MergeStatusMap: Record<TMergeStatus, string> = {
  [EMergeStatus.NotMerge]: '',
  [EMergeStatus.Merging]: i18n.t('feature.merging'),
  [EMergeStatus.Success]: '',
  [EMergeStatus.Failed]: i18n.t('feature.mergeFailed'),
};

export type TAsync<T> = Promise<T | undefined>;
export type TAsyncFunction<T> = () => TAsync<T>;
export type TAsyncFunctionMap<T> = Record<string, Array<TAsyncFunction<T>>>;

export type TChunkAction = {
  onDelete: (fileKey: string) => void;
  onPause: (fileKey: string) => void;
  onResume: (fileKey: string, fileHash: string) => void;
  onReUpload: (fileKey: string, fileHash: string) => void;
  onMergeResume: (fileKey: string, fileHash: string) => void;
};

export type TTaskAction = {
  onDelete: (fileKey: string) => void;
};

export type TFile = {
  fileKey: string; // 所属文件唯一标识：文件名(文件上传)或文件路径+文件名(文件夹上传)
  filePath: string; // 所属文件路径：空字符串(文件上传)或文件路径+文件名(文件夹上传)
  fileSize: number;
  fileName: string;
  fileHash: string;
  fileUrl?: string; // 后端返回的文件地址，不分片时创建任务接口返回，分片时合并任务返回
};

// 每个文件上传是一个上传任务
export type TTaskResult = {
  // code: string;
  taskStatus?: TTaskStatus; // 上传任务的状态
  // hashPercent: number; // 文件hash计算的进度
  needChunk?: boolean; // 是否需要分片
  mergeStatus?: TMergeStatus; // 合并状态
  totalChunkStatus?: TChunkStatus; // 所有分片状态合并后的一个总状态
  totalChunkPercent?: number; // 所有分片状态合并后的一个总进度
} & TFile;

export type TChunkResult = {
  chunkStatus: TChunkStatus; // 每个分片的上传状态
  chunkPercent: number; // 每个分片的上传进度
  pausePercent?: number; // 每个分片暂停的进度
} & TFile;

// 每个文件的每一个切片
export interface TChunk {
  chunkFile: Blob;
  fileHash: string;
  chunkSize: number;
  fileSize: number;
  fileName: string;
  fileKey: string;
  filePath: string;
}

export type TChunkUploadProps = {
  className?: string;
  style?: React.CSSProperties;
  tip?: string;
  showUpload?: boolean; // 是否展示上传控件，因为通过ref暴露了api给外部，所以可以不用展示ui仅用api上传
  onlyShowFile?: boolean; // 只展示上传文件
  disabled?: boolean;
  uploadText?: string;
  multiple?: boolean; // 上传文件时，是否允许多选
  accept?: string; // 上传文件时：可允许上传的文件类型
  chunkSize?: number; // 切片大小
  maxSize?: number; // 单文件最大尺寸
  maxFileNum?: number; // 上传文件和上传文件夹时：限制的数量
  /** 单文件切片请求的并发数，浏览器有并发限制：一般为6个。大于6的请求浏览器不会执行uploadProgress */
  concurrency?: number;
  value?: TTaskResult[];

  onDelete?: (fileKey: string) => void;
  onChange?: (value: TTaskResult[]) => void;
  onBeforeStartUpload?: () => void;
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
  /** 上传进度自定义挂载节点 */
  portalContainer?: HTMLElement;
} & TRenderProps;

export type TRenderProps = {
  /** 自定义进度条 */
  renderProgress?: (uploadInfo: TFile) => React.ReactNode;
  renderChunks?: (chunks: TChunkResult[], actions: TChunkAction) => React.ReactNode;
  renderTask?: (task: TTaskResult, actions: TTaskAction) => React.ReactNode;
};

export type TChunkUploadHandle = {
  startUpload: (files: File[]) => void;
  resetUpload: () => void;
};
