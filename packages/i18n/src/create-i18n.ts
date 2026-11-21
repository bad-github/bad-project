import i18next from 'i18next';
import type {TFunction} from 'i18next';
import {initReactI18next} from 'react-i18next';
import {createLocaleBackend} from './locale-backend';
import {cloneResource} from './resource';
import type {CreateI18nOptions, CreateI18nResult} from './types';

export const defaultLng = 'zh';

/**
 * 优先读取 localStorage.i18nextLng，其次读取 HTML lang，最后使用 zh。
 * 服务端直接返回 zh；浏览器存储不可用时继续使用后续回退来源。
 * @example
 * const lng = detectLanguage();
 * const {i18n, ready} = createI18n({lng, loaders: localeLoaders});
 * await ready;
 */
export const detectLanguage = (): string => {
  if (typeof window === 'undefined') return defaultLng;
  try {
    const saved = window.localStorage.getItem('i18nextLng');
    if (saved) return saved;
  } catch {
    // 浏览器可能因隐私设置或安全策略禁止访问 localStorage。
  }
  return document.documentElement.lang || defaultLng;
};

/**
 * 创建实例并复制语言资源，后续修改不会污染其他实例或传入的资源对象。
 * 翻译和切换语言前应等待 ready；React 应用通过 I18nextProvider 绑定该实例。
 * @example
 * import {localeLoaders} from '@workspace/i18n/locales';
 * const {i18n, ready} = createI18n({loaders: localeLoaders, lng: 'en', fallbackLng: 'zh'});
 * await ready;
 * i18n.t('notify.viewAll'); // 'View All'
 * await i18n.changeLanguage('zh');
 * i18n.t('notify.viewAll'); // '查看所有'
 * // 新业务命名空间在 loaders 中注册，但不会随默认 translation 一起加载。
 * // await i18n.loadNamespaces('order');
 * // i18n.t('order:title');
 * // 切换/加载失败通过 i18next 的回调或 failedLoading 事件获取：
 * await i18n.changeLanguage('en', error => {
 *   if (error) console.error('语言加载失败，可再次切换重试', error);
 * });
 * @example
 * const {i18n, ready} = createI18n({
 *   lng: 'fr',
 *   defaultNS: 'user',
 *   resources: {fr: {user: {hello: 'Bonjour {{name}}'}}},
 * });
 * await ready;
 * i18n.t('hello', {name: 'Alice'}); // 'Bonjour Alice'
 */
export const createI18n = (options: CreateI18nOptions): CreateI18nResult => {
  // 显式选择资源来源，核心入口无需静态导入所有语言，避免破坏按需分包。
  if (!options || (!options.loaders && !options.resources)) {
    throw new Error('createI18n 需要显式传入 loaders 或 resources');
  }
  const {loaders, resources, ...config} = options;
  // 每次创建独立实例，语言状态、资源存储和 backend 加载状态均按实例隔离。
  const instance = i18next.createInstance();
  // backend 按语言和命名空间查找加载器；初始化、切换语言及 loadNamespaces 都会复用它。
  if (loaders) instance.use(createLocaleBackend(loaders));
  // 接入 React；组件树仍应通过 I18nextProvider 指定所属实例。
  instance.use(initReactI18next);
  // i18next 原生 init Promise 在资源加载失败时也可能完成，因此用回调构造可拒绝的 ready。
  const ready = new Promise<TFunction>((resolve, reject) => {
    instance.init(
      {
        ...config,
        // 优先使用显式语言，否则按浏览器偏好检测；缺失文案回退到配置的语言，默认中文。
        lng: config.lng ?? detectLanguage(),
        fallbackLng: config.fallbackLng ?? defaultLng,
        // 只加载初始需要的命名空间，避免把加载器中注册的业务包一次性全部加载。
        ns: config.ns ?? (typeof config.defaultNS === 'string' ? [config.defaultNS] : ['translation']),
        // 默认支持已注册资源或加载器的语言；调用方可进一步限定支持范围。
        supportedLngs: config.supportedLngs ?? Object.keys({...resources, ...loaders}),
        // 深拷贝预置资源，后续修改不会污染调用方对象或其他实例。
        resources: cloneResource(resources ?? {}),
        // 即使传入了 resources（包括空对象），仍允许 backend 补充尚未加载的语言包。
        partialBundledLanguages: Boolean(loaders),
        // 默认不自动重试，失败后由下次显式调用重试；调用方也可开启后台重试。
        maxRetries: config.maxRetries ?? 0,
        // React 的文本渲染会转义插值结果，默认关闭 i18next 的重复转义，保留自定义覆盖能力。
        interpolation: {escapeValue: false, ...config.interpolation},
      },
      (error, t) => {
        // 当前语言和回退语言的初始资源加载结束后结算 ready，保留各语言包的具体错误。
        if (error) reject(new AggregateError(Array.isArray(error) ? error : [error], '语言资源初始化失败'));
        else resolve(t);
      }
    );
  });
  return {i18n: instance, ready};
};
