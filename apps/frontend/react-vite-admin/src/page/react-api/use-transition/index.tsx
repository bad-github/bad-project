import {getMockUsers} from '@/request/user';
import {HighlightKeyword} from '@badnpm/ui';
import {Input, Slider, Switch} from '@badnpm/ui';
import {memo, useEffect, useMemo, useState, useTransition} from 'react';

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

// memo 是关键：输入同步更新时，listKeyword 暂时不变，users 引用也不变，
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
          // 高亮与筛选都使用已提交的 listKeyword，避免旧结果提前按新输入高亮。
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
  const [listKeyword, setListKeyword] = useState('');
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(true);
  const [renderCost, setRenderCost] = useState(4);
  // 拖动时只更新显示值，提交后才更新慢列表，避免每个刻度都触发忙等。
  const [sliderCost, setSliderCost] = useState(4);
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 与 useDeferredValue 推迟读取一个值不同，useTransition 在更新状态时标记非紧急更新。
  // keyword 控制输入框，必须同步更新；listKeyword 只用于列表，可以标记为 Transition。
  const isStale = keyword !== listKeyword;
  const isUpdating = isPending || isStale;

  function handleKeywordChange(value: string) {
    setKeyword(value);

    if (enabled) {
      // 回调会立即执行，并非延时执行。被推迟的是这次状态更新对应的渲染，
      // 新输入可以打断未完成的列表渲染；它不会开启后台线程，也不是防抖。
      // 不要把 setKeyword 或耗时计算放进这里：前者会影响受控输入，后者仍会同步阻塞。
      startTransition(() => {
        setListKeyword(value);
      });
    } else {
      // 普通更新作为对照：输入和慢列表一起渲染，更容易感受到输入卡顿。
      setListKeyword(value);
    }
  }

  function handleEnabledChange(nextEnabled: boolean) {
    setEnabled(nextEnabled);
    // 关闭时立即对齐当前输入，避免仍然展示上一次 Transition 的旧关键词。
    if (!nextEnabled) setListKeyword(keyword);
  }

  useEffect(() => {
    let ignore = false;

    // 沿用原来的模拟用户接口，仅在挂载时加载；输入变化只进行本地过滤。
    // useTransition 不会自动管理请求、减少请求次数，也不会优化首次数据加载。
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
          <Switch checked={enabled} onCheckedChange={handleEnabledChange} />
          启用 useTransition
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
          {error
            ? '加载失败'
            : users === null
              ? '正在加载用户…'
              : isUpdating
                ? 'Transition 更新中，暂时显示旧结果…'
                : '列表已同步'}
        </p>
        <p className="text-muted-foreground text-xs">当前列表关键词：{listKeyword || '（空）'}</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <label className="block max-w-md shrink-0">
          <span className="sr-only">搜索用户</span>
          <Input
            value={keyword}
            placeholder="输入用户名"
            onChange={(event) => handleKeywordChange(event.target.value)}
          />
        </label>
        <div
          className="bg-card text-card-foreground min-h-0 flex-1 overflow-y-auto rounded-md p-3"
          aria-busy={(users === null && !error) || isUpdating}
          style={{opacity: isUpdating ? 0.5 : 1}}
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
