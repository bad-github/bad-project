import type {
  SupabaseApiClient,
  RealtimeChannel,
  RealtimeChannelOptions,
  RealtimePresenceState,
  TableSubscriptionOptions,
  TableChangeHandler,
  ManagedSubscription,
  SubscribeStatusCallback,
} from './types';

let channelSequence = 0;

/** 将频道与清理方法一起返回，重复 unsubscribe 时复用同一次 removeChannel 任务。 */
function managed(client: SupabaseApiClient, channel: RealtimeChannel): ManagedSubscription {
  let cleanup: ReturnType<SupabaseApiClient['removeChannel']> | undefined;
  return {channel, unsubscribe: () => (cleanup ??= client.removeChannel(channel))};
}

/**
 * 实时数据库、广播和在线状态订阅；每个快捷方法返回频道和可重复调用的清理方法。
 * 表变更订阅需在服务端启用对应表的 Realtime publication。
 */
export function createRealtimeApi(client: SupabaseApiClient) {
  return {
    /**
     * 创建或获取指定名称的原生频道，可继续链式监听数据库、广播和在线状态事件。
     * 只创建频道不会开始订阅，需要调用 .subscribe()；同名频道可能复用已有对象。
     * @example const channel = api.realtime.channel('room:lobby', {config: {private: true}});
     */
    channel: client.channel.bind(client),
    /**
     * 返回当前客户端管理的频道列表，可用于检查订阅或统一清理。
     * @example const channels = api.realtime.getChannels();
     */
    getChannels: client.getChannels.bind(client),
    /**
     * 取消指定频道订阅并将其移出当前客户端，不影响其他频道。
     * @returns Promise，结果为 SDK 的 ok、timed out 或 error 状态。
     * @example await api.realtime.removeChannel(channel);
     */
    removeChannel: client.removeChannel.bind(client),
    /**
     * 取消并移除当前客户端的所有频道，适用于退出应用或统一释放实时连接。
     * @returns 每个频道移除操作的 SDK 状态数组。
     * @example await api.realtime.removeAllChannels();
     */
    removeAllChannels: client.removeAllChannels.bind(client),
    /**
     * 订阅指定表的 INSERT/UPDATE/DELETE；通过 payload.eventType 区分事件。
     * @param options 表名、schema、可选行过滤表达式和频道名；schema 默认 public。
     * @param onChange 接收变更类型、new/old 记录等 SDK 事件数据。
     * @param onStatus 可选的频道连接状态回调，用于处理订阅成功、错误或超时。
     * @returns {channel, unsubscribe}；组件卸载时应调用 unsubscribe 移除频道。
     * @example
     * const subscription = api.realtime.subscribeToTable<{id: string; email: string}>(
     *   {table: 'profiles', filter: 'id=eq.alice'},
     *   payload => console.log(payload.eventType, payload.new, payload.old),
     * );
     * // React useEffect cleanup 中：void subscription.unsubscribe();
     */
    subscribeToTable<Row extends Record<string, unknown> = Record<string, unknown>>(
      options: TableSubscriptionOptions,
      onChange: TableChangeHandler<Row>,
      onStatus?: SubscribeStatusCallback
    ): ManagedSubscription {
      if (!options.table.trim()) throw new TypeError('table 不能为空');
      const schema = options.schema ?? 'public';
      const channel = client.channel(options.channelName ?? `table:${schema}:${options.table}:${++channelSequence}`);
      channel
        .on(
          'postgres_changes',
          {event: '*', schema, table: options.table, ...(options.filter ? {filter: options.filter} : {})},
          onChange
        )
        .subscribe(onStatus);
      return managed(client, channel);
    },
    /**
     * 订阅广播消息，回调接收 message.payload；泛型由调用方按业务协议指定。
     * @param channelName 广播所在的频道名。
     * @param event 要监听的广播事件名，与发送端的 event 对应。
     * @param onMessage 接收消息业务内容，不包含外层 event/type 字段。
     * @param options 原生频道选项，可配置私有频道和广播行为。
     * @param onStatus 可选订阅状态回调；需要发送消息时应等待 SUBSCRIBED。
     * @returns {channel, unsubscribe}，channel 可用于发送广播。
     * @example
     * const subscription = api.realtime.subscribeToBroadcast<{text: string}>(
     *   'room:lobby', 'message', payload => console.log(payload.text),
     * );
     * // 频道 SUBSCRIBED 后发送：
     * await subscription.channel.send({type: 'broadcast', event: 'message', payload: {text: 'Hello'}});
     * await subscription.unsubscribe();
     */
    subscribeToBroadcast<Payload = unknown>(
      channelName: string,
      event: string,
      onMessage: (payload: Payload) => void,
      options?: RealtimeChannelOptions,
      onStatus?: SubscribeStatusCallback
    ): ManagedSubscription {
      const channel = client.channel(channelName, options);
      channel.on('broadcast', {event}, (message) => onMessage(message.payload as Payload)).subscribe(onStatus);
      return managed(client, channel);
    },
    /**
     * 订阅在线状态快照；进入/离开可通过原生 channel.on('presence', ...) 继续监听。
     * @param channelName 需要监听在线用户的频道名。
     * @param onSync 每次 presence 同步后接收该频道的完整在线状态快照。
     * @param options 原生频道选项，例如 presence.key。
     * @param onStatus 可选订阅状态回调；应在 SUBSCRIBED 后调用 channel.track 上报自身状态。
     * @returns {channel, unsubscribe}，可通过 channel.track/untrack 管理自身在线状态。
     * @example
     * const subscription = api.realtime.subscribeToPresence('room:lobby', state => console.log(state));
     * // 频道 SUBSCRIBED 后：await subscription.channel.track({userId: 'alice'});
     * // 离开时：await subscription.channel.untrack(); await subscription.unsubscribe();
     */
    subscribeToPresence(
      channelName: string,
      onSync: (state: RealtimePresenceState) => void,
      options?: RealtimeChannelOptions,
      onStatus?: SubscribeStatusCallback
    ): ManagedSubscription {
      const channel = client.channel(channelName, options);
      channel.on('presence', {event: 'sync'}, () => onSync(channel.presenceState())).subscribe(onStatus);
      return managed(client, channel);
    },
  };
}
