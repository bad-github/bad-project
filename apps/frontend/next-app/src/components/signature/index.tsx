import Image, {type ImageProps} from 'next/image';
import {cn} from '@badnpm/ui';
import SignatureEn from '@/assets/image/signature-en-US.png';
import SignatureZhCN from '@/assets/image/signature-zh-CN.png';
import SignatureZhTW from '@/assets/image/signature-zh-TW.png';
import {LOCALE, type AppLocale} from '@/i18n/locales';

const SIGNATURE_IMAGES = {
  [LOCALE.zhCN]: SignatureZhCN,
  [LOCALE.zhTW]: SignatureZhTW,
  [LOCALE.enUS]: SignatureEn,
} satisfies Record<AppLocale, ImageProps['src']>;

export type SignatureProps = Omit<ImageProps, 'src' | 'alt' | 'width' | 'height' | 'fill'> & {
  locale?: AppLocale;
  width?: number;
  alt?: string;
};

/**
 * 艺术签名。通过 locale 选择图片，可直接移植到任意区域。
 * 不在组件内部读取语言上下文，便于独立使用，也支持服务端渲染。
 * 三张原图均为白色笔迹、透明背景；brightness-0 在亮色主题下只将
 * 笔迹变黑，不影响透明通道，dark:brightness-100 则恢复原图的白色。
 */
export default function Signature({
  locale = LOCALE.zhCN,
  width = 240,
  alt = '阿超',
  className,
  ...props
}: SignatureProps) {
  const image = SIGNATURE_IMAGES[locale];

  return (
    <Image
      {...props}
      src={image}
      alt={alt}
      width={width}
      className={cn('h-auto max-w-full brightness-0 dark:brightness-100', className)}
    />
  );
}
