import {checkUsername} from './api';
import {validateUsernameFormat} from './form-model';

/**
 * 每个表单实例拥有自己的查重缓存，不在模块全局跨用户/跨页面共享结果。
 * isValid 重算也会执行校验；缓存既保存成功/占用结果，也保存同值正在进行的 Promise。
 * 仅用户名变化或请求失败时重新请求。该缓存用于减少界面重复检查，最终保存仍独立查重。
 */
export function createUsernameValidator(getCurrentValue: () => string) {
  let latest: {value: string; promise: Promise<true | string>; retry: boolean} | undefined;
  return async (value: string): Promise<true | string> => {
    // 相同值直接复用在途或已完成 Promise，避免多个字段同时校验造成请求风暴。
    if (!latest || latest.value !== value || latest.retry) {
      const format = validateUsernameFormat(value);
      const next = {value, promise: Promise.resolve<true | string>(true), retry: false};
      next.promise =
        format === true
          ? checkUsername(value)
              .then((available): true | string => available || '该用户名已被占用')
              .catch(() => {
                // 请求失败不是“用户名被占用”，不能永久缓存，否则用户无法正常重试。
                next.retry = true;
                return '查重失败，请重试';
              })
          : Promise.resolve(format);
      latest = next;
    }
    let request = latest;
    let result = await request.promise;
    // A、B 两个请求先后发出，返回顺序却不固定；旧调用也等待最新请求，
    // 避免旧的成功结果清除新名字的占用错误，或旧错误覆盖新名字的成功结果。
    while (request !== latest) {
      request = latest;
      result = await request.promise;
    }
    // 当前输入已改变但还没有新校验时，不把旧输入的错误写回当前字段。
    // 返回 true 只是丢弃过期结果，并不保证新输入有效；下次失焦/提交还会校验新值。
    return getCurrentValue() === request.value ? result : true;
  };
}
