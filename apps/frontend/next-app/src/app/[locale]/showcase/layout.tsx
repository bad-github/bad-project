import {createLocalizedMetadata} from '@/config/seo';

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>;

// 单个占位页也可在 page.tsx 中设置容器和元数据；这里使用 layout，
// 与其他导航页统一间距和多语言 SEO，并为未来的 showcase 子页面共享容器。
export const generateMetadata = createLocalizedMetadata('/showcase', 'Showcase');

export default function ShowcaseLayout({children}: Props) {
  return <main className="px-fluid-sm-lg py-8">{children}</main>;
}
