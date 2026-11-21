import eslintConfigPrettier from 'eslint-config-prettier/flat';

// 最后追加冲突规则关闭配置；代码格式化仍由 Prettier 执行。
export default function withPrettier(configs) {
  return [...configs, eslintConfigPrettier];
}
