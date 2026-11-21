import type {i18n, InitOptions, TFunction} from 'i18next';
import type {localeLoaders} from './locales';

/**
 * 内置语言为 en、zh；自定义资源仍可通过 CreateI18nOptions 使用其他语言。
 * @example
 * const lng: SupportedLang = 'zh';
 */
export type SupportedLang = keyof typeof localeLoaders;

/** 基准语言结构；仅用于类型声明，不会将中文文案打入运行时入口。 */
export type TranslationResource = typeof import('./locales/zh-cn').default;

/** 语言资源是由可序列化值组成的树，也支持 returnObjects 使用的数组。 */
export type LocaleValue = string | number | boolean | null | LocaleResource | LocaleValue[];
/**
 * 单个命名空间内的资源，可嵌套对象和数组。
 * @example
 * const user: LocaleResource = {hello: 'Hello {{name}}', actions: {save: 'Save'}};
 */
export type LocaleResource = {[key: string]: LocaleValue};
/**
 * 多语言资源结构：语言 → 命名空间 → 文案。
 * @example
 * const locales: LocaleResources = {en: {user: {hello: 'Hello'}}, zh: {user: {hello: '你好'}}};
 */
export type LocaleResources = Record<string, Record<string, LocaleResource>>;
/** 单包加载器返回资源对象；默认导出需使用 .then(m => m.default) 提取。 */
export type LocaleLoader = () => Promise<LocaleResource>;
/** 多包加载器返回语言与命名空间映射；具名导出需显式提取，例如 .then(m => m.resources)。 */
export type LocaleResourcesLoader = () => Promise<LocaleResources>;

/**
 * 按语言、命名空间注册加载器；每个加载器返回资源数据。
 * @example
 * const loaders: LocaleLoaders = {
 *   en: {
 *     translation: () => import('./locales/en-us').then(m => m.default),
 *     order: async () => ({title: 'Orders'}),
 *   },
 * };
 */
export type LocaleLoaders = Record<string, Record<string, LocaleLoader>>;

/** 显式提供加载器或资源，支持少量首屏资源与按需资源混用。 */
export type CreateI18nOptions = Omit<InitOptions, 'resources' | 'partialBundledLanguages'> &
  ({loaders: LocaleLoaders; resources?: LocaleResources} | {resources: LocaleResources; loaders?: LocaleLoaders});
export interface CreateI18nResult {
  i18n: i18n;
  ready: Promise<TFunction>;
}

/** 内部加载任务键：单包按语言和命名空间，多包按加载器引用。 */
export type LocaleLoadKey = string | LocaleResourcesLoader;
