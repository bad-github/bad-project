import type {Faker, FakerConstructor, FakerLoaders, FakerGenerationOptions, LoadFakerOptions} from '../common/types';
import {referenceDate} from '../common/validation';

// 仅缓存模块模板，缓存归属于加载器映射；不缓存 seed、日期或可变的 Faker 实例。
const templates = new WeakMap<FakerLoaders, Map<string, Promise<Faker>>>();
const normalize = (value: string) => value.trim().replaceAll('_', '-').toLowerCase();

/**
 * 将 zh/Hans/CN/SG 映射到简体，将 Hant/TW/HK/MO 映射到繁体；优先匹配显式注册的区域。
 * @example resolveFakerLocale('zh-HK', loaders); // 内置映射下返回 zh-TW。
 */
export function resolveFakerLocale(
  language: string,
  loaders: FakerLoaders,
  fallbackLanguage: string | false = 'en'
): string {
  const keys = new Map<string, string>();
  for (const key of Object.keys(loaders)) {
    const normalized = normalize(key);
    if (!normalized || keys.has(normalized)) throw new TypeError('语言加载器名称为空或存在重复别名');
    keys.set(normalized, key);
  }
  const find = (value: string) => {
    const tag = normalize(value);
    if (!tag) throw new RangeError('language 不能为空');
    const parts = tag.split('-');
    const alias =
      parts[0] === 'zh'
        ? parts.includes('hant') || (!parts.includes('hans') && parts.some((part) => ['tw', 'hk', 'mo'].includes(part)))
          ? 'zh-tw'
          : 'zh-cn'
        : parts[0];
    return keys.get(tag) ?? keys.get(alias) ?? keys.get(parts[0]);
  };
  const resolved = find(language) ?? (fallbackLanguage === false ? undefined : find(fallbackLanguage));
  if (!resolved) throw new RangeError(`未注册 Faker 语言：${language}`);
  return resolved;
}

/**
 * 从语言模板创建独立 Faker；不会改变模板或其他场景的随机状态。
 * @example const faker = createFakerInstance(template, {seed: 42, refDate: '2026-01-01T00:00:00Z'});
 */
export function createFakerInstance(template: Faker, options: FakerGenerationOptions = {}): Faker {
  const refDate = referenceDate(options.refDate ?? new Date());
  const seeds = options.seed === undefined ? undefined : Array.isArray(options.seed) ? options.seed : [options.seed];
  if (seeds && (!seeds.length || seeds.some((seed) => !Number.isSafeInteger(seed) || seed < 0))) {
    throw new RangeError('seed 必须是非负安全整数或非空整数数组');
  }
  // rawDefinitions 包含模板合并后的语言和回退定义，无需静态导入全部 Faker 语言。
  const Constructor = template.constructor as FakerConstructor;
  const faker = new Constructor({locale: template.rawDefinitions});
  if (options.seed !== undefined) faker.seed(Array.isArray(options.seed) ? [...options.seed] : options.seed);
  // 固定到创建时的时间；返回新 Date，避免引用被调用方修改。
  faker.setDefaultRefDate(() => new Date(refDate));
  return faker;
}

/**
 * 按需读取语言模板，每次返回新的 Faker。并发加载同一模板共用 Promise，失败后可重试。
 * @example
 * import {fakerLoaders} from '@workspace/mock/locales';
 * const faker = await loadFaker({loaders: fakerLoaders, language: 'zh-CN', seed: 42, refDate: '2026-01-01'});
 */
export async function loadFaker(options: LoadFakerOptions): Promise<Faker> {
  const {loaders, language = 'zh-CN', fallbackLanguage, ...generation} = options;
  const locale = resolveFakerLocale(language, loaders, fallbackLanguage);
  let cache = templates.get(loaders);
  if (!cache) {
    cache = new Map();
    templates.set(loaders, cache);
  }
  let pending = cache.get(locale);
  if (!pending) {
    pending = Promise.resolve()
      .then(() => loaders[locale]())
      .catch((error) => {
        cache.delete(locale);
        throw error;
      });
    cache.set(locale, pending);
  }
  return createFakerInstance(await pending, generation);
}
