import {getMockUsers} from '@/request/user';
import {HighlightKeyword} from '@badnpm/ui';
import {Input, Slider, Switch} from '@badnpm/ui';
import {memo, useDeferredValue, useEffect, useMemo, useState} from 'react';

type User = {
  id: number;
  username: string;
};

function SlowRow({
  user,
  matches,
  renderCost,
  keyword,
}: {
  user: User;
  matches: boolean;
  renderCost: number;
  keyword: string;
}) {
  // 仅用于教学：每个列表项模拟 renderCost 毫秒的工作，默认整轮约 100 × 4 = 400ms。
  // 生产代码应删除这段忙等。它仍在主线程执行，React 不能中断单个组件内的同步代码，
  // 只能在处理组件之间让出执行权，所以不要把整段耗时集中到父组件或 filter 中。
  // 仅为教学控制忙等时长，时间值不参与 UI 输出；两处局部豁免不适用于业务渲染。
  // eslint-disable-next-line react-hooks/purity -- 教学用的渲染耗时模拟
  const start = performance.now();
  // eslint-disable-next-line react-hooks/purity -- 教学用的渲染耗时模拟
  while (performance.now() - start < renderCost) {
    // 模拟一个开销较大的列表项。
  }

  // 不匹配的行也先完成模拟工作，再返回 null，避免结果变少后开销消失、无法比较。
  // 真实项目不应为隐藏项故意增加开销，这里只是让演示负载保持稳定。
  return matches ? (
    <li className="py-1 text-sm">
      <HighlightKeyword caseSensitive={false} text={user.username} keyword={keyword} />
    </li>
  ) : null;
}

// memo 是关键：输入同步更新时，deferredKeyword 暂时不变，users 引用也不变，
// 因此 React 可以跳过整份旧列表；只用 useMemo 缓存 filter 无法跳过列表的渲染。
const UserList = memo(function UserList({
  users,
  keyword,
  renderCost,
}: {
  users: User[];
  keyword: string;
  renderCost: number;
}) {
  const filteredList = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return users.filter((item) => item.username.toLowerCase().includes(normalizedKeyword));
  }, [keyword, users]);
  const matchingIds = new Set(filteredList.map((user) => user.id));

  return (
    <div>
      {filteredList.length === 0 && <p className="text-muted-foreground text-sm">没有匹配的用户</p>}
      <ul>
        {/* 不对 SlowRow 使用 memo，让关键词变化时能观察整份列表的渲染开销。 */}
        {users.map((user) => (
          // 高亮与筛选都使用列表的延迟关键词，避免旧结果提前按新输入高亮。
          <SlowRow
            key={user.id}
            user={user}
            matches={matchingIds.has(user.id)}
            renderCost={renderCost}
            keyword={keyword}
          />
        ))}
      </ul>
    </div>
  );
});

export default function SearchList() {
  const [keyword, setKeyword] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [renderCost, setRenderCost] = useState(4);
  // 拖动时只更新显示值，提交后才更新慢列表，避免每个刻度都触发忙等。
  const [sliderCost, setSliderCost] = useState(4);
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 输入框始终绑定 keyword，保证输入是同步更新的；列表才使用延迟后的值。
  // 这里没有固定等待时间，也不是防抖。React 会尽快尝试更新列表，
  // 新的输入可以打断尚未完成的后台渲染；“后台”不表示开启了另一个线程。
  const deferredKeyword = useDeferredValue(keyword);
  const listKeyword = enabled ? deferredKeyword : keyword;
  const isStale = keyword !== listKeyword;

  useEffect(() => {
    let ignore = false;

    // 沿用原来的模拟用户接口，仅在挂载时加载；输入变化只进行本地过滤。
    // useDeferredValue 本身不会减少请求次数，也不会延迟首次数据加载。
    getMockUsers(100)
      .then((res) => {
        if (!ignore) setUsers(res.data);
      })
      .catch(() => {
        if (!ignore) setError('用户加载失败，请刷新重试。');
      });

    // 卸载或 StrictMode 重新执行 Effect 后，忽略上一轮异步结果。
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="shrink-0 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          启用 useDeferredValue
        </label>
        <div className="flex max-w-md items-center gap-3 text-sm">
          <span className="shrink-0 tabular-nums">每行模拟耗时：{sliderCost.toFixed(1)}ms</span>
          <Slider
            aria-label="每行模拟耗时"
            min={0}
            max={8}
            step={0.1}
            value={[sliderCost]}
            onValueChange={(value) => setSliderCost(Array.isArray(value) ? value[0]! : value)}
            onValueCommitted={(value) => setRenderCost(Array.isArray(value) ? value[0]! : value)}
          />
        </div>
        <p role="status" className="text-muted-foreground text-xs">
          {error ? '加载失败' : users === null ? '正在加载用户…' : isStale ? '正在更新，暂时显示旧结果…' : '列表已同步'}
        </p>
        <p className="text-muted-foreground text-xs">当前列表关键词：{listKeyword || '（空）'}</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <label className="block max-w-md shrink-0">
          <span className="sr-only">搜索用户</span>
          <Input value={keyword} placeholder="输入用户名" onChange={(event) => setKeyword(event.target.value)} />
        </label>
        <div
          className="bg-card text-card-foreground min-h-0 flex-1 overflow-y-auto rounded-md p-3"
          aria-busy={(users === null && !error) || isStale}
          style={{opacity: isStale ? 0.5 : 1}}
        >
          {error ? (
            <p role="alert" className="text-sm">
              {error}
            </p>
          ) : users === null ? (
            <p className="text-muted-foreground text-sm">加载用户中…</p>
          ) : (
            <UserList users={users} keyword={listKeyword} renderCost={renderCost} />
          )}
        </div>
      </div>
    </div>
  );
}
