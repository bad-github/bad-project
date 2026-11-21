/**
 * ProducerConsumerQueue 的配置项。
 *
 * T 是任务的数据类型。例如 T 为 string 时，队列中每个任务就是一个字符串。
 */
export interface ProducerConsumerQueueOptions<T> {
  /**
   * 属性名：maxSize
   * 含义：队列最多缓存多少个“等待被消费”的任务。
   *
   * 注意：这里统计的是 queue 中排队等待的任务，不包含正在执行中的任务。
   * 当 queue.length >= maxSize 时，新的 produce 会先进入 waitingProducers 等待，
   * 等消费者取走任务、队列腾出空间后再真正进入 queue。
   *
   * 这个机制叫背压：生产太快时，让生产者等一等，避免内存无限增长。
   */
  maxSize?: number;

  /**
   * 属性名：concurrency
   * 含义：最多同时执行多少个消费任务。
   *
   * 例如 concurrency = 2 时，队列会同时处理 2 个任务；
   * 有任务完成后，再从 queue 中取下一个任务补上。
   */
  concurrency?: number;

  /**
   * 属性名：autoStart
   * 含义：任务入队后是否自动开始消费。
   *
   * true：调用 produce 后自动调度消费。
   * false：任务只会进入队列，需要手动调用 start() 才会开始消费。
   */
  autoStart?: boolean;

  /**
   * 属性名：onError
   * 含义：消费者函数执行失败时的统一错误处理函数。
   *
   * error：consumer 抛出的错误。
   * item：出错时正在消费的任务。
   */
  onError?: (error: unknown, item: T) => void;
}

/**
 * 类型名：Consumer
 * 含义：消费者函数类型。
 *
 * 它接收一个任务 item，可以同步处理，也可以返回 Promise 异步处理。
 */
type Consumer<T> = (item: T) => void | Promise<void>;

/**
 * 类型名：WaitingProducer
 * 含义：因为队列满了而暂时等待的生产者信息。
 */
interface WaitingProducer<T> {
  /**
   * 属性名：item
   * 含义：生产者想要放进队列的任务。
   */
  item: T;

  /**
   * 属性名：resolve
   * 含义：当任务真正进入 queue 后，用它唤醒 produce 中等待的 Promise。
   */
  resolve: () => void;
}

/**
 * 一个轻量的生产者-消费者队列。
 *
 * producer 调用 produce 放入任务，consumer 通过构造函数传入并按 FIFO 顺序消费。
 *
 * FIFO：First In First Out，先进先出。
 * 也就是说，先 produce 的任务会优先被消费。
 */
export class ProducerConsumerQueue<T> {
  /**
   * 属性名：queue
   * 含义：真正的任务队列，保存“已经生产出来，但还没有开始消费”的任务。
   *
   * 这是生产者消费者模型中的缓冲区。
   */
  private queue: T[] = [];

  /**
   * 属性名：waitingProducers
   * 含义：等待中的生产者队列。
   *
   * 当 queue 已经达到 maxSize 时，新的 produce 不能立刻把任务放入 queue，
   * 于是先把任务和 resolve 保存到这里。
   */
  private waitingProducers: WaitingProducer<T>[] = [];

  /**
   * 属性名：idleResolvers
   * 含义：等待队列空闲的 Promise resolve 列表。
   *
   * 调用 waitUntilIdle() 时，如果队列还没空，会把 resolve 放到这里。
   * 等所有任务都完成后，再统一 resolve。
   */
  private idleResolvers: Array<() => void> = [];

  /**
   * 属性名：consumer
   * 含义：真正执行任务的消费者函数。
   *
   * 每次从 queue 中取出一个 item，都会交给 consumer(item) 处理。
   */
  private consumer: Consumer<T>;

  /**
   * 属性名：maxSize
   * 含义：queue 允许缓存的最大任务数量。
   *
   * 代码中会保证它至少为 1，避免出现队列永远无法放入任务的情况。
   */
  private maxSize: number;

  /**
   * 属性名：concurrency
   * 含义：最大并发消费数量。
   *
   * activeCount < concurrency 时，调度器才会继续从 queue 中取任务消费。
   */
  private concurrency: number;

  /**
   * 属性名：activeCount
   * 含义：当前正在执行中的消费者数量。
   *
   * consume 开始时 +1，结束时 -1。
   */
  private activeCount = 0;

  /**
   * 属性名：started
   * 含义：队列是否处于启动状态。
   *
   * true 表示允许 schedule 调度任务；
   * false 表示暂停调度，但已经开始执行的任务不会被强制中断。
   */
  private started: boolean;

  /**
   * 构造函数。
   *
   * consumer：消费者函数，定义“如何处理一个任务”。
   * options：队列配置项，例如 maxSize、concurrency、autoStart、onError。
   */
  constructor(consumer: Consumer<T>, options: ProducerConsumerQueueOptions<T> = {}) {
    this.consumer = consumer;
    this.maxSize = Math.max(1, options.maxSize ?? Number.POSITIVE_INFINITY);
    this.concurrency = Math.max(1, options.concurrency ?? 1);
    this.started = options.autoStart ?? true;
    this.onError = options.onError;
  }

  /**
   * 属性名：onError
   * 含义：消费任务失败时的错误处理函数。
   *
   * 这里单独保存为类属性，方便 consume 捕获错误后调用。
   */
  private onError?: (error: unknown, item: T) => void;

  /**
   * 方法名：produce
   * 含义：生产一个任务。
   *
   * item：要放入队列的任务。
   *
   * 执行逻辑：
   * 1. 如果 queue 没满，直接把 item 放入 queue。
   * 2. 如果 queue 满了，把 item 放入 waitingProducers 等待。
   * 3. 入队成功后调用 schedule()，尝试触发消费。
   */
  async produce(item: T): Promise<void> {
    if (this.queue.length >= this.maxSize) {
      await new Promise<void>((resolve) => {
        this.waitingProducers.push({item, resolve});
      });
    } else {
      this.queue.push(item);
    }

    this.schedule();
  }

  /**
   * 方法名：enqueue
   * 含义：produce 的别名。
   *
   * 有些人习惯把“入队”叫 enqueue，所以这里提供一个语义更贴近队列的名字。
   */
  enqueue(item: T): Promise<void> {
    return this.produce(item);
  }

  /**
   * 方法名：start
   * 含义：启动队列消费。
   *
   * 如果 autoStart 为 false，可以先 produce 多个任务，再手动 start。
   */
  start(): void {
    this.started = true;
    this.schedule();
  }

  /**
   * 方法名：pause
   * 含义：暂停队列调度。
   *
   * 注意：pause 只是不再启动新的消费任务；
   * 已经进入 consume 的任务会继续执行，不会被取消。
   */
  pause(): void {
    this.started = false;
  }

  /**
   * 方法名：clear
   * 含义：清空等待消费的任务和等待入队的生产者。
   *
   * 注意：clear 不会取消正在执行中的任务。
   */
  clear(): void {
    this.queue = [];
    this.waitingProducers.splice(0).forEach((producer) => producer.resolve());
    this.resolveIdleIfNeeded();
  }

  /**
   * 方法名：waitUntilIdle
   * 含义：等待队列完全空闲。
   *
   * 完全空闲需要同时满足：
   * 1. queue 中没有等待消费的任务。
   * 2. waitingProducers 中没有等待入队的生产者。
   * 3. activeCount 为 0，没有正在执行的消费者。
   */
  waitUntilIdle(): Promise<void> {
    if (this.isIdle) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.idleResolvers.push(resolve);
    });
  }

  /**
   * 属性名：size
   * 含义：当前 queue 中等待消费的任务数量。
   *
   * 不包含 waitingProducers，也不包含 activeCount。
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * 属性名：pendingSize
   * 含义：当前还没开始消费的任务总数。
   *
   * 包含 queue 中等待消费的任务，也包含 waitingProducers 中等待入队的任务。
   */
  get pendingSize(): number {
    return this.queue.length + this.waitingProducers.length;
  }

  /**
   * 属性名：active
   * 含义：当前正在执行中的任务数量。
   */
  get active(): number {
    return this.activeCount;
  }

  /**
   * 属性名：isRunning
   * 含义：队列当前是否允许调度消费。
   */
  get isRunning(): boolean {
    return this.started;
  }

  /**
   * 属性名：isIdle
   * 含义：队列是否完全空闲。
   */
  get isIdle(): boolean {
    return this.queue.length === 0 && this.waitingProducers.length === 0 && this.activeCount === 0;
  }

  /**
   * 方法名：schedule
   * 含义：调度器，负责把 queue 中的任务分配给 consumer。
   *
   * 它会在以下时机被调用：
   * 1. produce/enqueue 新任务后。
   * 2. start 启动队列后。
   * 3. consume 完成一个任务后。
   *
   * while 循环的条件表示：
   * 只要还没达到并发上限，并且 queue 里还有任务，就继续取任务执行。
   */
  private schedule(): void {
    if (!this.started) return;

    while (this.activeCount < this.concurrency && this.queue.length > 0) {
      const item = this.queue.shift() as T;

      this.flushWaitingProducers();
      this.consume(item);
    }

    this.resolveIdleIfNeeded();
  }

  /**
   * 方法名：consume
   * 含义：消费单个任务。
   *
   * item：从 queue 中取出的任务。
   *
   * 执行流程：
   * 1. activeCount +1，表示多了一个正在执行的任务。
   * 2. 调用 consumer(item) 真正处理任务。
   * 3. 如果出错，调用 onError。
   * 4. finally 中 activeCount -1，并继续 schedule 后续任务。
   */
  private async consume(item: T): Promise<void> {
    this.activeCount += 1;

    try {
      await this.consumer(item);
    } catch (error) {
      this.onError?.(error, item);
    } finally {
      this.activeCount -= 1;
      this.schedule();
    }
  }

  /**
   * 方法名：flushWaitingProducers
   * 含义：把 waitingProducers 中等待的生产者移动到 queue。
   *
   * 当消费者从 queue 中拿走任务后，queue 会腾出空间，
   * 这时就可以把之前因为 maxSize 限制而等待的任务补进来。
   */
  private flushWaitingProducers(): void {
    while (this.queue.length < this.maxSize && this.waitingProducers.length > 0) {
      const producer = this.waitingProducers.shift();
      if (!producer) return;

      this.queue.push(producer.item);
      producer.resolve();
    }
  }

  /**
   * 方法名：resolveIdleIfNeeded
   * 含义：如果队列已经完全空闲，就唤醒所有 waitUntilIdle 的等待者。
   */
  private resolveIdleIfNeeded(): void {
    if (!this.isIdle) return;

    const resolvers = this.idleResolvers.splice(0);
    resolvers.forEach((resolve) => resolve());
  }
}


// const queue = new ProducerConsumerQueue<string>(
//   async (task) => {
//     console.log('消费任务:', task);
//   },
//   {
//     maxSize: 10,
//     concurrency: 2,
//   }
// );

// await queue.produce('task-1');
// await queue.produce('task-2');
// await queue.waitUntilIdle(); // 等待队列空闲
// console.log('队列空闲');
