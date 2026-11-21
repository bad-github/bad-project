import {Link} from 'react-router';
import {useTranslation} from 'react-i18next';
import type {TRoute} from '@/router/types';
import {
  SidebarMenuButton,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@badnpm/ui';

type TProps = {
  menu: TRoute;
  handleClickLink: (route: TRoute) => void;
};

export default function Dropdown({menu, handleClickLink}: TProps) {
  const {t} = useTranslation();
  const buildSubItem = (subItem: TRoute) => {
    return (
      <div className="flex w-40 items-center gap-2">
        {subItem.icon && subItem.icon}
        <span title={t(subItem.title!)} className="truncate">
          {t(subItem.title!)}
        </span>
      </div>
    );
  };

  const buildSubContent = (subContent: TRoute[], parent?: TRoute) => {
    return subContent.map((v) => {
      const fullParentPath = parent?.fullPath || '';
      const fullPath = v.index ? fullParentPath : `${fullParentPath}/${v.path}`.replace(/\/+/g, '/');
      v.fullPath = fullPath;
      if (v.children?.length) {
        return (
          <DropdownMenuSub key={v.key}>
            <DropdownMenuSubTrigger>{buildSubItem(v)}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent sideOffset={6}>{buildSubContent(v.children, v)}</DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      }
      return (
        <DropdownMenuItem key={v.key} render={<Link to={fullPath || '/'} />} onClick={() => handleClickLink(v)}>
          {buildSubItem(v)}
        </DropdownMenuItem>
      );
    });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<SidebarMenuButton tooltip={t(menu.title!)} title={t(menu.title!)} />}>
        {menu.icon && menu.icon}
        <span>{t(menu.title!)}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-auto">
        {buildSubContent(menu.children || [], menu)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
