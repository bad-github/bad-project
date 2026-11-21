import Image from 'next/image';
import {useLocale, useTranslations} from 'next-intl';
import AvatarBlack from '@/assets/image/avatar-black.png';
import AvatarWhite from '@/assets/image/avatar-white.png';
import InteractiveGrid from '@/components/interactive-grid';
import Signature from '@/components/signature';
import {PROFILE_ITEMS, type ProfileItem} from './profile-data';

function renderProfileValue(item: ProfileItem, value: string) {
  switch (item.kind) {
    case 'text':
      return <span>{value}</span>;
    case 'external':
      return <a href={item.href} target={item.target} rel="noopener noreferrer">{value}</a>;
    case 'email':
      return <a href={`mailto:${value}`}>{value}</a>;
  }
}

export default function Home() {
  // page.tsx 默认是 Server Component；该 Hook 会在服务端读取 Home 命名空间并生成对应语言的 HTML。
  const t = useTranslations('Home');
  const locale = useLocale();

  return (
    <main>
      {/* overflow-clip 裁剪背景但不创建滚动容器，保留个人信息栏的 sticky 行为。 */}
      <InteractiveGrid className="overflow-clip">
        <div className="px-fluid-sm-lg flex flex-col items-center gap-6 py-8 md:items-start md:justify-center md:flex-row md:gap-12 lg:gap-24">
          <aside className="shrink-0 md:sticky md:top-27 md:self-start">
            <Image
              className="motion-safe:transition-transform motion-safe:duration-250 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:scale-[1.05] size-[128px] max-md:rounded-full md:size-[192px] lg:size-[256px] dark:hidden"
              src={AvatarWhite}
              alt={t('avatarAlt')}
              /**
               * 如果页面只有一张确定不变的首屏主图，使用 preload 是合理
               * 但存在亮暗两种候选，服务器无法预先知道应该加载哪张，所以 fetchPriority="high" 更合适
               */
              fetchPriority="high"
              /**
               * 写了sizes，两种适配方案
               * (1)在本元素设置响应式尺寸
               * (2)在父元素设置响应式尺寸，同时本元素设置fill
               * <640px: 128×128
               * 640–1023px: 192×192
               * ≥1024px: 256×25
               */
              sizes="
        (max-width: 767px) 128px,
        (max-width: 1023px) 192px,
        256px
      "
            />
            <Image
              className="motion-safe:transition-transform motion-safe:duration-250 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:scale-[1.05] hidden size-[128px] max-md:rounded-full md:size-[192px] lg:size-[256px] dark:block"
              src={AvatarBlack}
              alt={t('avatarAlt')}
              fetchPriority="high"
              /**
               * 写了sizes，两种适配方案
               * (1)在本元素设置响应式尺寸
               * (2)在父元素设置响应式尺寸，同时本元素设置fill
               * <640px: 128×128
               * 640–1023px: 192×192
               * ≥1024px: 256×25
               */
              sizes="
        (max-width: 767px) 128px,
        (max-width: 1023px) 192px,
        256px
      "
            />
            <ul className="text-foreground/80 mt-6 flex flex-col gap-4 text-sm">
              {PROFILE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.labelKey} className="flex items-center gap-4">
                    <Icon aria-hidden="true" className="size-5 shrink-0" />
                    {renderProfileValue(item, t(item.labelKey))}
                  </li>
                );
              })}
            </ul>
          </aside>
          <section aria-labelledby="about-heading" className="flex max-w-prose flex-col gap-6">
            <h2 id="about-heading" className="text-2xl font-semibold">
              {t('aboutTitle')}
            </h2>
            <div className="text-foreground/80 flex flex-col gap-4 text-base/7 [&>p]:indent-[2em]">
              <p>{t('paragraphs.introduction')}</p>
              <p>{t('paragraphs.career')}</p>
              <p>{t('paragraphs.spareTime')}</p>
            </div>
            <Signature locale={locale} alt={t('signatureLabel')} width={400} className="w-4/5 max-w-[400px] self-end opacity-85" />
          </section>
        </div>
      </InteractiveGrid>
    </main>
  );
}
