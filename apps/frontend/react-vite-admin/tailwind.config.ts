import type {Config} from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // 在 Tailwind CSS v4 中，不再推荐使用 theme.extend 来定义自定义颜色等变量，而是推荐使用 CSS 变量
    extend: {
      // 在使用时都需要加前缀，需要在样式文件中使用@config导入此文件，否则自定义的样式不生效
      colors: {
        'custom-red': 'red',
        'customBlue': 'blue',
        'custom-color-js': 'var(--custom-color1)',
      },
    },
  },
  plugins: [],
};

export default config;
