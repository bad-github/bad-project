import {SidebarMenuButton, Avatar, AvatarFallback, AvatarImage} from '@badnpm/ui';
import {ChevronsUpDownIcon} from 'lucide-react';
import Profile from '../profile';

export default function Footer() {
  return (
    <Profile
      side="right"
      trigger={
        <SidebarMenuButton size="lg" className="cursor-pointer">
          <Avatar>
            <AvatarImage src="" alt="" />
            <AvatarFallback className="rounded">K</AvatarFallback>
          </Avatar>
          <div>haerin</div>
          <ChevronsUpDownIcon className="ml-auto size-4" />
        </SidebarMenuButton>
      }
    />
  );
}
