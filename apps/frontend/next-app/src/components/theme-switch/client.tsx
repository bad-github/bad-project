'use client';

import {ThemeSwitch, type ThemeSwitchProps} from './index';
import {withNoSSR} from '../client-only/with-no-ssr';

const ThemeSwitchNoSSR = withNoSSR(ThemeSwitch);

/**
 * 
 * 服务端父组件包含客户端组件，则封装客户端组件，直接引用该组件
 * 客户端父组件包含服务端组件，则通过children引用服务端组件，例如ThemeProvider
 * 对于第三方库若是客户端组件，若服务端组件想引用，则先将三方库封装至一个单独的客户端组件，然后在服务端组件中引用，例如@badnpm/ui中的组件
 */

export default function ThemeSwitchClient(props: ThemeSwitchProps) {
  // return <ThemeSwitchMounted />
  return <ThemeSwitchNoSSR {...props} />;
}
