import {useEffect, useState} from 'react';
import type {UseFormReturn} from 'react-hook-form';
import {saveDraft} from './api';
import type {ProfileValues} from './form-model';

/**
 * subscribe 用于表单变化后的副作用，不像 useWatch 那样为了显示值而驱动组件重渲染。
 * 订阅回调只调度防抖任务，不在回调内 setValue/reset 或同步 setState，避免反馈循环。
 * 外部 loading、提交、刷新会暂时停用订阅；上传仍保持订阅，接收上传成功后提交的新值。
 */
export default function useDraft(form: UseFormReturn<ProfileValues>, enabled: boolean) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof saveDraft>> | null>(null);
  const [status, setStatus] = useState('等待编辑');
  const {subscribe} = form;
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    let revision = 0;
    // 只请求 values 变化，不订阅 isValid 等状态，避免为了草稿额外触发表单有效性检查。
    const unsubscribe = subscribe({
      formState: {values: true},
      callback: ({values}) => {
        const currentRevision = ++revision;
        // 防抖期中值还会继续变，必须复制事件当时的数据；File 可克隆，展示前再移除其内容。
        const snapshot = structuredClone(values);
        clearTimeout(timer);
        // subscribe 回调只调度任务，不直接修改表单或 React 状态。
        timer = setTimeout(async () => {
          setStatus('正在保存…');
          try {
            const saved = await saveDraft(snapshot);
            // 防抖只合并尚未发送的任务；已发出的旧请求仍可能晚返回，需要版本号防止覆盖。
            if (revision === currentRevision) {
              setResult(saved);
              setStatus(`草稿已更新 · ${saved.savedAt}`);
            }
          } catch {
            if (revision === currentRevision) setStatus('保存失败，请继续编辑后重试');
          }
        }, 800);
      },
    });
    return () => {
      // 同时取消未发出的 timer、使在途结果失效并解绑订阅。
      // 只清 timer 无法阻止已发出的请求在卸载后回写状态。
      revision++;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [enabled, subscribe]);
  return {result, status: enabled ? status : '未开启'};
}
