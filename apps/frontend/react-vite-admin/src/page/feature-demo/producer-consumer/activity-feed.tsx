import {Card, CardContent, CardHeader, CardTitle, ScrollArea} from '@badnpm/ui';
import {clock, type Activity} from './order-model';

export default function ActivityFeed({activities}: {activities: Activity[]}) {
  return (
    <Card className="min-h-0 min-w-0 gap-0 py-0">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b p-4">
        <CardTitle>
          <h2>业务动态</h2>
        </CardTitle>
        <span className="text-muted-foreground text-xs">最近 40 条</span>
      </CardHeader>
      {/* 并排时由左侧表格（含分页）决定行高，动态列表填满右侧剩余空间。 */}
      <CardContent className="min-h-0 flex-1 px-0 xl:relative">
        {/* ScrollArea 根节点内联设置 relative，由外层负责脱离文档流以避免撑高网格。 */}
        <div className="h-96 xl:absolute xl:inset-0 xl:h-auto">
          <ScrollArea className="h-full">
            <ol className="space-y-4 p-4">
              {activities.map((event) => (
                <li key={event.id} className="flex gap-3 text-xs">
                  <span
                    className={`mt-1 size-1.5 shrink-0 rounded-full ${event.tone === 'success' ? 'bg-emerald-500' : event.tone === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}
                  />
                  <div>
                    <p className="leading-5">{event.message}</p>
                    <time
                      className="text-muted-foreground mt-1 block font-mono"
                      dateTime={new Date(event.at).toISOString()}
                    >
                      {clock.format(event.at)}
                    </time>
                  </div>
                </li>
              ))}
              {!activities.length && (
                <li className="text-muted-foreground py-6 text-center text-sm">
                  接单、处理、失败和重试都会记录在这里。
                </li>
              )}
            </ol>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
