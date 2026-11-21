import {ETaskStatus, EChunkStatus, EMergeStatus} from './types';
import {file, time} from '@workspace/utils';
import {getMock} from '@/mock';
import {Fail, Success} from '@/request/common';

/**
 *
 * @param data {taskStatus:api成功与否; needChunk:是否需要分片}
 * @returns
 */
export async function createUploadTaskApi(data: Record<string, any>) {
  await time.sleep(undefined, 2000);
  const {taskStatus, needChunk} = data;
  return taskStatus === ETaskStatus.Success
    ? Success({
        // 使用图片地址模拟文件url，需要分片时就不返回url
        fileUrl: needChunk ? '' : (await getMock()).faker.image.url(),
      })
    : (Fail('create upload task failed') as any);
}

export async function uploadChunkApi(
  formData: FormData,
  abortController: AbortController,
  onUploadProgress?: (progressEvent: ProgressEvent) => void
) {
  const chunk = formData.get('file');
  if (!(chunk instanceof Blob)) throw new TypeError('Missing upload chunk');

  await file.uploadProgress({
    total: chunk.size,
    duration: 2000,
    interval: 100,
    signal: abortController.signal,
    onProgress: onUploadProgress,
  });

  // 上传进度与业务结果分开模拟，不修改传入的 FormData，便于重试。
  const chunkStatus = formData.get('chunkStatus');
  const chunkIndex = Number(formData.get('chunkIndex'));
  const failedChunkIndex = Number(formData.get('failedChunkIndex'));
  if (chunkStatus === EChunkStatus.Failed && chunkIndex === failedChunkIndex - 1) {
    return Fail('upload chunk failed');
  }

  return Success({
    fileKey: String(formData.get('fileKey') ?? ''),
    fileHash: String(formData.get('fileHash') ?? ''),
    filePath: String(formData.get('filePath') ?? ''),
    chunkIndex,
    chunkSize: chunk.size,
  });
}

export async function mergeChunkApi(data: Record<string, any>) {
  await time.sleep(undefined, 2000);
  return data.mergeStatus === EMergeStatus.Success
    ? Success({fileUrl: (await getMock()).faker.image.url()})
    : Fail('merge chunk failed');
}
