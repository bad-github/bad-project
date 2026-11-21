import baseConfig from './tooling/eslint-config/base.js';
import withPrettier from './tooling/eslint-config/with-prettier.js';

export default withPrettier(baseConfig);
