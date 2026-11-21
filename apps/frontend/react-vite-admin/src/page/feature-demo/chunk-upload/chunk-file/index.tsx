import {Button, Progress, cn, BadTooltip} from '@badnpm/ui';
import {useMemo} from 'react';
import {
  EMergeStatus,
  EChunkStatus,
  MergeStatusMap,
  ChunkStatusMap,
  type TChunkResult,
  type TTaskResult,
  type TFile,
  type TRenderProps,
  type TChunkStatus,
} from '../types';
import {CirclePauseIcon, CirclePlayIcon, RotateCwIcon, TrashIcon} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {file} from '@workspace/utils';

type ChunkFileProps = {
  fileKey: string;
  chunks: TChunkResult[];
  task: TTaskResult;
  handleDelChunkFile: (fileKey: string) => void;
  handleUploadPause: (fileKey: string) => void;
  handleUploadResume: (fileKey: string, fileHash: string) => void;
  handleReUpload: (fileKey: string, fileHash: string) => void;
  handleMergeResume: (fileKey: string, fileHash: string) => void;
} & TRenderProps;

export default function ChunkFile(props: ChunkFileProps) {
  const {t} = useTranslation();
  const {
    fileKey,
    chunks,
    task,
    renderProgress,
    renderChunks,
    handleDelChunkFile,
    handleUploadPause,
    handleUploadResume,
    handleReUpload,
    handleMergeResume,
  } = props;

  /**
   *
   * @param results
   * @returns
   * 进度条回退的两种场景
   * (1)某个分片失败
   * (2)暂停上传：已优化为不回退
   *    (2.1)当真实的进度小于暂停时进度时，以暂停进度为准
   *    (2.2)当真实的进度大于暂停时进度时，以真实进度为准
   */
  const calcProgress = (results: TChunkResult[]) => {
    let pauseLoaded = 0;
    let realLoaded = 0;
    if (!results || !results.length) return {real: 0, pause: 0, resumePercent: '0%'};
    results.forEach((v) => {
      realLoaded += v.chunkPercent;
      if (v.pausePercent && v.pausePercent >= v.chunkPercent) {
        pauseLoaded += v.pausePercent;
      } else {
        pauseLoaded += v.chunkPercent;
      }
    });
    return {
      real: Math.round((realLoaded / results.length) * 100) / 100,
      pause: Math.round((pauseLoaded / results.length) * 100) / 100,
      resumePercent: Math.round((realLoaded / pauseLoaded) * 100) + '%',
    };
  };

  const calcStatus = (results: TChunkResult[]): TChunkStatus => {
    if (!results || !results.length) return EChunkStatus.NotUpload;
    const statusSet = new Set(results.map((v) => v.chunkStatus));
    // 尽量不要暴露失败状态给用户
    // 按优先级依次判断：Uploading > Paused > NotUpload > Failed > Success
    // 尽管有失败的分片，但此时仍有其他分片在上传中，所以整体状态还是上传中，直到所有未上传的分片上传完成
    if (statusSet.has(EChunkStatus.Uploading)) {
      return EChunkStatus.Uploading;
    }
    if (statusSet.has(EChunkStatus.Paused)) {
      return EChunkStatus.Paused;
    }
    if (statusSet.has(EChunkStatus.NotUpload)) {
      // 未上传时需要展示上传中
      return EChunkStatus.Uploading;
    }
    if (statusSet.has(EChunkStatus.Failed)) {
      return EChunkStatus.Failed;
    }
    return EChunkStatus.Success;
  };

  const totalPercent = calcProgress(chunks);
  const totalStatus = calcStatus(chunks);

  // 根据单个文件的所有分片计算某个文件的所有信息
  const fileResult: TFile = useMemo(() => {
    if (!chunks || !chunks.length) return {} as any;
    const result = {
      fileName: chunks[0].fileName,
      fileKey: chunks[0].fileKey,
      fileSize: chunks[0].fileSize,
      fileHash: chunks[0].fileHash,
      filePath: chunks[0].filePath,
      totalPercent,
      totalStatus,
    };
    return result;
  }, [chunks, totalPercent, totalStatus]);

  const showSizeProgress = (percent: number, size: number) => {
    if (!size) return null;
    const total = file.formatByteSize(size);
    const current = file.formatByteSize(size * (percent / 100));
    return `${current} / ${total}`;
  };

  const renderAction = (fileKey: string, results: TChunkResult[]) => {
    let uploadStatus: TChunkStatus = EChunkStatus.Success;
    const statusSet = new Set(results.map((v) => v.chunkStatus));
    if (statusSet.has(EChunkStatus.Paused)) {
      uploadStatus = EChunkStatus.Paused;
    } else if (statusSet.has(EChunkStatus.Uploading)) {
      uploadStatus = EChunkStatus.Uploading;
    } else if (statusSet.has(EChunkStatus.NotUpload)) {
      // 未上传时需要展示上传中
      uploadStatus = EChunkStatus.Uploading;
    } else if (statusSet.has(EChunkStatus.Failed)) {
      uploadStatus = EChunkStatus.Failed;
    }
    const Del = (
      <BadTooltip
        content={{children: t('feature.delete')}}
        trigger={{
          render: (
            <Button
              size="icon"
              variant="ghost"
              className="size-6 rounded-md"
              onClick={() => handleDelChunkFile(fileKey)}
            >
              <TrashIcon />
            </Button>
          ),
        }}
      />
    );
    const Pause = (
      <BadTooltip
        content={{children: t('feature.pause')}}
        trigger={{
          render: (
            <Button
              size="icon"
              variant="ghost"
              className="size-6 rounded-md"
              onClick={() => handleUploadPause(fileKey)}
            >
              <CirclePauseIcon />
            </Button>
          ),
        }}
      />
    );

    const Resume = (
      <BadTooltip
        content={{children: t('feature.resume')}}
        trigger={{
          render: (
            <Button
              size="icon"
              variant="ghost"
              className="size-6 rounded-md"
              onClick={() => handleUploadResume(fileKey, results[0].fileHash)}
            >
              <CirclePlayIcon />
            </Button>
          ),
        }}
      />
    );

    const Refresh = (
      <BadTooltip
        content={{children: t('feature.reupload')}}
        trigger={{
          render: (
            <Button
              size="icon"
              variant="ghost"
              className="size-6 rounded-md"
              onClick={() => handleReUpload(fileKey, results[0].fileHash)}
            >
              <RotateCwIcon />
            </Button>
          ),
        }}
      />
    );
    switch (uploadStatus) {
      case EChunkStatus.Paused:
        return (
          <>
            {Resume}
            {Del}
          </>
        );
      case EChunkStatus.Failed:
        return (
          <>
            {Refresh}
            {Del}
          </>
        );
      case EChunkStatus.Success:
        return <>{Del}</>;
      default:
        return (
          <>
            {Pause}
            {Del}
          </>
        );
    }
  };
  if (!chunks?.length) return null;
  if (renderChunks) {
    return renderChunks(chunks, {
      onDelete: handleDelChunkFile,
      onPause: handleUploadPause,
      onResume: handleUploadResume,
      onReUpload: handleReUpload,
      onMergeResume: handleMergeResume,
    });
  }
  return (
    <div
      className={cn(
        'bg-card relative flex h-20 min-w-xs flex-col justify-between rounded-md border p-2 text-sm',
        task.mergeStatus === EMergeStatus.Failed && 'border-red-400 text-red-400'
      )}
    >
      <div className="flex items-center justify-between">
        <span title={fileKey} className="truncate">
          {fileKey}
        </span>
        <span>
          {renderAction(fileKey, chunks)}
          {EMergeStatus.Failed === task.mergeStatus && (
            <BadTooltip
              content={{children: t('feature.reMerge')}}
              trigger={{
                render: (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 rounded-md"
                    onClick={() => handleMergeResume(fileKey, chunks[0].fileHash)}
                  >
                    <RotateCwIcon />
                  </Button>
                ),
              }}
            />
          )}
        </span>
      </div>
      <div className="flex justify-between pr-1 pb-1 text-xs">
        <span>{showSizeProgress(totalPercent.pause, fileResult.fileSize)}</span>
        <div className="flex items-center gap-2 font-[500]">
          {task.mergeStatus && MergeStatusMap[task.mergeStatus] && (
            <span
              className={cn({
                'text-red-400': task.mergeStatus === EMergeStatus.Failed,
                'text-green-400': task.mergeStatus === EMergeStatus.Success,
              })}
            >
              {MergeStatusMap[task.mergeStatus]}
            </span>
          )}
          {totalStatus === EChunkStatus.Uploading && totalPercent.real < totalPercent.pause ? (
            <span>{t('feature.resuming')}</span>
          ) : (
            <span
              className={cn({
                'text-red-400': totalStatus === EChunkStatus.Failed,
                'text-green-400': totalStatus === EChunkStatus.Success,
              })}
            >
              {ChunkStatusMap[totalStatus]}
            </span>
          )}
        </div>
      </div>
      {renderProgress ? (
        renderProgress(fileResult)
      ) : (
        <>
          {totalPercent.real < totalPercent.pause && (
            <Progress
              className={cn('absolute bottom-0 left-0 z-10 h-1 w-full [&_[data-slot=progress-track]]:bg-transparent', {
                '[&_[data-slot="progress-indicator"]]:bg-primary': true,
              })}
              value={totalPercent.real}
            />
          )}
          <Progress
            className={cn('absolute bottom-0 left-0 h-1 w-full [&_[data-slot=progress-track]]:bg-transparent', {
              '[&_[data-slot="progress-indicator"]]:bg-green-400': totalStatus === EChunkStatus.Success,
              '[&_[data-slot="progress-indicator"]]:bg-red-400': totalStatus === EChunkStatus.Failed,
              '[&_[data-slot="progress-indicator"]]:bg-primary': [
                EChunkStatus.NotUpload,
                EChunkStatus.Paused,
                EChunkStatus.Uploading,
              ].includes(totalStatus as any),
              '[&_[data-slot="progress-indicator"]]:opacity-50': totalPercent.real < totalPercent.pause,
            })}
            value={totalPercent.pause}
          />
        </>
      )}
    </div>
  );
}
