import {browser, color, file, number, regex, text, time, tree, ShortcutProvider} from '../src';
import type {
  UploadProgressOptions,
  NanosecondFormatOptions,
  ColorFormat,
  SafePropsOptions,
  ShortcutAction,
} from '../src';

// 只参与类型检查，不在运行时执行，也不进入库构建产物。
export function checkUtilityContracts() {
  const uploadOptions = {total: 100} satisfies UploadProgressOptions;
  file.uploadProgress(uploadOptions) satisfies Promise<void>;
  const formatOptions = {unit: 's', fractionDigits: 9} satisfies NanosecondFormatOptions;
  time.formatNsFromDuration('123', formatOptions) satisfies string;
  const colorFormat = 'hex' satisfies ColorFormat;
  color.randomColor(colorFormat) satisfies string;
  const safePropsOptions = {excludeKeys: ['hidden']} satisfies SafePropsOptions;
  browser.getSafeProps({}, safePropsOptions);
  const action = 'globalSearch' satisfies ShortcutAction;
  new ShortcutProvider().getHotkey(action);
  browser.canIUse('window') satisfies boolean;
  file.isFileSizeInRange(10, 100) satisfies boolean;
  file.formatByteSize(1024) satisfies string;
  number.isNumeric('123') satisfies boolean;
  text.getNextChar('A') satisfies string;
  color.randomColor() satisfies string;
  regex.test(regex.IPv4, '127.0.0.1') satisfies boolean;
  tree.searchTree([], 'test').parentKeys satisfies Set<string>;
  time.sleep(123) satisfies Promise<number>;
  time.sleep({id: 'a'}) satisfies Promise<{id: string}>;
  time.sleep(undefined, 2000) satisfies Promise<undefined>;
  // @ts-expect-error 显式返回类型必须与传入的数据一致。
  time.sleep<string>(123);

  const shortcuts = new ShortcutProvider();
  shortcuts.getHotkey('globalSearch');
  // @ts-expect-error 不接受没有定义的操作名。
  shortcuts.getHotkey('unknown-action');

  const relative = time.formatRelativeDate(0);
  if (relative.unit === 'date') relative.value satisfies Date;
  else if (relative.unit === 'invalid') relative.value satisfies '';
  else relative.value satisfies number;
}
