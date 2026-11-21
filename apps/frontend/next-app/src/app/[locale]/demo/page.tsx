import {Bell, SquareArrowOutUpRight} from 'lucide-react';
import type {Metadata} from 'next';
import {connection} from 'next/server';
import SparkleBurst from '@/components/sparkle-burst';
import InteractiveGrid from '@/components/interactive-grid';

/**
 * Demo 仅用于内部效果演示，不属于网站希望搜索引擎收录的正式内容。
 *
 * 这里使用页面级 Metadata，而不是在 robots.txt 中禁止抓取：
 * - index: false 会生成 `noindex`，明确要求搜索引擎不要收录该页面；
 * - follow: false 会生成 `nofollow`，要求搜索引擎不要沿用该页面中的链接发现内容。
 *
 * 搜索引擎必须能够抓取页面，才能读取到这些指令。因此不要再在 robots.ts 中
 * Disallow 此路由，否则爬虫可能看不到 noindex，URL 仍有机会单独出现在搜索结果中。
 * 该配置位于 [locale] 路由之下，会同时应用于 /zh/demo、/tw/demo 和 /en/demo。
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

async function AsyncContent() {
  await connection();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return <p className="text-muted-foreground">Async demo loaded.</p>;
}

export default function DemoPage() {
  return (
    <main className="px-fluid-sm-lg mx-auto flex w-full max-w-3xl flex-col gap-10 py-12">
      <section className="flex flex-col items-start gap-4" aria-labelledby="sparkle-demo-heading">
        <div>
          <h1 id="sparkle-demo-heading" className="text-xl font-semibold">
            CSS Sparkle Burst
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Click the icon to replay the effect.</p>
        </div>

        <div className="flex items-start gap-12">
          <div className="flex flex-col items-center gap-3">
            <SparkleBurst>
              <button
                type="button"
                className="text-blue-500 hover:bg-blue-500/10 hover:text-blue-600 rounded-lg border border-blue-500/25 p-3 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                aria-label="Play sparkle effect"
              >
                <SquareArrowOutUpRight className="size-5" strokeWidth={2} />
              </button>
            </SparkleBurst>
            <span className="text-muted-foreground text-xs">Click</span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <SparkleBurst trigger="loop">
              <button
                type="button"
                className="text-foreground hover:bg-muted rounded-lg border p-3 transition-colors"
                aria-label="Continuous sparkle effect"
              >
                <Bell className="size-5" strokeWidth={2} />
              </button>
            </SparkleBurst>
            <span className="text-muted-foreground text-xs">Loop</span>
          </div>
        </div>
      </section>
      <AsyncContent />
      <section className="flex flex-col gap-4" aria-labelledby="grid-demo-heading">
        <div className="flex flex-col gap-2">
          <h2 id="grid-demo-heading" className="text-xl font-semibold">交互网格</h2>
          <p className="text-sm text-muted-foreground">移动鼠标查看聚光和弯曲，移开后网格自动回弹。</p>
        </div>
        <InteractiveGrid className="w-full max-w-sm rounded-xl bg-muted/20" gridSize={32} radius={110} strength={12}>
          <div className="flex h-48 items-center justify-center px-6 text-sm">小容器也可以使用</div>
        </InteractiveGrid>
      </section>
    </main>
  );
}
