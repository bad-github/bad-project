import ignores from '@workspace/eslint-config/ignores.js';
import withPrettier from '@workspace/eslint-config/with-prettier.js';
import {defineConfig, globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig(
  withPrettier([
    ...nextVitals,
    ...nextTs,
    // Override default ignores of eslint-config-next.
    globalIgnores([...ignores, 'next-env.d.ts']),
  ])
);

export default eslintConfig;
