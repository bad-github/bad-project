export type UserRecord = {id: number; name: string; email: string};
export type OrderItem = {name: string; quantity: number; priceInCents: number};
export type OrderSummary = {productCount: number; quantity: number; totalInCents: number};

// 使用 action 区分任务，requestId 关联请求和回复。
export type MainToWorkerMessage =
  | {requestId: number; action: 'NORMALIZE_USERS'; payload: {users: UserRecord[]}}
  | {requestId: number; action: 'EXECUTE_FUNC'; payload: {source: string; args: [OrderItem[]]}}
  | {requestId: number; action: 'COUNT_PRIMES'; payload: {durationMs: number}};

export type WorkerAction = MainToWorkerMessage['action'];

export type WorkerToMainMessage =
  | {
      requestId: number;
      action: 'NORMALIZE_USERS';
      status: 'success';
      payload: {users: UserRecord[]; count: number};
    }
  | {requestId: number; action: 'EXECUTE_FUNC'; status: 'success'; payload: OrderSummary}
  | {requestId: number; action: 'COUNT_PRIMES'; status: 'progress'; payload: {percent: number}}
  | {
      requestId: number;
      action: 'COUNT_PRIMES';
      status: 'success';
      payload: {checkedThrough: number; primeCount: number; elapsedMs: number};
    }
  | {requestId: number; action: WorkerAction; status: 'error'; payload: {message: string}};


function postMessage(message: WorkerToMainMessage) {
  self.postMessage(message);
}

function countPrimes(requestId: number, durationMs: number) {
  if (!Number.isInteger(durationMs) || durationMs < 100 || durationMs > 10000) {
    throw new Error('计算时长必须是 100～10000 毫秒之间的整数。');
  }
  const startedAt = performance.now();
  let candidate = 2;
  let primeCount = 0;
  let lastReportedAt = startedAt;
  postMessage({requestId, action: 'COUNT_PRIMES', status: 'progress', payload: {percent: 0}});

  // 真正占用 Worker CPU 的同步计算，不用 setTimeout 假装计算耗时。
  // 按批检查时间，避免每个数字都读取时钟；时间进度不代表固定数据量的完成比例。
  while (performance.now() - startedAt < durationMs) {
    for (let index = 0; index < 500; index++, candidate++) {
      let isPrime = true;
      for (let divisor = 2; divisor * divisor <= candidate; divisor++) {
        if (candidate % divisor === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) primeCount++;
    }
    const now = performance.now();
    // 限制进度消息频率，避免高频通信拖慢主线程。
    if (now - lastReportedAt >= 100) {
      lastReportedAt = now;
      postMessage({
        requestId,
        action: 'COUNT_PRIMES',
        status: 'progress',
        payload: {percent: Math.min(99, Math.floor(((now - startedAt) / durationMs) * 100))},
      });
    }
  }
  postMessage({
    requestId,
    action: 'COUNT_PRIMES',
    status: 'success',
    payload: {checkedThrough: candidate - 1, primeCount, elapsedMs: Math.round(performance.now() - startedAt)},
  });
}

self.addEventListener('message', (event: MessageEvent<MainToWorkerMessage>) => {
  const {requestId, action} = event.data;
  try {
    switch (event.data.action) {
      case 'NORMALIZE_USERS': {
        const users = event.data.payload.users.map((user) => ({
          ...user,
          name: user.name.trim(),
          email: user.email.trim().toLowerCase(),
        }));
        postMessage({requestId, action: 'NORMALIZE_USERS', status: 'success', payload: {users, count: users.length}});
        break;
      }
      case 'EXECUTE_FUNC': {
        const {source, args} = event.data.payload;
        // 只执行本示例内定义的独立函数：源码不携带闭包，参数与结果须支持结构化克隆。
        const execute = new Function('args', `return (${source})(...args)`) as (args: [OrderItem[]]) => OrderSummary;
        postMessage({requestId, action: 'EXECUTE_FUNC', status: 'success', payload: execute(args)});
        break;
      }
      case 'COUNT_PRIMES': {
        countPrimes(requestId, event.data.payload.durationMs);
        break;
      }
      default:
        throw new Error(`不支持的任务：${action}`);
    }
  } catch (error) {
    postMessage({
      requestId,
      action,
      status: 'error',
      payload: {message: error instanceof Error ? error.message : String(error)},
    });
  }
});
