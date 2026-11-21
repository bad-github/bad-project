import {useTranslation} from 'react-i18next';
import {Button, Avatar, AvatarFallback, AvatarImage, Popover, PopoverContent, PopoverTrigger} from '@badnpm/ui';
import {BellIcon, MailCheckIcon} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import type {Notification} from '@workspace/mock';
import {time} from '@workspace/utils';
import {format} from 'date-fns';

export default function Notify() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const loadingRef = useRef(false);
  const {t} = useTranslation();

  const loadNotifications = useCallback(async () => {
    if (notifications !== null || loadingRef.current) return;
    loadingRef.current = true;
    setStatus('loading');
    try {
      // 组件挂载后异步加载模拟数据依赖，缓存结果，避免重复生成。
      // 保留动态导入，使 Faker 不成为入口模块的静态依赖。
      const {getMock} = await import('@/mock');
      const mock = await getMock();
      setNotifications(mock.notification.getAll(5));
      setStatus('idle');
    } catch (error) {
      console.error('Failed to load notifications', error);
      setStatus('error');
    } finally {
      loadingRef.current = false;
    }
  }, [notifications]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadNotifications();
  }, [loadNotifications]);

  const getTimeText = (timestamp: string) => {
    const {unit, value} = time.formatRelativeDate(timestamp);
    if (unit === 'minutes') {
      return t('notify.minutesAgo', {minutes: value});
    } else if (unit === 'hours') {
      return t('notify.hoursAgo', {hours: value});
    } else if (unit === 'days') {
      return t('notify.daysAgo', {days: value});
    } else if (unit === 'date') {
      return format(value, 'yyyy-MM-dd HH:mm:ss');
    }
    return '';
  };

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon" className="size-7 rounded-md" />}>
        <BellIcon />
      </PopoverTrigger>
      <PopoverContent className="PopoverContent flex w-80! flex-col p-0" align="end">
        <div className="flex items-center justify-between px-3 py-2">
          <h3>{t('notify.notification')}</h3>
          <Button variant="ghost" size="icon" className="relative size-7 rounded-md">
            <MailCheckIcon />
            <span className="bg-destructive absolute right-0 translate-x-[40%] translate-y-[-40%] scale-70 rounded-full px-1 text-xs">
              99+
            </span>
          </Button>
        </div>
        <div className="flex flex-col overflow-y-auto" aria-busy={status === 'loading'}>
          {status === 'loading' && (
            <p role="status" className="text-muted-foreground px-3 py-4 text-center text-sm">
              {t('common.loading')}
            </p>
          )}
          {status === 'error' && (
            <div role="alert" className="flex flex-col items-center gap-2 px-3 py-4 text-sm">
              <p>{t('notify.loadFailed')}</p>
              <Button size="sm" variant="ghost" onClick={() => void loadNotifications()}>
                {t('notify.retry')}
              </Button>
            </div>
          )}
          {notifications?.map((v) => (
            <div key={v.id} className="flex flex-col gap-1 border-t px-3 py-2 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Avatar className="size-6">
                  <AvatarImage className="rounded-full" src={v.avatar} alt="" />
                  <AvatarFallback className="rounded-full">{v.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{v.title}</span>
                {!v.read && <span className="bg-destructive ml-auto size-2 rounded-full"></span>}
              </div>
              <p className="text-muted-foreground line-clamp-2 text-xs">{v.content}</p>
              <span className="text-muted-foreground ml-auto text-xs">{getTimeText(v.time)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between border-t px-3 py-2">
          <Button size="sm" variant="ghost">
            {t('notify.clear')}
          </Button>
          <Button size="sm" variant="link">
            {t('notify.viewAll')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
