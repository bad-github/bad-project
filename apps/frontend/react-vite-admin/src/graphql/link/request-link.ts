import {StorageKeys} from '../../utils/storage-keys';
import {LS} from '@/utils/storage';
import {ApolloLink, Observable} from '@apollo/client';

/**
 * 请求拦截
 * operation: 通过链接传递的 GraphQL 请求的信息的操作对象
 * forward: 用于执行链中下一个环节的函数
 */
export const requestLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    const token = LS.get(StorageKeys.token);
    operation.setContext({start: new Date()});
    operation.setContext(({headers = {}}) => ({
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : '',
      },
    }));
    const sub = forward(operation).subscribe({
      next: observer.next.bind(observer),
      complete: observer.complete.bind(observer),
      error: async (err) => {
        // token 过期处理
        if (err?.statusCode === 401) {
          // 可异步更新
          const newToken = LS.get(StorageKeys.token);
          LS.set(StorageKeys.token, newToken);
          operation.setContext(({headers = {}}) => ({
            headers: {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            },
          }));
          forward(operation).subscribe(observer);
          return;
        }
        observer.error(err);
      },
    });
    return () => sub.unsubscribe();
  });
});
