import {Button, Badge, Progress, cn, BadTooltip} from '@badnpm/ui';
import {TrashIcon} from 'lucide-react';
import type {TRenderProps, TTaskResult} from '../types';
import {useTranslation} from 'react-i18next';
import {file} from '@workspace/utils';

type NoChunkFileProps = {
  fileKey: string;
  task: TTaskResult;
  handleDelNoChunkFile: (fileKey: string) => void;
} & TRenderProps;

export default function NoChunkFile(props: NoChunkFileProps) {
  const {t} = useTranslation();
  const {fileKey, task, handleDelNoChunkFile, renderProgress} = props;

  const showSizeProgress = (size?: number) => {
    if (!size && size !== 0) return '-';
    const total = file.formatByteSize(size);
    return `${total} / ${total}`;
  };

  return (
    <div className="bg-card relative flex h-20 min-w-xs flex-col justify-between rounded-md border p-2 text-sm">
      <div className="flex items-center justify-between">
        <span title={fileKey} className="flex items-center truncate">
          <Badge>no chunk</Badge>&nbsp;{fileKey}
        </span>
        <BadTooltip
          content={{children: t('feature.delete')}}
          trigger={{
            render: (
              <Button
                size="icon"
                variant="ghost"
                className="size-6 rounded-md"
                onClick={() => handleDelNoChunkFile(fileKey)}
              >
                <TrashIcon />
              </Button>
            ),
          }}
        />
      </div>
      <div className="flex justify-between pr-1 pb-1 text-xs">
        <span>{showSizeProgress(task.fileSize)}</span>
        <span className="text-green-400">{t('feature.uploadSuccess')}</span>
      </div>
      {renderProgress ? (
        renderProgress(task)
      ) : (
        <Progress
          className={cn('absolute bottom-0 left-0 h-1 w-full', "[&_[data-slot='progress-indicator']]:bg-green-400")}
          value={100}
        />
      )}
    </div>
  );
}
