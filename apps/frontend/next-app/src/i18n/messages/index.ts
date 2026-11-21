import {LOCALE, type AppLocale} from '../locales';
import enUS from './enUS';
import zhCN from './zhCN';
import zhTW from './zhTW';

/**
 * 保留默认语言的对象键结构，同时把具体文案字面量拓宽为 string。
 * 这样其他语言必须包含相同的翻译键，但不需要包含相同的中文文案。
 */
type WidenMessageValues<T> = T extends string ? string : {[Key in keyof T]: WidenMessageValues<T[Key]>};

// 以默认语言作为所有语言都必须遵循的消息结构基准。
export type AppMessages = WidenMessageValues<typeof zhCN>;

export const messages = {
  [LOCALE.zhCN]: zhCN,
  [LOCALE.zhTW]: zhTW,
  [LOCALE.enUS]: enUS,
} as const satisfies Record<AppLocale, AppMessages>;
