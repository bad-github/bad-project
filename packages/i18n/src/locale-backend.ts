import type {BackendModule} from 'i18next';
import {cloneResource} from './resource';
import type {LocaleLoaders} from './types';

/** 每个实例创建自己的 backend；i18next 负责按语言和命名空间缓存、合并在途请求。 */
export function createLocaleBackend(loaders: LocaleLoaders): BackendModule {
  return {
    type: 'backend',
    init() {},
    read(lng, ns, callback) {
      const loader = Object.hasOwn(loaders, lng) && Object.hasOwn(loaders[lng], ns) ? loaders[lng][ns] : undefined;
      if (!loader) {
        callback(new Error(`未注册语言包加载器：${lng}/${ns}`), false);
        return;
      }
      Promise.resolve()
        .then(loader)
        .then((resource) => cloneResource(resource))
        .then(
          (resource) => {
            // import() 会缓存模块，不能把模块中的原始对象直接交给实例存储。
            callback(null, resource);
          },
          (error) => {
            // true 表示错误可重试；maxRetries 默认设为 0，交由下次显式调用重试。
            callback(error instanceof Error ? error : new Error(String(error)), true);
          }
        );
    },
  };
}
