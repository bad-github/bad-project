import {
  QueryClient,
  QueryClientProvider,
  QueryErrorResetBoundary,
  queryOptions,
  usePrefetchQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {Button} from '@badnpm/ui';
import {Suspense, useState} from 'react';
import type {ReactNode} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import {createArticleDemoApi} from './tool';
import type {Scenario} from './tool';

type BoundaryMode = 'nested' | 'shared';

const scenarios: {value: Scenario; label: string}[] = [
  {value: 'success', label: '全部成功'},
  {value: 'comments-error', label: '评论首次失败'},
  {value: 'article-error', label: '正文首次失败'},
  {value: 'empty-comments', label: '暂无评论'},
];

function createDemoRun(mode: BoundaryMode, scenario: Scenario) {
  // 每轮使用独立缓存；这里只构造配置，请求由演示组件的预加载 Hook 启动。
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        retry: false,
        refetchOnWindowFocus: false,
        // 本地模拟接口不依赖网络，离线时也可以演示。
        networkMode: 'always',
      },
    },
  });
  const api = createArticleDemoApi(scenario);
  const articleOptions = queryOptions({queryKey: ['suspense-article', 1], queryFn: api.getArticle});
  const commentsOptions = queryOptions({queryKey: ['suspense-comments', 1], queryFn: api.getComments});

  return {client, mode, scenario, articleOptions, commentsOptions};
}

type DemoRun = ReturnType<typeof createDemoRun>;

function RequestErrorBoundary({children, title}: {children: ReactNode; title: string}) {
  return (
    <QueryErrorResetBoundary>
      {({reset}) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({error, resetErrorBoundary}) => (
            <div role="alert" className="space-y-2 p-6 text-sm">
              <h3 className="font-medium">{title}</h3>
              <p className="text-muted-foreground">{error instanceof Error ? error.message : '请求失败，请重试。'}</p>
              <Button variant="outline" size="sm" onClick={() => resetErrorBoundary()}>
                重试
              </Button>
            </div>
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

function ArticleSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-6 p-6">
      <span className="sr-only">正在加载文章</span>
      <div aria-hidden="true" className="animate-pulse space-y-4">
        <div className="bg-muted h-6 w-2/3 rounded" />
        <div className="bg-muted h-3 w-1/4 rounded" />
        <div className="bg-muted h-3 rounded" />
        <div className="bg-muted h-3 rounded" />
        <div className="bg-muted h-3 w-4/5 rounded" />
      </div>
    </div>
  );
}

function CommentsSkeleton() {
  return (
    <div role="status" aria-busy="true" className="p-6">
      <p className="text-muted-foreground text-sm">评论加载中…</p>
    </div>
  );
}

function ArticleContent({run}: {run: DemoRun}) {
  // useSuspenseQuery 在无数据时挂起；成功返回后 data 一定存在。
  const {data: article} = useSuspenseQuery(run.articleOptions);

  return (
    <article className="space-y-4 p-6">
      <header className="space-y-2">
        <h2 className="text-xl font-medium">{article.title}</h2>
        <p className="text-muted-foreground text-xs">{article.author}</p>
      </header>
      {article.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-7">
          {paragraph}
        </p>
      ))}
    </article>
  );
}

function Comments({run}: {run: DemoRun}) {
  const {data: comments} = useSuspenseQuery(run.commentsOptions);

  return (
    <section className="space-y-4 p-6">
      <h3 className="text-sm font-medium">评论 · {comments.length}</h3>
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">暂无评论</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="space-y-1 text-sm">
              <p className="font-medium">{comment.author}</p>
              <p className="text-muted-foreground">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ArticleDemo({run}: {run: DemoRun}) {
  // 在子树可能挂起前并行预加载；相同缓存中的请求会复用，不会因重新渲染重复启动。
  usePrefetchQuery(run.articleOptions, run.client);
  usePrefetchQuery(run.commentsOptions, run.client);

  return (
    <QueryClientProvider client={run.client}>
      <RequestErrorBoundary title="文章区域加载失败">
        <Suspense fallback={<ArticleSkeleton />}>
          <div>
            <ArticleContent run={run} />
            <div className="border-t">
              {run.mode === 'nested' ? (
                // 最近的边界处理评论的挂起或错误，不影响已经显示的正文。
                <RequestErrorBoundary title="评论加载失败，正文仍可阅读">
                  <Suspense fallback={<CommentsSkeleton />}>
                    <Comments run={run} />
                  </Suspense>
                </RequestErrorBoundary>
              ) : (
                // 共享加载边界和错误边界：任意请求挂起或失败都会影响整个文章区域。
                <Comments run={run} />
              )}
            </div>
          </div>
        </Suspense>
      </RequestErrorBoundary>
    </QueryClientProvider>
  );
}

export default function SuspensePage() {
  const [mode, setMode] = useState<BoundaryMode>('nested');
  const [scenario, setScenario] = useState<Scenario>('success');
  const [demo, setDemo] = useState(() => ({id: 0, run: createDemoRun(mode, scenario)}));

  function startDemo() {
    const run = createDemoRun(mode, scenario);
    // key 重置整个演示，包括错误边界；旧请求完成也只会写入旧缓存。
    setDemo((previous) => ({id: previous.id + 1, run}));
  }

  return (
    <div className="flex h-full min-h-full w-full flex-col">
      <header className="shrink-0 border-b px-6 py-4">
        <h1 className="text-lg font-medium">文章与评论分区加载</h1>
      </header>

      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0" aria-label="文章加载演示">
          <ArticleDemo key={demo.id} run={demo.run} />
        </section>

        <aside className="min-w-0 space-y-5 border-t p-6 lg:border-t-0 lg:border-l" aria-label="演示设置">
          <h2 className="text-sm font-medium">演示设置</h2>
          <label className="block space-y-2 text-sm">
            <span className="text-muted-foreground">边界布局</span>
            <select
              className="bg-background h-9 w-full rounded-md border px-2 text-sm"
              value={mode}
              onChange={(event) => setMode(event.target.value as BoundaryMode)}
            >
              <option value="nested">嵌套边界</option>
              <option value="shared">共享边界</option>
            </select>
          </label>
          <label className="block space-y-2 text-sm">
            <span className="text-muted-foreground">请求结果</span>
            <select
              className="bg-background h-9 w-full rounded-md border px-2 text-sm"
              value={scenario}
              onChange={(event) => setScenario(event.target.value as Scenario)}
            >
              {scenarios.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button className="w-full" size="sm" onClick={startDemo}>
            重新演示
          </Button>
          <div className="text-muted-foreground space-y-2 text-xs leading-5">
            <p>正文 1 秒 · 评论 3 秒，同时请求。</p>
            <p>{mode === 'nested' ? '正文先显示，评论独立加载与重试。' : '正文与评论一起显示，错误整体处理。'}</p>
            <p>点击按钮应用设置，失败后可重试。</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
