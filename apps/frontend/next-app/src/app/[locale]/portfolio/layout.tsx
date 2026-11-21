import {createLocalizedMetadata} from '@/config/seo';

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>;

// Next.js 会自动调用该约定导出；公共函数负责语言校验以及 canonical、hreflang。
// 如果以后修改 `/portfolio` 路由名称，只需同步修改这里传入的路径。
export const generateMetadata = createLocalizedMetadata('/portfolio', 'Portfolio');

export default function PortfolioLayout({children}: Props) {
  return <main className="px-fluid-sm-lg py-8">{children}</main>;
}
