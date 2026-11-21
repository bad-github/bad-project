import type {MainToWorkerMessage, OrderItem, OrderSummary, WorkerToMainMessage} from '@/worker/common-worker';

import {Button, Progress, BadTooltip} from '@badnpm/ui';
import {useEffect, useRef, useState} from 'react';
import QuestionCircle from '@/assets/svg/circle-question-mark.svg?react';

// 只能使用参数与局部变量。转成字符串后，不会携带主线程的闭包。
function summarizeOrders(orders: OrderItem[]): OrderSummary {
  return {
    productCount: orders.length,
    quantity: orders.reduce((total, item) => total + item.quantity, 0),
    // 金额使用整数分，避免直接累加小数金额。
    totalInCents: orders.reduce((total, item) => total + item.priceInCents * item.quantity, 0),
  };
}

type WorkerTask =
  | Omit<Extract<MainToWorkerMessage, {action: 'NORMALIZE_USERS'}>, 'requestId'>
  | Omit<Extract<MainToWorkerMessage, {action: 'EXECUTE_FUNC'}>, 'requestId'>
  | Omit<Extract<MainToWorkerMessage, {action: 'COUNT_PRIMES'}>, 'requestId'>;

export default function WebWorkerPage() {
  const workerRef = useRef<Worker | null>(null);
  const latestRequestId = useRef(0);
  const [request, setRequest] = useState<MainToWorkerMessage | null>(null);
  const [result, setResult] = useState<Extract<WorkerToMainMessage, {status: 'success'}> | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const worker = new Worker(new URL('../../../worker/common-worker.ts', import.meta.url), {type: 'module'});
    workerRef.current = worker;

    const handleMessage = (event: MessageEvent<WorkerToMainMessage>) => {
      const message = event.data;
      // 连续点击时只展示最后一次请求的结果，较早的回复不能覆盖它。
      if (message.requestId !== latestRequestId.current) return;
      if (message.status === 'progress') {
        setProgress(message.payload.percent);
        return;
      }
      setIsPending(false);
      if (message.status === 'error') {
        setError(message.payload.message);
        return;
      }
      if (message.action === 'COUNT_PRIMES') setProgress(100);
      setResult(message);
      setError('');
    };
    const handleError = (event: ErrorEvent) => {
      setIsPending(false);
      setError(event.message || 'Worker 加载或执行失败，请查看控制台。');
    };
    const handleMessageError = () => {
      setIsPending(false);
      setError('无法反序列化 Worker 返回的消息。');
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.addEventListener('messageerror', handleMessageError);

    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      worker.removeEventListener('messageerror', handleMessageError);
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
  }, []);

  const sendMessage = (task: WorkerTask) => {
    if (!workerRef.current) return;
    const message: MainToWorkerMessage = {...task, requestId: ++latestRequestId.current};
    setRequest(message);
    setIsPending(true);
    setProgress(0);
    setError('');
    // 保留上一份结果，收到新结果后直接替换，避免切回空状态造成闪烁。
    try {
      workerRef.current.postMessage(message);
    } catch (err) {
      setIsPending(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap gap-4">
        <Button
          type="button"
          disabled={isPending}
          onClick={() =>
            sendMessage({
              action: 'NORMALIZE_USERS',
              payload: {
                users: [
                  {id: 1, name: ' 张三 ', email: ' ZhangSan@Example.COM '},
                  {id: 2, name: ' 李四 ', email: ' LiSi@Example.COM '},
                ],
              },
            })
          }
        >
          清洗用户数据
          <BadTooltip
            trigger={{
              render: <span />,
              'aria-label': '示例1说明',
              className: 'inline-flex shrink-0 cursor-help items-center',
              children: <QuestionCircle aria-hidden="true" className="size-4" />,
            }}
            content={{
              children: '示例一：发送用户数据，在 Worker 中去除姓名和邮箱的首尾空格，并统一邮箱为小写。',
              className: 'max-w-xs whitespace-normal break-words leading-relaxed',
            }}
          />
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={() =>
            sendMessage({
              action: 'EXECUTE_FUNC',
              payload: {
                source: summarizeOrders.toString(),
                args: [
                  [
                    {name: '键盘', quantity: 2, priceInCents: 19900},
                    {name: '鼠标', quantity: 1, priceInCents: 9900},
                  ],
                ],
              },
            })
          }
        >
          执行函数计算订单汇总
          <BadTooltip
            trigger={{
              render: <span />,
              'aria-label': '示例2说明',
              className: 'inline-flex shrink-0 cursor-help items-center',
              children: <QuestionCircle aria-hidden="true" className="size-4" />,
            }}
            content={{
              children:
                '示例二：发送函数源码与订单参数，由 Worker 计算商品种类、总数量和总金额（分）。函数源码不携带闭包，动态执行受 CSP 限制。',
              className: 'max-w-xs whitespace-normal break-words leading-relaxed',
            }}
          />
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => sendMessage({action: 'COUNT_PRIMES', payload: {durationMs: 3000}})}
        >
          模拟耗时计算（约 3 秒）
          <BadTooltip
            trigger={{
              render: <span />,
              'aria-label': '示例3说明',
              className: 'inline-flex shrink-0 cursor-help items-center',
              children: <QuestionCircle aria-hidden="true" className="size-4" />,
            }}
            content={{
              children:
                '示例三：在 Worker 中持续统计质数约 3 秒，每隔约 100 毫秒发送时间进度，最后返回质数数量、检查范围与实际耗时。计算期间可点击下方计数按钮，观察主线程仍可响应。',
              className: 'max-w-xs whitespace-normal break-words leading-relaxed',
            }}
          />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => setClickCount((count) => count + 1)}>
          主线程交互：已点击 {clickCount} 次
        </Button>
        <span className="text-muted-foreground text-sm">计算期间也可点击，验证页面仍能响应。</span>
      </div>
      {request?.action === 'COUNT_PRIMES' && (
        <div className="space-y-2">
          <Progress value={progress} aria-label="耗时计算的时间进度" className="h-2 w-1/2" />
          <p className="text-muted-foreground text-sm">时间进度：{progress}%</p>
        </div>
      )}
      <p role="status" aria-live="polite" className="text-muted-foreground min-h-5 text-sm">
        {isPending
          ? `正在处理请求 #${request?.requestId}，下方保留上一次成功结果。`
          : error
            ? '请求失败，下方保留上一次成功结果。'
            : result
              ? `请求 #${result.requestId} 已完成。`
              : '点击按钮发送示例消息。'}
      </p>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="min-w-0" aria-labelledby="worker-request-title">
          <h2 id="worker-request-title" className="mb-2 font-medium">
            主线程发送
          </h2>
          <pre className="bg-muted h-80 overflow-auto rounded-md p-3 text-sm">
            {request ? JSON.stringify(request, null, 2) : '尚未发送消息。'}
          </pre>
        </section>
        <section className="min-w-0" aria-labelledby="worker-result-title" aria-busy={isPending}>
          <h2 id="worker-result-title" className="mb-2 font-medium">
            Worker 返回
          </h2>
          <pre className="bg-muted h-80 overflow-auto rounded-md p-3 text-sm">
            {result ? JSON.stringify(result, null, 2) : '尚未收到结果。'}
          </pre>
        </section>
      </div>
    </div>
  );
}
