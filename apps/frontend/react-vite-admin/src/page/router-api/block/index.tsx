import useRouterLeave from '@/hooks/use-router-leave';
import {Label, Switch} from '@badnpm/ui';

import {useState} from 'react';

export default function RouterBlock() {
  const [isDirty, setIsDirty] = useState(true);
  const {Dialog} = useRouterLeave({shouldBlock: isDirty});
  return (
    <div>
      <div className="flex items-center gap-2">
        <Switch checked={isDirty} onCheckedChange={setIsDirty} />
        <Label>跳转拦截</Label>
      </div>
      {Dialog}
    </div>
  );
}
