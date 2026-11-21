// @workspace/utils 需要打包出 d.ts
import {text, browser} from '@workspace/utils';

console.log(window, globalThis);
const result1 = text.getTextWidth('你干嘛');
const result2 = browser.getSafeProps({a: 1, b: 2}, {excludeKeys: ['a']});
console.log(result1, result2);
