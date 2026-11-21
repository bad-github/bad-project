import {useState} from 'react';

import {
  Button,
  toast,
  Label,
  Switch,
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  BadButton,
  BadDialogContent,
} from '@badnpm/ui';
import {useConfirmDialog} from '@/hooks/use-confirm-dialog';
import {time} from '@workspace/utils';

export default function UIDialog() {
  const [openDialog, setOpenDialog] = useState<'body' | 'container' | null>(null);
  const [asyncClose, setAsyncClose] = useState(true);
  const [loading, setLoading] = useState(false);
  const {confirm, Dialog: ConfirmDialog} = useConfirmDialog();
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const submit = () => {
    if (asyncClose) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setOpenDialog(null);
      }, 2000);
    } else {
      setOpenDialog(null);
    }
  };

  const handleConfirm = () => {
    confirm({
      title: 'title',
      message: 'message',
      onOK: async () => {
        try {
          await time.sleep({message: 'mock fail'}, 2000, 0.5);
          console.log('ok');
        } catch (err: any) {
          toast.add({title: err.message, type: 'error'});
          // 返回值是Promise时，要么返回一个Promise，要么抛出错误：confirm才能根据promise状态决定是否关闭对话框
          throw err;
        }
      },
      onCancel: () => {
        console.log('cancel');
      },
    });
  };

  return (
    <div ref={setContainer} className="flex gap-2">
      <Dialog open={openDialog === 'body'} onOpenChange={(open) => setOpenDialog(open ? 'body' : null)}>
        <DialogTrigger render={<Button variant="outline" />}>Basic Dialog (rendered in the body)</DialogTrigger>
        <BadDialogContent>
          <DialogHeader>
            <DialogTitle>title</DialogTitle>
            <DialogDescription>description</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Switch checked={asyncClose} onCheckedChange={setAsyncClose} />
            <Label>close async</Label>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <BadButton type="submit" loading={loading} onClick={submit}>
              Save
            </BadButton>
          </DialogFooter>
        </BadDialogContent>
      </Dialog>
      <Dialog open={openDialog === 'container'} onOpenChange={(open) => setOpenDialog(open ? 'container' : null)}>
        <DialogTrigger render={<Button variant="outline" />}>Basic Dialog (rendered in the div)</DialogTrigger>
        <BadDialogContent container={container}>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Switch checked={asyncClose} onCheckedChange={setAsyncClose} />
            <Label>Close async</Label>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <BadButton type="submit" loading={loading} onClick={submit}>
              Save
            </BadButton>
          </DialogFooter>
        </BadDialogContent>
      </Dialog>
      <Button variant="outline" onClick={handleConfirm}>
        Confirm Dialog
      </Button>
      {ConfirmDialog}
    </div>
  );
}
