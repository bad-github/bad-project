import type {ColorTheme} from '@badnpm/ui';

export const Colors = ['neutral', 'blue', 'green', 'red', 'yellow', 'orange', 'pink', 'purple', 'sky'] as const satisfies readonly ColorTheme[];

export type Color = (typeof Colors)[number];

export const SimpleColors = [
  'neutral',
  'blue',
  'green',
  'red',
  'yellow',
  'purple',
  'orange',
] as const;

// 与 @badnpm/ui 各配色亮色模式的 --primary 保持一致。
export const ColorMap = {
  neutral: 'oklch(0.205 0 0)',
  blue: 'oklch(0.488 0.243 264.376)',
  green: 'oklch(0.527 0.154 150.069)',
  red: 'oklch(0.505 0.213 27.518)',
  yellow: 'oklch(0.852 0.199 91.936)',
  orange: 'oklch(0.553 0.195 38.402)',
  pink: 'oklch(0.525 0.223 3.958)',
  purple: 'oklch(0.496 0.265 301.924)',
  sky: 'oklch(0.5 0.134 242.749)',
} satisfies Record<Color, string>;
