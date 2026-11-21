/** @type {import('prettier').Config} */
export default {
  // 建议的每行宽度为 120 字符；Prettier 据此选择换行，并非绝对长度上限。
  printWidth: 120,
  // 每个缩进层级占 2 个空格宽度。
  tabWidth: 2,
  // 使用空格缩进，不使用制表符（Tab）。
  useTabs: false,
  // 在需要语句结束符的位置添加分号。
  semi: true,
  // JS/TS 字符串优先使用单引号；不控制 JSX 属性的引号。
  singleQuote: true,
  // 在 ES5 支持的位置（如多行对象、数组）保留尾逗号，函数参数不添加尾逗号。
  trailingComma: 'es5',
  // 对象花括号内不加空格，例如 {name: 'demo'}，而不是 { name: 'demo' }。
  bracketSpacing: false,
  // 多行 JSX/HTML 开始标签的 > 单独换行，不放在最后一个属性所在行；不控制自闭合标签。
  bracketSameLine: false,
  // 箭头函数即使只有一个参数，也保留括号，例如 (value) => value。
  arrowParens: 'always',
  // 统一使用 LF 换行符，避免不同系统的换行风格不一致。
  endOfLine: 'lf',
  // 加载 Tailwind 插件，在格式化时按插件规则排序识别到的 Tailwind 类名。
  plugins: ['prettier-plugin-tailwindcss'],
  // 额外识别 cn()、cva() 调用中的类名字符串，使这些函数中的类名也参与排序。
  tailwindFunctions: ['cn', 'cva'],
};
