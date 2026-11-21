import type {ColorFormat} from './types';

/**
 * 生成随机颜色
 * @param type 'hex' | 'rgb'
 */
function randomColor(type: ColorFormat = 'hex'): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  if (type === 'rgb') {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** 颜色生成与处理。 */
export const color = {randomColor};
