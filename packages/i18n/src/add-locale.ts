import type {i18n} from 'i18next';
import type {LocaleResource} from './types';

/**
 * 添加单个语言包
 * @param i18n 实例
 * @param lng 语言
 * @param ns 命名空间
 * @param resource 语言包
 * @param deep 是否合并对象
 * @param overwrite 是否覆盖旧值
 * @example
 * addLocale(instance, 'en', 'user', {hello: 'Hello {{name}}'});
 * instance.t('user:hello', {name: 'Alice'}); // 'Hello Alice'
 * // 深度合并，但保留已经存在的文案。
 * addLocale(instance, 'en', 'user', {hello: 'New', title: 'User'}, true, false);
 */
export function addLocale(
  i18n: i18n,
  lng: string,
  ns: string,
  resource: LocaleResource,
  deep = true,
  overwrite = true
) {
  i18n.addResourceBundle(lng, ns, resource, deep, overwrite);
}
/**
 * 仅在语言和命名空间不存在时注册；已有命名空间整体跳过，不补写缺失的键。
 * @example
 * safeAddLocale(instance, 'en', 'user', {hello: 'Hello'});
 * safeAddLocale(instance, 'en', 'user', {hello: 'Changed', title: 'User'});
 * instance.t('user:hello'); // 'Hello'
 * instance.exists('user:title'); // false
 */
export function safeAddLocale(
  i18n: i18n,
  lng: string,
  ns: string,
  resource: LocaleResource,
  deep = true,
  overwrite = true
) {
  if (!i18n.hasResourceBundle(lng, ns)) {
    addLocale(i18n, lng, ns, resource, deep, overwrite);
  }
}
