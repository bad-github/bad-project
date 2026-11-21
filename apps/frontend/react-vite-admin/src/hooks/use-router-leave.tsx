import {useEffect} from 'react';
import {useBlocker} from 'react-router';
import {useConfirmDialog} from './use-confirm-dialog';
import {useTranslation} from 'react-i18next';

type TProps = {
  shouldBlock?: boolean;
  message?: string;
};

export default function useRouterLeave(props: TProps) {
  const {t} = useTranslation();
  const {shouldBlock = false, message = t('common.leaveMsg')} = props;
  const {confirm, Dialog} = useConfirmDialog();
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    confirm({
      message,
      onOK: blocker.proceed,
      onCancel: blocker.reset,
    });
  }, [blocker.state]);


  return {Dialog, blocker};
}
