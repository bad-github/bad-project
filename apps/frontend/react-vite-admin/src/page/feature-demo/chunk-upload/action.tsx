import {ETaskStatus, EChunkStatus, type TMergeStatus, type TTaskStatus, type TChunkStatus} from './types';
import type {TActionStore} from './use-action-store';
import {
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@badnpm/ui';

export default function Action({store}: {store: TActionStore}) {
  const {
    size,
    taskStatus,
    setTaskStatus,
    needChunk,
    setNeedChunk,
    chunkStatus,
    setChunkStatus,
    chunkSize,
    setChunkSize,
    chunk,
    failedChunkIndex,
    setFailedChunkIndex,
    mergeStatus,
    setMergeStatus,
  } = store;

  return (
    <div className="w-100 border p-2 text-xs">
      <div className="flex flex-col gap-2 leading-[1.5]">
        <div className="border p-2">
          <h2>分片上传流程</h2>
          <ul>
            <li>1.利用web worker计算每个文件的hash</li>
            <li>2.针对每个文件创建上传任务，需要调用api</li>
            <li>3.步骤二成功后，对每个文件进行切片</li>
            <li>4.上传每个文件的切片，需要调用api</li>
            <li>5.所有分片都成功后，发起合并分片的请求，需要调用api</li>
          </ul>
        </div>

        <div className="flex w-full flex-col gap-2 border p-2">
          <div className="shrink-0">创建任务是否成功</div>
          <RadioGroup className="flex" value={taskStatus} onValueChange={(value: TTaskStatus) => setTaskStatus(value)}>
            <div className="flex gap-1">
              <RadioGroupItem value="success"></RadioGroupItem>
              <Label>是</Label>
            </div>
            <div className="flex gap-1">
              <RadioGroupItem value="failed"></RadioGroupItem>
              <Label>否</Label>
            </div>
          </RadioGroup>
        </div>

        {taskStatus === ETaskStatus.Success && (
          <>
            <div className="flex w-full flex-col gap-6 border p-2">
              <div className="flex flex-col gap-2">
                <div className="shrink-0">是否需要分片</div>
                <RadioGroup
                  className="flex"
                  value={needChunk.toString()}
                  onValueChange={(value: string) => setNeedChunk(value === 'true')}
                >
                  <div className="flex gap-1">
                    <RadioGroupItem value="true"></RadioGroupItem>
                    <Label>是</Label>
                  </div>
                  <div className="flex gap-1">
                    <RadioGroupItem value="false"></RadioGroupItem>
                    <Label>否</Label>
                  </div>
                </RadioGroup>
              </div>
              {needChunk && (
                <>
                  <div className="flex flex-col gap-2">
                    <div>切片大小 (单位M)</div>
                    <Select
                      items={size.map((value) => ({value: value.toString(), label: value}))}
                      value={chunkSize.toString()}
                      onValueChange={(value) => {
                        if (value !== null) setChunkSize(Number(value));
                      }}
                    >
                      <SelectTrigger size="sm" className="w-full">
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent>
                        {size.map((v) => (
                          <SelectItem key={v} value={v.toString()}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="shrink-0">切片上传是否成功</div>
                    <RadioGroup
                      className="flex"
                      value={chunkStatus}
                      onValueChange={(value: TChunkStatus) => setChunkStatus(value)}
                    >
                      <div className="flex gap-1">
                        <RadioGroupItem value="success"></RadioGroupItem>
                        <Label>是</Label>
                      </div>
                      <div className="flex gap-1">
                        <RadioGroupItem value="failed"></RadioGroupItem>
                        <Label>否</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <>
                    {chunkStatus === 'failed' && (
                      <div className="flex flex-col gap-2">
                        <div>若分片失败，默认第几个分片失败 (最大不超过分片数)</div>
                        <Select
                          items={chunk.map((value) => ({value: value.toString(), label: value}))}
                          value={failedChunkIndex.toString()}
                          onValueChange={(value) => {
                            if (value !== null) setFailedChunkIndex(Number(value));
                          }}
                        >
                          <SelectTrigger size="sm" className="w-full">
                            <SelectValue placeholder="请选择" />
                          </SelectTrigger>
                          <SelectContent>
                            {chunk.map((v) => (
                              <SelectItem key={v} value={v.toString()}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                </>
              )}
            </div>
            {needChunk && chunkStatus === EChunkStatus.Success && (
              <div className="flex w-full flex-col gap-2 border p-2">
                <div className="shrink-0">合并分片是否成功</div>
                <RadioGroup
                  className="flex"
                  value={mergeStatus}
                  onValueChange={(value: TMergeStatus) => setMergeStatus(value)}
                >
                  <div className="flex gap-1">
                    <RadioGroupItem value="success"></RadioGroupItem>
                    <Label>是</Label>
                  </div>
                  <div className="flex gap-1">
                    <RadioGroupItem value="failed"></RadioGroupItem>
                    <Label>否</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
