import {StorageKeys} from '../../utils/storage-keys';
import {LS} from '@/utils/storage';
import {GraphQLWsLink} from '@apollo/client/link/subscriptions';
import {createClient} from 'graphql-ws';

// graphql 订阅
export const wsLink = new GraphQLWsLink(
  createClient({
    url: '/graphql',
    lazy: true, // 只有真正有订阅时才建立连接
    // 不会自动发送cookies，需要使用connectionParams，会将其中的数据传递给服务器
    // todo，校验重试次数
    retryAttempts: 2,
    // 支持token更新
    connectionParams: async () => ({
      Authorization: `Bearer ${LS.get(StorageKeys.token)}`,
      selfKey: 'selfValue',
    }),
    // connectionParams: {
    //   /**
    //    * 服务端同时支持cookie和header验证
    //    * cookie方式：credentials，服务端对request作处理了
    //    * header方式：由于服务端设置了httpOnly，Cookies.get('token')获取到的值是undefined。所以采用config.headers.Authorization = `Bearer ${token}`;
    //    */
    //   Authorization: `Bearer ${LS.get(StorageKeys.token)}`,
    //   selfKey: 'selfValue',
    // },
  })
);
