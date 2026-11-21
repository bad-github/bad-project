import {ApolloClient, ApolloLink, InMemoryCache} from '@apollo/client';
import {OperationTypeNode} from 'graphql';
import {requestLink} from './link/request-link';
import {responseLink} from './link/response-link';
import {errorLink} from './link/error-link';
import {wsLink} from './link/ws-link';
import {httpLink} from './link/http-link';
import {retryLink} from './link/retry-link';

// 可以嵌套使用不同版本的link（比如uri不同）
const httpSplitLink = ApolloLink.split(
  (operation) => {
    return operation.getContext().version === 'v1';
  },
  httpLink,
  httpLink
);

// todo，校验每个link及其顺序
// Link Pipeline 概念，所以link都是在同层级
// split 之前是“逻辑层”，split 之后是“路由层”，所以responseLink在httpSplitLink之前
const httpChain = ApolloLink.from([requestLink, retryLink, errorLink, responseLink, httpSplitLink]);

const link = ApolloLink.split(
  // 根据条件决定使用哪个link，true ? leftLink : rightLink
  ({operationType}) => {
    return operationType === OperationTypeNode.SUBSCRIPTION;
  },
  wsLink,
  httpChain
);

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});
