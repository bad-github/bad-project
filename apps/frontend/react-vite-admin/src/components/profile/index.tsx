import {
  toast,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  cn,
} from '@badnpm/ui';
import {supabaseApi} from '@/supabase';
import type {ReactElement} from 'react';
import {useTranslation} from 'react-i18next';
import IconAvatar from '@/assets/image/avatar.jpeg';
import useUserStore from '@/store/user';
import {useShallow} from 'zustand/shallow';
import {useHotkeys} from 'react-hotkeys-hook';
import {useNavigate} from 'react-router';
import {useConfirmDialog} from '@/hooks/use-confirm-dialog';
import {shortcut} from '@workspace/utils';

type TProps = {
  trigger?: ReactElement;
  side?: 'bottom' | 'top' | 'right' | 'left' | undefined;
  align?: 'end' | 'center' | 'start' | undefined;
  className?: string;
};

export default function Profile(props: TProps) {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {trigger, side = 'bottom', align = 'end', className} = props;
  const {user, setUser} = useUserStore(useShallow((state) => ({user: state.user, setUser: state.setUser})));
  const {confirm, Dialog} = useConfirmDialog();

  const handleLogout = async () => {
    confirm({
      title: t('sign.signOut') + '?',
      onOK: async () => {
        navigate('/sign-in');
        const {error} = await supabaseApi.auth.signOut();
        if (error) {
          toast.add({title: error.message, type: 'error'});
          return;
        }
        setUser({});
      },
    });
  };
  useHotkeys(
    shortcut.getHotkey('signOut'),
    (e) => {
      e.preventDefault();
      handleLogout();
    },
    {
      preventDefault: true,
    }
  );
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            trigger ?? (
              <button
                type="button"
                className={cn(
                  'focus-visible:ring-ring size-7 cursor-pointer rounded-full outline-none focus-visible:ring-2',
                  className
                )}
                aria-label={t('common.settings')}
              >
                <Avatar className="size-7">
                  <AvatarImage src={IconAvatar} alt="" />
                  <AvatarFallback className="rounded">{user?.user_metadata?.username?.slice(0, 1)}</AvatarFallback>
                </Avatar>
              </button>
            )
          }
        />
        <DropdownMenuContent side={side} align={align} className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="truncate font-medium">{user?.user_metadata?.username || 'bad'}</span>
                <span className="text-muted-foreground truncate text-xs">{user.email || 'bad@gmail.com'}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('common.settings')}</DropdownMenuItem>
            <DropdownMenuItem>{t('common.other')}</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/update-password')}>{t('sign.updatePassword')}</DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            {t('sign.signOut')}
            <DropdownMenuShortcut>{shortcut.getShortcutLabel('signOut')}</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {Dialog}
    </>
  );
}
