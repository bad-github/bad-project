import type {FakerLoaders} from '../common/types';

/**
 * 内置语言映射，注册不会下载 Faker。新增语言可通过 {...fakerLoaders, fr: loader} 扩展。
 * @example loadFaker({loaders: fakerLoaders, language: 'zh-TW', seed: 42});
 */
export const fakerLoaders = {
  'zh-CN': () => import('@faker-js/faker/locale/zh_CN').then((module) => module.faker),
  'zh-TW': () => import('@faker-js/faker/locale/zh_TW').then((module) => module.faker),
  en: () => import('@faker-js/faker/locale/en').then((module) => module.faker),
} satisfies FakerLoaders;
