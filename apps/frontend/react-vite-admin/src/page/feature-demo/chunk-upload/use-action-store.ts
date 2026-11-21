import {useState} from 'react';
import {
  CHUNK_SIZE,
  ETaskStatus,
  EChunkStatus,
  EMergeStatus,
  type TTaskStatus,
  type TChunkStatus,
  type TMergeStatus,
} from './types';

export type TActionStore = ReturnType<typeof useActionStore>;

export default function useActionStore() {
  const size = [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
  const chunk = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9999];
  const [chunkSize, setChunkSize] = useState(CHUNK_SIZE);
  const [taskStatus, setTaskStatus] = useState<TTaskStatus>(ETaskStatus.Success);
  const [needChunk, setNeedChunk] = useState(true);
  const [failedChunkIndex, setFailedChunkIndex] = useState(chunk[1]);
  const [chunkStatus, setChunkStatus] = useState<TChunkStatus>(EChunkStatus.Success);
  const [mergeStatus, setMergeStatus] = useState<TMergeStatus>(EMergeStatus.Success);

  return {
    size,
    chunkSize,
    setChunkSize,
    chunk,
    failedChunkIndex,
    setFailedChunkIndex,
    taskStatus,
    setTaskStatus,
    needChunk,
    setNeedChunk,
    chunkStatus,
    setChunkStatus,
    mergeStatus,
    setMergeStatus,
  };
}
