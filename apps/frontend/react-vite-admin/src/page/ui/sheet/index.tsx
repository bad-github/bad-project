import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Button,
  Label,
  Switch,
  BadButton,
} from '@badnpm/ui';
import {useState} from 'react';

export default function UISheet() {
  const [open, setOpen] = useState(false);
  const [asyncClose, setAsyncClose] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (asyncClose) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setOpen(false);
      }, 2000);
    } else {
      setOpen(false);
    }
  };

  return (
    <div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="outline" />}>Basic Sheet</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
          <div className="flex gap-2 px-4">
            <Switch checked={asyncClose} onCheckedChange={setAsyncClose} />
            <Label>Close async</Label>
          </div>
          <SheetFooter>
            <BadButton type="submit" loading={loading} onClick={submit}>
              Save
            </BadButton>
            <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
