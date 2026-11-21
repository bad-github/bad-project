import {fetchRequest} from './fetch';
import {kyGet, kyPost} from './ky';

export function Success<T>(data: T, message = 'ok', code = 200) {
  return {code, message, data};
}

export function Fail(message = 'error', data = null) {
  return {code: 500, message, data};
}

export function testGet() {
  // return fetchRequest('/test/get', {params: {name: '蔡徐坤'}});
  return kyGet('common/get', {searchParams: {name: '蔡徐坤'}});
}

export function testHttpErr() {
  return kyGet('test/get/http-err');
}

export function testServerErr() {
  return kyGet('common/error');
}

export function testPost() {
  // return fetchRequest('/test/post', {method: 'POST', body: {name: '蔡徐坤'}});
  return kyPost('common/post', {json: {name: '蔡徐坤'}});
}

export function testDelay() {
  return kyPost('common/delay', {json: {seconds: 9}});
}

/**
 * 是浏览器中异步 HTTP 请求，收到 302 后，都会在该请求内部继续请求 Location，不会把当前页面导航过去
 * 方案一：用浏览器导航 window.location.assign('/g/api/common/redirect-swagger')
 * 方案二：前端拿到 JSON 结果后（需要后端改造解=接口），主动调用 window.location.assign() 跳转
 *    - 在不改造接口的情况下，需要在请求封装里面处理，判断是否是重定向
 */
export function testRedirect() {
  return kyGet('common/redirect-swagger');
}

export function generateAdminToken() {
  return fetchRequest('/auth/login/admin', {method: 'POST'});
}

export function generateKarinaToken() {
  return fetchRequest('/auth/login/karina', {method: 'POST'});
}

export function clearToken() {
  return fetchRequest('/auth/logout', {method: 'POST'});
}

export function receiveSocket() {
  return fetchRequest('/socket/send');
}

// 通过接口调用主动让服务端推送
export function pushMsg() {
  return kyPost('notifications/demo/message');
}
