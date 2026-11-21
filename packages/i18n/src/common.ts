import type {i18n, TOptions} from 'i18next';

/**
 * 使用已初始化的实例翻译；values 支持插值、语言及命名空间等 i18next 选项。
 * @example
 * getLngText(instance, 'notify.viewAll');
 * getLngText(instance, 'notify.minutesAgo', {minutes: 5, lng: 'en'});
 * getLngText(instance, 'hello', {ns: 'user', name: 'Alice'});
 */
export function getLngText(instance: i18n, key: string, values?: TOptions) {
  return instance.t(key, values);
}
