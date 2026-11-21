import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getTranslations} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {SITE_URL} from '@/config/site';
import type {AppLocale} from '@/i18n/locales';
import {defaultLocale, localePrefixes, routing} from '@/i18n/routing';

type LocalizedMetadataProps = {
  params: Promise<{locale: string}>;
};

// 只有包含 metadata.title 和 metadata.description 的翻译模块才能用于页面 SEO。
// Common 保存首页文案，其余命名空间保存对应子页面文案。
type SeoNamespace = 'Common' | 'Portfolio' | 'Skill' | 'Showcase';

/**
 * 生成同一页面在各语言下的完整地址。
 * routePath 只填写语言前缀之后的部分，例如 `/portfolio`；首页填写空字符串。
 * 以后重命名页面路由时，需要同步修改调用此函数时传入的 routePath。
 *
 * `x-default` 是 hreflang 的标准兜底值：当搜索引擎无法匹配用户语言/地区时，
 * 默认推荐简体中文页面（即 routing.ts 中配置的 defaultLocale）。
 */
export function createLanguageAlternates(routePath: string): Record<string, string> {
  const languages = Object.entries(localePrefixes).map(([locale, prefix]) => [
    locale,
    `${SITE_URL}${prefix}${routePath}`,
  ]);

  return {
    ...Object.fromEntries(languages),
    'x-default': `${SITE_URL}${localePrefixes[defaultLocale]}${routePath}`,
  };
}

/**
 * 
 * link元素的可用属性如下
 * - rel: 定义了所链接的资源与当前文档的关系，
 *    - canonical: 当前文档的首要 URL，有助于搜索引擎减少重复内容。
 *    - alternate: 当前文档的替代描述，其含义取决于其他属性的值。
 * - href: 包含一个字符串，该字符串是与链接相关联的 URL。每个 <link> 元素都必须包含 href 属性或 imagesrcset 属性中的一个或两个。
 * - hreflang: 用于指示页面的语言和地理定位。浏览器可以利用这一提示来选择更合适的页面或提高搜索引擎优化。
 * 
 * 
 * 
 * 为当前语言页面生成 canonical 和 hreflang 配置。
 * Next.js 会把返回值转换为页面 <head> 中的以下标签
 * - <link rel="canonical" href="https://next-app-gray-six.vercel.app/zh">: 声明当前页面的正式地址，减少重复 URL 对收录的干扰。解决"多个网址中哪个是正版"。不同语言href不一样
 * - <link rel="alternate" hreflang="zh-CN" href="https://next-app-gray-six.vercel.app/zh">:声明同一内容的其他语言版本。解决"同一内容应该给不同语言或地区的用户看哪个版本"。
 * - <link rel="alternate" hreflang="en-US" href="https://next-app-gray-six.vercel.app/en">
 *
 * 该函数不会自己生成标签，必须由页面或布局的 generateMetadata 调用并返回。
 */
export function createPageAlternates(
  locale: AppLocale,
  routePath: string,
): NonNullable<Metadata['alternates']> {
  return {
    canonical: `${SITE_URL}${localePrefixes[locale]}${routePath}`,
    languages: createLanguageAlternates(routePath),
  };
}

/**
 * 创建某个多语言页面所需的 generateMetadata 函数。
 * 它集中完成语言校验以及 canonical、hreflang 的生成，避免每个页面重复相同代码。
 *
 * 页面布局只需导出一行，例如：
 * export const generateMetadata = createLocalizedMetadata('/portfolio', 'Portfolio');
 *
 * 这行声明仍然有必要，因为 Next.js 不会把当前 pathname 传给 generateMetadata，
 * 每个页面必须明确告诉公共函数自己的正式路径。以后修改路由名称时同步修改该路径即可。
 * namespace 用于读取当前语言翻译文件中的 metadata.title 和 metadata.description；
 * 这些文字只用于浏览器标题和搜索摘要，不会直接显示在页面正文中。
 */
export function createLocalizedMetadata(routePath: string, namespace: SeoNamespace) {
  return async function generateMetadata({params}: LocalizedMetadataProps): Promise<Metadata> {
    // 获取动态路由[locale]
    const {locale} = await params;

    if (!hasLocale(routing.locales, locale)) {
      notFound();
    }

    const t = await getTranslations({locale, namespace});

    return {
      title: t('metadata.title'),
      description: t('metadata.description'),
      alternates: createPageAlternates(locale, routePath),
    };
  };
}
