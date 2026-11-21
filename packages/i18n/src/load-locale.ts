import type {i18n} from 'i18next';
import {addLocale, safeAddLocale} from './add-locale';
import {loadOnce} from './resource';
import type {LocaleLoader} from './types';

/**
 * 加载器必须返回资源对象；动态导入默认导出时需显式取 default。
 * 每次调用都会执行 loader，并按 deep、overwrite 合并资源。
 * @example
 * await loadLocale(instance, 'en', 'notify', () =>
 *   import('./locales/en-us/notify').then(m => m.default)
 * );
 * instance.t('notify:viewAll'); // 'View All'（notify 为命名空间）
 */
export async function loadLocale(
  instance: i18n,
  lng: string,
  ns: string,
  loader: LocaleLoader,
  deep = true,
  overwrite = true
) {
  addLocale(instance, lng, ns, await loader(), deep, overwrite);
}

/**
 * 仅加载缺失的命名空间；同一实例、语言和命名空间共用在途任务。
 * 第一个调用的加载器和合并参数生效；失败后清理任务，后续调用可重试。
 * @example
 * const loader = () => import('./locales/en-us/notify').then(m => m.default);
 * await Promise.all([
 *   safeLoadLocale(instance, 'en', 'notify', loader),
 *   safeLoadLocale(instance, 'en', 'notify', loader),
 * ]); // loader 只执行一次。
 * await safeLoadLocale(instance, 'en', 'notify', loader); // 已存在，跳过加载。
 */
export function safeLoadLocale(
  instance: i18n,
  lng: string,
  ns: string,
  loader: LocaleLoader,
  deep = true,
  overwrite = true
): Promise<void> {
  if (instance.hasResourceBundle(lng, ns)) return Promise.resolve();
  return loadOnce(instance, JSON.stringify([lng, ns]), async () => {
    const resource = await loader();
    // 等待期间也可能由其他途径添加资源，因此注册前再次检查。
    safeAddLocale(instance, lng, ns, resource, deep, overwrite);
  });
}
