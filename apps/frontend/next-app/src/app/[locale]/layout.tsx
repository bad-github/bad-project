import '../../styles/globals.css';
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import {hasLocale, NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {Toaster} from '@badnpm/ui';
import Header from '@/components/header';
import Footer from '@/components/footer';
import {createLocalizedMetadata} from '@/config/seo';
import {SITE_URL} from '@/config/site';
import {routing} from '@/i18n/routing';
import {ThemeProvider as NextThemesProvider} from 'next-themes';


const geistSans = Geist({
  variable: '--font-geist-sans', // 把css变量名注入到根节点
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>;

/**
 * 告诉 Next.js 支持哪些动态语言参数，在构建阶段预渲染对应路由
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

// 公共函数负责首页的多语言标题、描述、canonical、hreflang 和语言校验。
const generateCommonMetadata = createLocalizedMetadata('', 'Common');

/**
 * Metadata API 只支持 Server Component，同一路由段不能同时导出静态 metadata 和 generateMetadata
 * generateMetadata 是 Next.js 的约定函数，框架会自动调用，无需手动执行。
 * 首页保留这个函数，是为了在公共 SEO 元数据之外追加根布局独有的 metadataBase。
 */
export async function generateMetadata(props: Pick<Props, 'params'>): Promise<Metadata> {
  return {
    ...(await generateCommonMetadata(props)),
    // metadataBase 是 Next.js 的元数据基础地址，供后续需要拼接绝对 URL(如/en) 的 SEO 字段复用。
    // 应配置为正式域名
    // 正式域名变化时不要在这里修改，统一更新 SITE_URL 环境变量即可。
    metadataBase: new URL(SITE_URL),
  };
}

/**
 *
 * 是否加 layout，主要看：
 * (1)这个路由是否需要独立的标题、描述和 canonical
 * (2)它是否会承载多个子页面或共享页面框架
 */
export default async function RootLayout({
  children,
  params,
}: Props) {
  const {locale} = await params;

  // [locale] 是动态路由，必须先校验，避免任意路径被误认为受支持的语言。
  if (!hasLocale(routing.locales, locale)) {
    // 非法语言触发 404
    notFound();
  }

  // getMessages 会读取 request.ts 为本次请求返回的完整语言消息。
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        {/* Provider 将服务端加载的消息传给需要使用翻译 Hook 的客户端组件。 */}
        <NextIntlClientProvider messages={messages}>
          <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
          </NextThemesProvider>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
