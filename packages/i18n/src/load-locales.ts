import type {i18n} from 'i18next';
import {addLocales, safeAddLocales} from './add-locales';
import {loadOnce} from './resource';
import type {LocaleResourcesLoader} from './types';

/**
 * 加载器返回 {语言: {命名空间: 资源}}；显式提取模块的资源导出。
 * 每次调用都会执行 loader，并按 deep、overwrite 合并资源。
 * @example
 * await loadLocales(instance, () => import('./resources').then(m => m.resources));
 * instance.t('notify.viewAll', {lng: 'en'}); // 'View All'（默认 translation 命名空间）
 */
export async function loadLocales(instance: i18n, loader: LocaleResourcesLoader, deep = true, overwrite = true) {
  addLocales(instance, await loader(), deep, overwrite);
}

/**
 * 同一实例下，相同加载器引用共用在途任务；只注册缺失的命名空间。
 * 需复用同一个函数引用；两个分别创建的箭头函数不会合并。
 * 任务结束后清理缓存，后续调用仍会加载，但不会覆盖已有命名空间。
 * @example
 * const loader = () => import('./resources').then(m => m.resources);
 * await Promise.all([
 *   safeLoadLocales(instance, loader),
 *   safeLoadLocales(instance, loader),
 * ]); // loader 只执行一次；换一个 instance 则独立加载。
 */
export function safeLoadLocales(
  instance: i18n,
  loader: LocaleResourcesLoader,
  deep = true,
  overwrite = true
): Promise<void> {
  return loadOnce(instance, loader, async () => {
    safeAddLocales(instance, await loader(), deep, overwrite);
  });
}
