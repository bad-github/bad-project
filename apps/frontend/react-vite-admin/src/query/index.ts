import {QueryClient} from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * always: 窗口聚焦时重新请求（如果数据陈旧)，默认
       * false: 关闭窗口聚焦重新请求
       */
      refetchOnWindowFocus: false,
      enabled: true, // 自动请求，默认
      retry: 3, // 失败时重试次数，默认
      retryDelay: function (attemptIndex) {
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      }, // 每次重试的延迟，默认
      staleTime: 0, // 数据立刻变为陈旧（重新挂载/聚焦会重新请求），默认
      refetchOnMount: true, // 组件挂载时是否重新请求（如果数据陈旧），默认
      refetchOnReconnect: 'always', // 网络恢复时是否重新请求，默认
      refetchInterval: false, // 定时轮询间隔，不启用，默认
      refetchIntervalInBackground: false, // 是否在后台也轮询，否，默认
      throwOnError: false, // 是否让 queryFn 的错误直接抛出，否，默认
      gcTime: 5 * 60 * 1000, // 缓存保留时间，默认
      networkMode: 'online', // 网络模式，默认
    },
    mutations: {
      throwOnError: false, // 默认，会在useMutation的onError回调中捕获到错误，不会抛出来。即try mutation.mutate时catch无法捕获
      onMutate: () => {}, // 乐观更新前回调
      onSuccess: () => {}, // 成功回调
      onError: () => {}, // 失败回调
      onSettled: () => {}, // 成功/失败回调
    },
  },
});

/* const mutation = useMutation({
  mutationFn: (newTodo) => fetch('/api/todos', {
    method: 'POST',
    body: JSON.stringify(newTodo),
  }).then(res => res.json()),

  // mutation 开始执行前调用
  onMutate: async (newTodo) => {
    // (1)取消当前所有与 todos 相关的请求，防止数据竞争：让对应的 Query 暂停触发后续的状态更新（即使请求还在进行，也不再更新缓存）
    await queryClient.cancelQueries({ queryKey: ['todos'] });

    // (2)读取旧数据
    const previousTodos = queryClient.getQueryData(['todos']);

    // (3)乐观更新：立即更新 UI
    queryClient.setQueryData(['todos'], (old) => [
      ...(old || []),
      { id: Date.now(), ...newTodo },
    ]);

    // (4)返回上下文，方便出错时回滚
    return { previousTodos };
  },

  // mutation 失败时回滚
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previousTodos);
  },

  // 成功或失败都触发
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
}); */

export default queryClient;