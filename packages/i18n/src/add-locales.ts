import type {i18n} from 'i18next';
import {addLocale, safeAddLocale} from './add-locale';
import type {LocaleResources} from './types';

/**
 * 添加多个语言和命名空间的资源；deep、overwrite 与 addLocale 相同。
 * @example
 * addLocales(instance, {
 *   en: {user: {hello: 'Hello'}, order: {title: 'Orders'}},
 *   zh: {user: {hello: '你好'}, order: {title: '订单'}},
 * });
 * instance.t('order:title', {lng: 'zh'}); // '订单'
 */
export function addLocales(instance: i18n, locales: LocaleResources, deep = true, overwrite = true) {
  for (const [lng, namespaces] of Object.entries(locales)) {
    for (const [ns, resource] of Object.entries(namespaces)) {
      addLocale(instance, lng, ns, resource, deep, overwrite);
    }
  }
}

/**
 * 仅添加尚不存在的语言包；已有命名空间保持原样。
 * @example
 * addLocale(instance, 'en', 'user', {hello: 'Original'});
 * safeAddLocales(instance, {
 *   en: {user: {hello: 'Ignored'}, order: {title: 'Orders'}},
 * });
 * instance.t('user:hello'); // 'Original'
 * instance.t('order:title'); // 'Orders'
 */
export function safeAddLocales(instance: i18n, locales: LocaleResources, deep = true, overwrite = true) {
  for (const [lng, namespaces] of Object.entries(locales)) {
    for (const [ns, resource] of Object.entries(namespaces)) {
      safeAddLocale(instance, lng, ns, resource, deep, overwrite);
    }
  }
}
