import {useRef, useState} from 'react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  BadButton,
} from '@badnpm/ui';
import {useTranslation} from 'react-i18next';

type TDialogConfig = {
  open?: boolean;
  title?: string;
  message?: string;
  content?: React.ReactNode;
  onOK?: (v: boolean) => any;
  onCancel?: (v: boolean) => void;
};

/**
 * 两种使用方式
 * (1)await confirm({title, message, onOK?, onCancel?})
 * (2)confirm({title, message, onOK, onCancel})
 */
export function useConfirmDialog() {
  const {t} = useTranslation();
  const [state, setState] = useState<TDialogConfig>({open: false});
  const resolveRef = useRef<((v: boolean) => void) | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // 返回值是一个pending promise
  const confirm = ({title = 'common.tip', message, content, onOK, onCancel}: Omit<TDialogConfig, 'open'>) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({open: true, title, message, content, onOK, onCancel});
    });
  };

  const handleCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    resolveRef.current?.(false);
    resolveRef.current = null;
    state.onCancel?.(false);
    setState({...state, open: false, onCancel: undefined});
  };

  const handleOK = (e: React.MouseEvent) => {
    e?.stopPropagation();
    if (!state.onOK) {
      resolveRef.current?.(true);
      resolveRef.current = null;
      setState({...state, open: false});
      return;
    }
    const result = state.onOK(true);
    if (result && result instanceof Promise) {
      setConfirmLoading(true);
      result
        .then((res) => {
          // 只有成功才关闭
          console.log(res, 'confirm promise');
          resolveRef.current?.(res);
          resolveRef.current = null;
          setState({...state, open: false});
        })
        .finally(() => setConfirmLoading(false));
    } else {
      resolveRef.current?.(true);
      resolveRef.current = null;
      setState({...state, open: false});
    }
  };

  const Dialog = (
    <AlertDialog
      open={state.open}
      onOpenChange={(open) => {
        console.log('onOpenChange', open);
        // 点击ESC时触发
        if (!open) handleCancel();
      }}
    >
      <AlertDialogContent className="max-md:min-w-md max-sm:min-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t(state.title!)}</AlertDialogTitle>
          <AlertDialogDescription>{state.message}</AlertDialogDescription>
        </AlertDialogHeader>
        {state.content}
        <AlertDialogFooter>
          {/* 不用AlertDialogAction、AlertDialogCancel，因为它里面的事件会默认触发onOpenChange */}
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <BadButton onClick={handleOK} loading={confirmLoading}>
            {t('common.ok')}
          </BadButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {confirm, Dialog};
}
