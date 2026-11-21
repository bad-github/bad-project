import {Fragment, useMemo, type ReactElement} from 'react';
import {useTranslation} from 'react-i18next';
import {useLocation, useNavigate} from 'react-router';
import {useShallow} from 'zustand/shallow';
import {
  ArrowLeftToLineIcon,
  ArrowRightLeftIcon,
  ArrowRightToLineIcon,
  PinIcon,
  PinOffIcon,
  RotateCwIcon,
  UnfoldHorizontalIcon,
  XIcon,
} from 'lucide-react';
import {ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger} from '@badnpm/ui';
import useTabStore, {type Tab} from '@/store/tab-store';
import useRefreshRouterStore from '@/store/refresh-router-store';
import nprogress from '@/utils/nprogress';
import {Action, type TAction} from './types';

type TProps = {
  children: ReactElement;
  tab: Tab;
  handleCloseTab: (e: React.MouseEvent, tab: Tab, index: number) => void;
  index: number;
};

export default function ActionMenu(props: TProps) {
  const {index, tab, children, handleCloseTab} = props;
  const {t} = useTranslation();
  const {pathname} = useLocation();
  const navigate = useNavigate();
  const {activeRoute, tabs, setTabs, updateTabPin} = useTabStore(
    useShallow((state) => ({
      activeRoute: state.activeRoute,
      tabs: state.tabs,
      setTabs: state.setTabs,
      updateTabPin: state.updateTabPin,
    }))
  );

  const menus = useMemo(() => {
    return [
      {key: Action.Close, label: 'dashboard.close', icon: <XIcon />, disabled: tabs.length === 1},
      {
        key: tab.isPin ? Action.PinOff : Action.Pin,
        label: tab.isPin ? 'dashboard.pinOff' : 'dashboard.pin',
        icon: tab.isPin ? <PinOffIcon /> : <PinIcon />,
        disabled: false,
      },
      {key: Action.Reload, label: 'dashboard.reload', icon: <RotateCwIcon />, disabled: pathname !== tab.fullPath},
      {
        key: Action.CloseLeft,
        label: 'dashboard.closeLeft',
        icon: <ArrowLeftToLineIcon />,
        disabled: tabs.length === 1 || activeRoute?.key !== tab.key || index === 0,
      },
      {
        key: Action.CloseRight,
        label: 'dashboard.closeRight',
        icon: <ArrowRightToLineIcon />,
        disabled: tabs.length === 1 || activeRoute?.key !== tab.key || index === tabs.length - 1,
      },
      {
        key: Action.CloseOther,
        label: 'dashboard.closeOther',
        icon: <UnfoldHorizontalIcon />,
        disabled: tabs.length === 1 || activeRoute?.key !== tab.key,
      },
      {key: Action.CloseAll, label: 'dashboard.closeAll', icon: <ArrowRightLeftIcon />, disabled: tabs.length === 1},
    ];
  }, [tabs, tab, activeRoute, pathname, index]);

  const handleMenuClick = (e: React.MouseEvent, key: TAction) => {
    e.stopPropagation();
    switch (key) {
      case Action.Close:
        handleCloseTab(e, tab, index);
        break;
      case Action.Pin:
      case Action.PinOff:
        updateTabPin({...tab, isPin: !tab.isPin});
        break;
      case Action.Reload:
        useRefreshRouterStore.getState().triggerRefresh();
        nprogress.once();
        break;
      case Action.CloseLeft: {
        const right = tabs.slice(index);
        const left = tabs.slice(0, index).filter((v) => v.isPin);
        setTabs([...left, ...right]);
        break;
      }
      case Action.CloseRight: {
        const left = tabs.slice(0, index + 1);
        const right = tabs.slice(index + 1).filter((v) => v.isPin);
        setTabs([...left, ...right]);
        break;
      }
      case Action.CloseOther: {
        const left = tabs.slice(0, index).filter((v) => v.isPin);
        const right = tabs.slice(index + 1).filter((v) => v.isPin);
        setTabs([...left, tab, ...right]);
        break;
      }
      case Action.CloseAll: {
        navigate('/dashboard');
        const tab = tabs.find((v) => v.key === 'dashboard');
        setTabs(tab ? [tab] : []);
        break;
      }
      default:
        break;
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent className="w-[150px]">
        {menus.map((v) => (
          <Fragment key={v.label}>
            <ContextMenuItem
              className="cursor-pointer"
              disabled={v.disabled}
              onClick={(e) => handleMenuClick(e, v.key)}
            >
              {v.icon}
              {t(v.label)}
            </ContextMenuItem>
            {v.label === 'reload' && <ContextMenuSeparator />}
          </Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
