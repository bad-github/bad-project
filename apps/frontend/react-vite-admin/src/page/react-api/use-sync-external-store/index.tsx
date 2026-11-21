import {Button, Input} from '@badnpm/ui';
import {memo, useState} from 'react';
import {browserStore, DEMO_STORAGE_KEY} from './store';
import {useBrowserStore} from './use-browser-store';

// 每个区域只选择自己需要的快照字段。其他字段变化时，Object.is 相等就无需重新渲染。
// 页面父组件不订阅整个 store，避免一次变化带着所有展示组件一起重新渲染。
function WindowStatus() {
  const size = useBrowserStore((state) => state.size);
  return (
    <section className="space-y-2 p-6">
      <h2 className="text-sm font-medium">窗口尺寸</h2>
      <p className="font-mono text-xl">
        {size.width} <span className="text-muted-foreground">×</span> {size.height}
      </p>
      <p className="text-muted-foreground text-xs">调整浏览器窗口大小，尺寸自动更新。</p>
    </section>
  );
}

function NetworkStatus() {
  const online = useBrowserStore((state) => state.online);
  return (
    <section className="space-y-2 p-6">
      <h2 className="text-sm font-medium">网络状态</h2>
      <p className="flex items-center gap-2 text-sm">
        <span aria-hidden="true" className={`size-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        {online ? '浏览器报告在线' : '浏览器报告离线'}
      </p>
      <p className="text-muted-foreground text-xs">跟随 online / offline 事件；在线不代表目标服务一定可访问。</p>
    </section>
  );
}

function StorageStatus() {
  const token = useBrowserStore((state) => state.token);
  const error = useBrowserStore((state) => state.storageError);
  return (
    <section className="space-y-2 p-6">
      <h2 className="text-sm font-medium">本地存储</h2>
      <p className="font-mono text-sm break-all">{token ?? '暂无演示值'}</p>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
      <p className="text-muted-foreground text-xs">当前页写入主动同步，其他标签页通过 storage 事件同步。</p>
    </section>
  );
}

function BroadcastStatus() {
  const message = useBrowserStore((state) => state.broadcast);
  const supported = useBrowserStore((state) => state.broadcastSupported);
  return (
    <section className="space-y-2 p-6">
      <h2 className="text-sm font-medium">跨标签页消息</h2>
      <p className="text-sm break-all">
        {supported ? (message?.text ?? '等待其他标签页发送消息') : '当前环境不支持广播'}
      </p>
      {message && <p className="text-muted-foreground text-xs">最近接收于 {message.receivedAt}</p>}
      <p className="text-muted-foreground text-xs">发送标签页不会接收自身消息，重复消息也会产生新快照。</p>
    </section>
  );
}

function QueryStatus() {
  const search = useBrowserStore((state) => state.search);
  // store 保存不可变字符串；只在读取时解析，不把可修改的 URLSearchParams 暴露为快照。
  const id = new URLSearchParams(search).get('id');
  return (
    <section className="space-y-2 p-6">
      <h2 className="text-sm font-medium">URL 参数</h2>
      <p className="font-mono text-sm break-all">id = {id === null ? '（未设置）' : JSON.stringify(id)}</p>
      <p className="text-muted-foreground text-xs break-all">{search || '暂无查询参数'}</p>
    </section>
  );
}

function SnapshotVersion() {
  const version = useBrowserStore((state) => state.version);
  return <span className="text-muted-foreground font-mono text-xs">快照 v{version}</span>;
}

type Feedback = {text: string; failed: boolean};

function StoreActions({onFeedback}: {onFeedback: (feedback: Feedback) => void}) {
  const [message, setMessage] = useState('你好，来自另一个标签页');
  const [queryId, setQueryId] = useState('demo-1');
  const broadcastSupported = useBrowserStore((state) => state.broadcastSupported);

  function runAction(action: () => void, success: string) {
    try {
      action();
      onFeedback({text: success, failed: false});
    } catch (error) {
      onFeedback({text: error instanceof Error ? error.message : '操作失败', failed: true});
    }
  }

  return (
    <aside className="min-w-0 space-y-6 border-t p-6 lg:border-t-0 lg:border-l" aria-label="演示操作">
      <h2 className="text-sm font-medium">演示操作</h2>
      <section className="space-y-2">
        <h3 className="text-muted-foreground text-xs">本地存储</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => runAction(() => browserStore.setToken(String(Date.now())), '已写入演示值')}
          >
            更新值
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => runAction(() => browserStore.setToken(null), '已移除演示值')}
          >
            移除
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              runAction(
                () => browserStore.setToken(browserStore.getSnapshot().token),
                '已重复写入；数据相同，快照版本不变'
              )
            }
          >
            写入相同值
          </Button>
        </div>
        <p className="text-muted-foreground text-xs leading-5">使用独立演示键，不影响登录状态。</p>
        <code className="text-muted-foreground block text-xs break-all">{DEMO_STORAGE_KEY}</code>
      </section>

      <section className="space-y-2">
        <label className="block space-y-2 text-sm">
          <span className="text-muted-foreground text-xs">广播消息</span>
          <Input value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
        <Button
          size="sm"
          variant="outline"
          disabled={!broadcastSupported || !message.trim()}
          onClick={() => runAction(() => browserStore.sendBroadcast(message), '已发送，请在另一个标签页查看')}
        >
          发送消息
        </Button>
        <a
          className="text-primary block text-xs underline-offset-4 hover:underline"
          href=""
          target="_blank"
          rel="noopener noreferrer"
        >
          在新标签页打开本页 ↗
        </a>
      </section>

      <section className="space-y-2">
        <label className="block space-y-2 text-sm">
          <span className="text-muted-foreground text-xs">URL 参数 id</span>
          <Input value={queryId} onChange={(event) => setQueryId(event.target.value)} placeholder="输入 id" />
        </label>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => runAction(() => browserStore.setQueryId(queryId), '已更新当前 URL')}
          >
            应用
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => runAction(() => browserStore.setQueryId(''), '已移除 id 参数')}
          >
            移除
          </Button>
        </div>
        <p className="text-muted-foreground text-xs leading-5">按钮主动同步 URL；前进、后退通过 popstate 同步。</p>
      </section>
    </aside>
  );
}

// 操作反馈提升到页面头部后，用 memo 避免反馈变化带着全部状态区域重新渲染。
// memo 不会阻止各区域通过自己的 useSyncExternalStore 订阅响应数据变化。
const BrowserStatus = memo(function BrowserStatus() {
  return (
    <div className="min-w-0 divide-y" aria-label="实时浏览器状态">
      <WindowStatus />
      <NetworkStatus />
      <StorageStatus />
      <BroadcastStatus />
      <QueryStatus />
    </div>
  );
});

export default function UseSyncExternalStorePage() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  return (
    <div className="flex h-full min-h-full w-full flex-col">
      <header className="shrink-0 space-y-2 border-b px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-medium">浏览器状态订阅</h1>
          <SnapshotVersion />
        </div>
        {feedback && (
          <p
            role={feedback.failed ? 'alert' : 'status'}
            className={`text-xs leading-5 ${feedback.failed ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {feedback.text}
          </p>
        )}
        <p className="text-muted-foreground text-xs leading-5">
          外部变化 → 通知订阅者 → 读取快照。只有选中的数据变化，对应区域才需要更新。
        </p>
      </header>
      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <BrowserStatus />
        <StoreActions onFeedback={setFeedback} />
      </div>
    </div>
  );
}
