import type {AppLocale} from './locales';
import type {AppMessages} from './messages';

/**
 * 扩展 next-intl 的全局 AppConfig 类型。
 * TypeScript 会自动加载该声明文件，业务代码不需要手动导入它。
 *
 * 配置后可以获得：
 * - locale 仅允许 AppLocale 中声明的三种语言；
 * - useTranslations/getTranslations 的命名空间和翻译键自动补全；
 * - 拼错或遗漏翻译键时的编译错误。
 */
declare module 'next-intl' {
  interface AppConfig {
    Locale: AppLocale;
    Messages: AppMessages;
  }
}
