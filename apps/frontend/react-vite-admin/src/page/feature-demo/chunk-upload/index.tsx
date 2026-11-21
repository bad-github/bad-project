import {LoadingOverlay} from '@badnpm/ui';
import {Button, toast, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@badnpm/ui';
import {UploadIcon} from 'lucide-react';
import {
  CONCURRENCY_NUM,
  EMergeStatus,
  ETaskStatus,
  EChunkStatus,
  MAX_FILE_NUM,
  MAX_FILE_SIZE,
  MAX_FOLDER_FILE_NUM,
  type TAsyncFunction,
  type TAsyncFunctionMap,
  type TChunk,
  type TChunkResult,
  type TChunkUploadHandle,
  type TChunkUploadProps,
  type TTaskResult,
} from './types';
import {forwardRef, Fragment, memo, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react';
import {
  buildChangeData,
  buildChunks,
  buildFileFields,
  buildFileKey,
  buildResponse,
  calcFileHash,
  executeChunkPromise,
  parallelTask,
  sanitizeFolderFiles,
} from './tool';

import {createPortal} from 'react-dom';
import {createUploadTaskApi, mergeChunkApi, uploadChunkApi} from './api';
import NoChunkFile from './no-chunk-file';
import ChunkFile from './chunk-file';
import Action from './action';
import useActionStore from './use-action-store';
import {useDeepCompareEffect} from 'react-use';
import {useTranslation} from 'react-i18next';
import {file} from '@workspace/utils';

const ChunkUpload = (props: TChunkUploadProps, ref: React.Ref<TChunkUploadHandle>) => {
  const actionStore = useActionStore();
  const {t} = useTranslation();
  const {
    tip = t('feature.pleaseSelectFile'),
    chunkSize = actionStore.chunkSize * 1024 ** 2,
    onlyShowFile,
    uploadText = t('feature.uploadFile'),
    maxSize = MAX_FILE_SIZE,
    maxFileNum = MAX_FILE_NUM,
    concurrency = CONCURRENCY_NUM,
    multiple = true,
    portalContainer,
    disabled,
    accept,
    value,
    onBeforeStartUpload,
    onDelete,
    onChange,
    renderProgress,
  } = props;
  const [taskMap, setTaskMap] = useState<Record<string, TTaskResult>>({});
  const [chunkMap, setChunkMap] = useState<Record<string, TChunkResult[]>>({});
  // 原本文件的分片信息可以放chunkMap里，但以免页面render受影响，分离文件chunk与文件状态信息，
  const fileChunkMap = useRef<Record<string, TChunk[]>>({});
  // 每个文件所有分片的上传任务
  const promiseMap = useRef<TAsyncFunctionMap<TChunkResult>>({});
  // 每个文件所有分片的中断任务
  const abortMap = useRef<Record<string, AbortController[]>>({});
  // 合并接口很重要，添加重试机制
  const mergeRetryCount = useRef<Record<string, number>>({});

  const fileRef = useRef<HTMLInputElement | null>(null);
  const folderRef = useRef<HTMLInputElement | null>(null);
  const firstRender = useRef(true);

  const uploadIsDisabled = useMemo(() => {
    if (multiple) return false;
    const task = taskMap[Object.keys(taskMap)[0]];
    if (!task) return false;
    return (
      task.taskStatus &&
      [ETaskStatus.CalcHashDoing, ETaskStatus.CalcHashDone, ETaskStatus.Creating].includes(task.taskStatus as any)
    );
  }, [multiple, taskMap]);

  const resetValue = () => {
    onChange?.([]);
    firstRender.current = true;
  };

  const resetState = () => {
    if (Object.keys(taskMap).length > 0) {
      setTaskMap({});
    }
    if (Object.keys(chunkMap).length > 0) {
      setChunkMap({});
    }
    fileChunkMap.current = {};
    promiseMap.current = {};
    mergeRetryCount.current = {};
    Object.keys(abortMap.current).forEach((v) => {
      abortMap.current[v].forEach((v) => v.abort());
    });
    abortMap.current = {};
  };

  useEffect(() => {
    return () => {
      resetState();
      resetValue();
    };
  }, []);

  useDeepCompareEffect(() => {
    if (!value || !value.length || !(value instanceof Array)) {
      resetState();
      return;
    }
    const taskObj: Record<string, TTaskResult> = {};
    value.forEach((v) => {
      // 没有状态表示是默认存在的文件，需要初始化为None
      taskObj[v.fileKey] = {...v, taskStatus: v.taskStatus || ETaskStatus.None};
    });
    setTaskMap((pre) => ({...pre, ...taskObj}));
  }, [value]);

  // 触发onChange
  useDeepCompareEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const data = buildChangeData(taskMap, chunkMap);
    onChange?.(data);
  }, [chunkMap, taskMap]);

  /**
   * 合并单个文件的chunk
   */
  const mergeChunk = async (fileKey: string, chunks: TChunkResult[]) => {
    const handleSuccess = (key: string, res: Record<string, any>) => {
      setTaskMap((pre) => {
        const newTask = {...pre[key], mergeStatus: EMergeStatus.Success, fileUrl: res.fileUrl};
        return {...pre, [key]: newTask};
      });
    };
    const handleFailed = (key: string, chunks: TChunkResult[]) => {
      if (!mergeRetryCount.current[key]) {
        mergeRetryCount.current[key] = 0;
      }
      mergeRetryCount.current[key]++;
      if (mergeRetryCount.current[key] < 3) {
        setTimeout(() => {
          mergeChunk(key, chunks);
        });
      } else {
        setTaskMap((pre) => {
          const newTask = {...pre[key], mergeStatus: EMergeStatus.Failed};
          return {...pre, [key]: newTask};
        });
      }
    };
    if (!chunks || !chunks.length) return;
    if (chunks.every((v) => v?.chunkStatus === EChunkStatus.Success)) {
      try {
        setTaskMap((prev) => ({
          ...prev,
          [fileKey]: {...prev[fileKey], mergeStatus: EMergeStatus.Merging},
        }));
        const res: any = await mergeChunkApi({
          fileHash: chunks[0].fileHash,
          filePath: chunks[0].filePath,
          mergeStatus: actionStore.mergeStatus,
        });
        if (res.code === 200) {
          handleSuccess(fileKey, res.data);
        } else {
          handleFailed(fileKey, chunks);
        }
      } catch (_err) {
        handleFailed(fileKey, chunks);
      }
    }
  };

  /**
   * 场景：文件正在分片上传时，点击删除按钮会出现chunkMap={fileKey: [undefined,undefined,{}]}，前两个undefined表示中断的分片
   */
  const updateChunkMap = (fileKey: string, index: number, statusObj: Record<string, any>, needMerge = true) => {
    setChunkMap((pre) => {
      const results = pre[fileKey];
      // 删除时改变了chunkMap，同时由于删除执行了abort也同步改变了chunkMap，所以需要判断
      if (!results?.length || !results[index]) return pre;
      const updatedResults = [...results];
      updatedResults[index] = {...updatedResults[index], ...statusObj};
      if (needMerge) {
        // 每个分片上传后都会触发merge判断
        mergeChunk(fileKey, updatedResults);
      }
      return {...pre, [fileKey]: updatedResults};
    });
  };

  const handleUploadChunkProgress = (progressEvent: any, fileKey: string, index: number) => {
    let chunkPercent = Math.floor((progressEvent.loaded / progressEvent.total) * 100);
    // 若前端上传进度已经100%，但后端的上传接口还在pending，则模拟进度99%，兼容后端接口质量不好的情况
    if (chunkPercent > 99) chunkPercent = 99;
    updateChunkMap(fileKey, index, {chunkPercent, chunkStatus: EChunkStatus.Uploading}, false);
  };
  // 分片上传的api
  const uploadChunk = async (
    fileKey: string,
    index: number,
    formData: FormData,
    abortController: AbortController
  ): Promise<TChunkResult | undefined> => {
    // 代表此文件所有分片上传都被取消了，比如删除正在上传的文件
    if (!abortMap.current[fileKey]?.length || !promiseMap.current[fileKey]?.length) {
      return;
    }
    const statusObj: Record<string, any> = {chunkStatus: EChunkStatus.Uploading};

    try {
      const res = await uploadChunkApi(formData, abortController, (e) => handleUploadChunkProgress(e, fileKey, index));
      if (res.code === 200 || res.data) {
        statusObj.chunkStatus = EChunkStatus.Success;
        // 只是当前分片上传成功了，还未merge
        statusObj['chunkPercent'] = 100;
        statusObj['pausePercent'] = 0;
        statusObj.data = res.data;
        updateChunkMap(fileKey, index, statusObj);
        // 接口只返回确认元数据；队列结果使用本地的完整分片信息。
        const chunk = fileChunkMap.current[fileKey]?.[index];
        if (!chunk) return;
        const {chunkFile: _chunkFile, ...chunkInfo} = chunk;
        return {...chunkInfo, chunkStatus: EChunkStatus.Success, chunkPercent: 100, pausePercent: 0};
      } else {
        statusObj.chunkStatus = EChunkStatus.Failed;
        statusObj['chunkPercent'] = 0;
        statusObj['pausePercent'] = 0;
        statusObj.data = res.data;
        updateChunkMap(fileKey, index, statusObj);
        return Promise.reject(new Error(`${fileKey}-${t('feature.chunkIndexFailed', {index: index + 1})}`));
      }
    } catch (err: any) {
      // todo
      // AbortError 是请求封装中自定义的
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      statusObj.message = err.message;
      statusObj.chunkStatus = isAbort ? EChunkStatus.Paused : EChunkStatus.Failed;
      statusObj['chunkPercent'] = 0;
      if (isAbort) {
        // 只有暂停错误不需要重置pausePercent
        statusObj.chunkStatus = EChunkStatus.Paused;
      } else {
        statusObj.chunkStatus = EChunkStatus.Failed;
        statusObj['pausePercent'] = 0;
      }
      updateChunkMap(fileKey, index, statusObj);
      return Promise.reject(
        new Error(
          isAbort
            ? t('feature.uploadPaused')
            : err?.message || `${fileKey}-${t('feature.chunkIndexFailed', {index: index + 1})}`
        )
      );
    }
  };

  const buildRequest = (fileKey: string, fileHash: string, chunks: TChunk[]) => {
    const aborts: AbortController[] = [];
    const promises: TAsyncFunction<TChunkResult>[] = [];
    chunks.forEach((chunk, index) => {
      const abort = new AbortController();
      aborts.push(abort);
      promises.push(() => {
        const formData = new FormData();
        formData.append('file', chunk.chunkFile);
        formData.append('fileKey', chunk.fileKey);
        formData.append('fileHash', fileHash);
        formData.append('filePath', chunk.filePath);
        formData.append('chunkIndex', index.toString());
        formData.append('chunkSize', chunk.chunkSize.toString());
        formData.append('chunkStatus', actionStore.chunkStatus);
        formData.append('failedChunkIndex', Math.min(chunks.length, actionStore.failedChunkIndex).toString());
        return uploadChunk(fileKey, index, formData, abort);
      });
    });
    return {promises, aborts};
  };

  /**
   * 构造每个文件上传时需要的数据，并开始执行并发上传
   */
  const startChunkUpload = (file: File, fileHash: string, preChunkMap: Record<string, TChunkResult[]>) => {
    const fileKey = buildFileKey(file);
    const promiseObj: TAsyncFunctionMap<TChunkResult> = {};
    const abortObj: Record<string, AbortController[]> = {};
    const chunkObj: Record<string, any> = {};
    const fileChunkObj: Record<string, TChunk[]> = {};
    const chunks = buildChunks(file, fileHash, chunkSize);
    chunkObj[fileKey] = buildResponse(file, fileHash, chunks);
    // 注意对象的顺序不要错
    setChunkMap((prev) => ({...preChunkMap, ...prev, ...chunkObj}));
    const {promises, aborts} = buildRequest(fileKey, fileHash, chunks);
    fileChunkObj[fileKey] = chunks;
    promiseObj[fileKey] = promises;
    abortObj[fileKey] = aborts;
    promiseMap.current = {...promiseMap.current, ...promiseObj};
    abortMap.current = {...abortMap.current, ...abortObj};
    fileChunkMap.current = {...fileChunkMap.current, ...fileChunkObj};
    // 开始上传：为了实现并发创建了很多闭包，导致有些函数拿不到最新的state
    executeChunkPromise(promiseObj, concurrency);
  };

  const createUploadTask = async (file: File, fileHash: string, preChunkMap: Record<string, TChunkResult[]>) => {
    const fileKey = buildFileKey(file);
    setTaskMap((prev) => ({
      ...prev,
      [fileKey]: {...prev[fileKey], taskStatus: ETaskStatus.Creating},
    }));
    try {
      const res = await createUploadTaskApi({
        ...buildFileFields(file),
        fileHash,
        taskStatus: actionStore.taskStatus,
        needChunk: actionStore.needChunk,
      });
      const {code, data} = res;
      if (code === 200) {
        setTaskMap((prev) => ({
          ...prev,
          [fileKey]: {
            ...prev[fileKey],
            taskStatus: ETaskStatus.Success,
            fileName: file.name, // 不取返回值的name，因为可能出现：前端可传文件内容相同但文件名不同的文件，而接口返回的文件名还是之前上传该文件时的名字
            needChunk: !data?.fileUrl,
            /**
             * 后端要的数据就是fileUrl
             * 不需要merge的文件：就是此数据
             * 需要merge的文件：需要merge成功后设置fileUrl
             */
            fileUrl: data?.fileUrl,
          },
        }));
        // 每个文件的上传任务创建成功且没有fileUrl，才会去创建分片。
        if (!data?.fileUrl && file.size > 0) {
          startChunkUpload(file, fileHash, preChunkMap);
        }
      } else {
        toast.add({title: `【${fileKey}】` + t('feature.createUploadTaskFailed'), type: 'error'});
        // 创建任务失败不需要展示失败状态，而是直接删除该文件的任务
        setTaskMap((pre) => {
          delete pre[fileKey];
          return {...pre};
        });
      }
    } catch (_err) {
      toast.add({title: `【${fileKey}】` + t('feature.createUploadTaskFailed'), type: 'error'});
      setTaskMap((pre) => {
        delete pre[fileKey];
        return {...pre};
      });
    }
  };

  const buildFileHash = async (
    file: File,
    preTaskMap: Record<string, TTaskResult>,
    preChunkMap: Record<string, TChunkResult[]>
  ): Promise<string> => {
    const fileKey = buildFileKey(file);
    setTaskMap((prev) => ({
      ...preTaskMap,
      ...prev,
      [fileKey]: {
        ...prev[fileKey],
        ...buildFileFields(file),
        fileHash: '',
        taskStatus: ETaskStatus.CalcHashDoing,
        mergeStatus: EMergeStatus.NotMerge,
        needChunk: true, // 默认需要分片
      },
    }));
    let fileHash = await calcFileHash(file);
    fileHash = fileHash + ':' + Date.now();
    // 将文件计算的hash进度设置为100
    setTaskMap((prev) => ({
      ...prev,
      [fileKey]: {
        ...prev[fileKey],
        fileHash,
        taskStatus: ETaskStatus.CalcHashDone,
      },
    }));
    // 每个文件hash计算完了，立马执行每个文件的预任务
    createUploadTask(file, fileHash, preChunkMap);
    return fileHash;
  };

  // 支持同一文件(夹)上传
  const allowSameFileOrFolder = () => {
    if (fileRef.current) {
      fileRef.current.value = '';
    }
    if (folderRef.current) {
      folderRef.current.value = '';
    }
  };

  const startUpload = (files: File[]) => {
    onBeforeStartUpload?.();
    const hashPromises: TAsyncFunction<string>[] = [];
    const preTaskMap = multiple ? taskMap : {};
    const preChunkMap = multiple ? chunkMap : {};
    // 构造请求列表
    files.forEach((file) => {
      hashPromises.push(() => buildFileHash(file, preTaskMap, preChunkMap));
    });
    /**
     * 上传步骤：
     * (1)并行计算文件hash
     *    (1.1)并行是针对前端层面上的文件hash计算，而不是前端请求层面
     *    (1.2)所以最终并行的请求接口数量是：MAX_FILE_NUM个文件内，各文件中分片请求数量之和（浏览器自身有优化，只会并发6个）
     * (2)某一个文件的hash计算完，立马执行该文件的预任务请求
     * (3)某一个文件的预任务请求成功，立马对该文件进行并发分片上传
     */
    parallelTask(hashPromises, MAX_FILE_NUM);
    // 下次上传允许选择相同文件
    allowSameFileOrFolder();
  };

  const clearSameFile = (fileList: File[]) => {
    fileList.forEach((file) => {
      // 相同文件的标识
      const fileKey = buildFileKey(file);
      /**
       * 两种处理方式：
       * (1)目前采用：清空正在进行的任务，重新上传
       * (2)不再进行上传（如果fileKey相同，文件内容不同怎么处理，所以未采用）
       */
      if (chunkMap[fileKey] && chunkMap[fileKey].length > 0) {
        abortMap.current[fileKey]?.forEach((v) => v.abort());
        delete abortMap.current[fileKey];
        delete promiseMap.current[fileKey];
        delete mergeRetryCount.current[fileKey];
        delete fileChunkMap.current[fileKey];
        delete chunkMap[fileKey];
        setChunkMap({...chunkMap});
      }
      if (taskMap[fileKey]) {
        delete taskMap[fileKey];
        setTaskMap({...taskMap});
      }
    });
  };

  const handleBeforeUploadFile = (files: File[]) => {
    if (files.find((v) => v.size === 0)) {
      toast.add({title: t('feature.fileSizeCannotBeZero'), type: 'error'});
      return false;
    }
    if (files.find((v) => !file.isFileSizeInRange(v.size, maxSize))) {
      toast.add({title: t('feature.fileSizeCannotExceed', {size: file.formatByteSize(maxSize)}), type: 'error'});
      return false;
    }
    if (multiple) {
      if (files.length > maxFileNum) {
        toast.add({title: t('feature.maxFileNum', {num: maxFileNum}), type: 'error'});
        return false;
      }
      clearSameFile(files);
    } else {
      /**
       * 仅单文件上传，多种交互
       * (1)目前采用：提示用户只能传一个文件
       * (2)选择文件替换当前已有，调用reset：需要完善，且有bug
       * (3)已有文件时，禁用上传按钮
       */
      if (value && value.length > 0) {
        toast.add({title: t('feature.onlyUploadSingleFile'), type: 'error'});
        return false;
      }
      // 单个文件时，fileKey就是文件名
      delete mergeRetryCount.current[files[0].name];
    }
    return true;
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const fileList = Array.from(files);
    const passed = handleBeforeUploadFile(fileList);
    if (!passed) {
      allowSameFileOrFolder();
      return;
    }
    startUpload(fileList);
  };

  const handleBeforeUploadFolder = (files: File[]) => {
    clearSameFile(files);
    if (files.length > MAX_FOLDER_FILE_NUM) {
      toast.add({
        title:
          t('feature.maxFileNum', {num: MAX_FOLDER_FILE_NUM}) + `, ` + t('feature.folderFileNum', {num: files.length}),
        type: 'error',
      });
      return false;
    }
    if (files.find((v) => !file.isFileSizeInRange(v.size, maxSize))) {
      toast.add({title: t('feature.fileSizeCannotExceed', {size: file.formatByteSize(maxSize)}), type: 'error'});
      return false;
    }
    return true;
  };

  const handleSelectFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log(files);
    const fileList = sanitizeFolderFiles(files || []);
    if (!fileList || !fileList.length) return;
    const passed = handleBeforeUploadFolder(fileList);
    if (!passed) {
      allowSameFileOrFolder();
      return;
    }
    startUpload(fileList);
  };

  /**
   * 暂停上传
   */
  const handleUploadPause = (fileKey: string) => {
    abortMap.current[fileKey].forEach((v) => v.abort());
    abortMap.current[fileKey] = [];
    const fileResults = chunkMap[fileKey].map((v: TChunkResult) => {
      if (EChunkStatus.Uploading === v.chunkStatus) {
        return {
          ...v,
          chunkStatus: EChunkStatus.Paused,
          // 点击暂停时进度不变，待恢复上传进度与暂停进度同步。注意：第一次暂停后，若还未恢复继续点了暂停，那么需要判断对比暂停的进度和上一次的暂停进度
          pausePercent: v.pausePercent && v.pausePercent >= v.chunkPercent ? v.pausePercent : v.chunkPercent,
          chunkPercent: 0,
        };
      }
      return v;
    });
    setChunkMap((prev) => ({...prev, [fileKey]: [...fileResults]}));
  };

  /**
   * 恢复上传：暂停状态中，可能包含失败的分片
   */
  const handleUploadResume = async (fileKey: string, hash: string) => {
    // 需要重新建立Promise和AbortController的关联
    const {promises, aborts} = buildRequest(fileKey, hash, fileChunkMap.current[fileKey]);
    promiseMap.current = {...promiseMap.current, [fileKey]: [...promises]};
    abortMap.current = {...abortMap.current, [fileKey]: [...aborts]};
    const needResumePromises: TAsyncFunction<TChunkResult>[] = [];
    // 失败的分片也重新上传
    const fileResults = chunkMap[fileKey].map((v: TChunkResult, index: number) => {
      const w = {...v};
      if ([EChunkStatus.Failed, EChunkStatus.Paused].includes(v.chunkStatus as any)) {
        w.chunkStatus = EChunkStatus.Uploading;
        needResumePromises.push(promises[index]);
      } else if (v.chunkStatus === EChunkStatus.NotUpload) {
        needResumePromises.push(promises[index]);
      }
      return w;
    });
    if (!fileResults.length) return;
    setChunkMap((prev) => ({...prev, [fileKey]: [...fileResults]}));
    parallelTask(needResumePromises, concurrency);
  };

  /**
   * 重新上传
   */
  const handleReUpload = async (fileKey: string, hash: string) => {
    const {promises, aborts} = buildRequest(fileKey, hash, fileChunkMap.current[fileKey]);
    promiseMap.current = {...promiseMap.current, [fileKey]: [...promises]};
    abortMap.current = {...abortMap.current, [fileKey]: [...aborts]};
    const needResumePromises: TAsyncFunction<TChunkResult>[] = [];
    const fileResults = chunkMap[fileKey].map((v: TChunkResult, index: number) => {
      // 只需要失败的分片重新上传
      if ([EChunkStatus.Failed].includes(v.chunkStatus as any)) {
        // 需要将需要重新上传的状态改为Uploading
        v.chunkStatus = EChunkStatus.Uploading;
        needResumePromises.push(promises[index]);
      }
      return v;
    });
    if (!fileResults.length) return;
    setChunkMap((prev) => ({...prev, [fileKey]: [...fileResults]}));
    parallelTask(needResumePromises, concurrency);
  };

  const handleMergeResume = (fileKey: string) => {
    mergeChunk(fileKey, chunkMap[fileKey]);
  };

  /**
   * 删除分片过的文件
   */
  const handleDelChunkFile = (fileKey: string) => {
    onDelete?.(fileKey);
    delete chunkMap?.[fileKey];
    delete taskMap?.[fileKey];
    setChunkMap({...chunkMap});
    setTaskMap({...taskMap});
    abortMap.current[fileKey]?.forEach((v) => v?.abort());
    delete promiseMap.current[fileKey];
    delete abortMap.current[fileKey];
    delete mergeRetryCount.current[fileKey];
    allowSameFileOrFolder();
  };

  /**
   * 删除无需分片的文件
   */
  const handleDelNoChunkFile = (fileKey: string) => {
    onDelete?.(fileKey);
    delete taskMap?.[fileKey];
    setTaskMap({...taskMap});
    allowSameFileOrFolder();
  };

  const renderUploadStatus = (fileKey: string, task: TTaskResult) => {
    if (task.taskStatus === ETaskStatus.None) {
      return <NoChunkFile fileKey={fileKey} task={task} handleDelNoChunkFile={handleDelNoChunkFile} />;
    } else if (task.taskStatus === ETaskStatus.CalcHashDoing) {
      return (
        <LoadingOverlay loading showText={false} size="sm">
          <div className="bg-accent rounded-md border p-2 text-xs">{t('feature.validateFile')}</div>
        </LoadingOverlay>
      );
    } else if (task.taskStatus === ETaskStatus.Creating) {
      return (
        <LoadingOverlay loading showText={false} size="sm">
          <div className="bg-accent rounded-md border p-2 text-xs">{t('feature.createUploadTask')}</div>
        </LoadingOverlay>
      );
    } else if (task.taskStatus === ETaskStatus.Success) {
      return (
        <>
          {task.needChunk ? (
            <LoadingOverlay loading={task.mergeStatus === EMergeStatus.Merging} text="分片合并中" size="sm">
              <ChunkFile
                fileKey={fileKey}
                chunks={chunkMap[fileKey]}
                task={task}
                handleDelChunkFile={handleDelChunkFile}
                handleUploadPause={handleUploadPause}
                handleUploadResume={handleUploadResume}
                handleReUpload={handleReUpload}
                handleMergeResume={handleMergeResume}
                renderProgress={renderProgress}
              />
            </LoadingOverlay>
          ) : (
            <NoChunkFile fileKey={fileKey} task={task} handleDelNoChunkFile={handleDelNoChunkFile} />
          )}
        </>
      );
    }
    return null;
  };

  useImperativeHandle(ref, () => ({
    startUpload,
    resetUpload: () => {
      resetState();
      resetValue();
    },
  }));

  const uploadFilesContent = (
    <div className="flex flex-col gap-2">
      {Object.keys(taskMap).map((fileKey) => {
        return <Fragment key={fileKey}>{renderUploadStatus(fileKey, taskMap[fileKey])}</Fragment>;
      })}
    </div>
  );

  console.log(chunkMap, '=====', taskMap);

  return (
    <div className="flex gap-2">
      <div className="min-w-100 flex-1 border p-2">
        <div className="inline-flex min-w-xs items-center gap-2 border">
          {onlyShowFile ? (
            <Button disabled={uploadIsDisabled || disabled} onClick={() => fileRef.current?.click()}>
              <UploadIcon />
              {uploadText}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button className="rounded-md" />}>
                <UploadIcon />
                {uploadText}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem disabled={uploadIsDisabled || disabled} onClick={() => fileRef.current?.click()}>
                  {t('feature.uploadFile')}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={disabled} onClick={() => folderRef.current?.click()}>
                  {t('feature.uploadFolder')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <input
            style={{display: 'none'}}
            type="file"
            ref={fileRef}
            multiple={multiple}
            accept={accept}
            onChange={handleSelectFile}
          />
          {/* multiple：加与不加都只允许选择单个文件夹 */}
          <input
            style={{display: 'none'}}
            type="file"
            ref={folderRef}
            {...({webkitdirectory: 'true'} as any)}
            onChange={handleSelectFolder}
          />
          {tip && (
            <span className="text-muted-foreground truncate text-xs" title={tip}>
              {tip}
            </span>
          )}
        </div>
        <br />
        <br />
        {portalContainer ? createPortal(uploadFilesContent, portalContainer) : uploadFilesContent}
      </div>
      <Action store={actionStore} />
    </div>
  );
};

const ChunkUploadRef = forwardRef(ChunkUpload);
const MemoChunkUpload = memo(ChunkUploadRef, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.value) === JSON.stringify(nextProps.value) &&
    prevProps.showUpload === nextProps.showUpload &&
    prevProps.disabled === nextProps.disabled
  );
});

export default function ChunkUploadPage() {
  const [files, setFiles] = useState<TTaskResult[]>([
    {
      filePath: '', // 文件
      fileKey: 'file.txt',
      fileName: 'file.txt',
      fileSize: 1024 * 1024 * 100,
      fileHash: '4baac16e8da1e642ecf96d1e3c058dcc:1763433695701',
      fileUrl: 'https://loremflickr.com/2995/1834?lock=2571105049782350',
    },
    {
      filePath: 'folder/file.video', // 文件夹里的文件
      fileKey: 'folder/file.video',
      fileName: 'file.txt',
      fileSize: 1024 * 1024 * 1024,
      fileHash: '4baac16e8da1e642ecf96d1e3c058dcc:1763433695702',
      fileUrl: 'https://picsum.photos/seed/73DqlQT/1460/1287',
    },
  ]);
  return (
    <MemoChunkUpload
      value={files}
      onChange={(value) => {
        console.warn('MemoChunkUpload onChange', value);
        setFiles(value);
      }}
    />
  );
}
