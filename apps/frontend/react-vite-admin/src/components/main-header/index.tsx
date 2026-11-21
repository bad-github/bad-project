import {AlignJustifyIcon, RotateCwIcon} from 'lucide-react';

import {Button, cn} from '@badnpm/ui';
import useRefreshRouterStore from '@/store/refresh-router-store';
import nprogress from '@/utils/nprogress';
import ThemeSwitch from '../theme-switch';
import LngSwitch from '../lng-switch';
import Preference from '../preference';
import Profile from '../profile';
import RouteBread from '../route-bread';
import FullSwitch from '../full-switch';
import Notify from '../notify';
import GlobalSearch from './global-search';

type TProps = {
  toggleSidebar: () => void;
  className?: string;
};

export default function MainHeader(props: TProps) {
  const {toggleSidebar, className} = props;
  const reloadRouter = () => {
    useRefreshRouterStore.getState().triggerRefresh();
    nprogress.once();
  };

  return (
    <div
      className={cn(
        '@container/main-header flex h-[48px] shrink-0 items-center gap-2 overflow-hidden border-b px-2',
        className
      )}
    >
      <div className="flex shrink-0 items-center">
        <Button size="icon" variant="ghost" className="size-7 rounded-md" onClick={toggleSidebar}>
          <AlignJustifyIcon />
        </Button>
        <Button size="icon" variant="ghost" className="size-7 rounded-md" onClick={reloadRouter}>
          <RotateCwIcon />
        </Button>
      </div>
      <RouteBread className="hidden min-w-0 overflow-hidden @min-[36rem]/main-header:block" />
      <div className="ml-auto flex shrink-0 items-center gap-0 @min-[24rem]/main-header:gap-1">
        <GlobalSearch />
        <Preference />
        <FullSwitch />
        <LngSwitch />
        <ThemeSwitch />
        <Notify />
        <Profile className="ml-2" />
      </div>
    </div>
  );
}
