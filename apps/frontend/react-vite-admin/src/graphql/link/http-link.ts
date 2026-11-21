import {HttpLink} from '@apollo/client';


export const httpLink = new HttpLink({
  uri: '/graphql',
  /**
   * omit：默认，从不发送 cookies
   * same-origin：仅当前端与后端同源时发送cookies，/graphql 经过了 vite 代理变成同源的了
   * include：总是发送 cookies（即使是跨域请求）
   */
  credentials: 'include',
});
