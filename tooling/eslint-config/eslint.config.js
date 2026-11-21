import js from '@eslint/js';
import globals from 'globals';
import ignores from './ignores.js';
import withPrettier from './with-prettier.js';

export default withPrettier([{ignores}, js.configs.recommended, {languageOptions: {globals: globals.node}}]);
