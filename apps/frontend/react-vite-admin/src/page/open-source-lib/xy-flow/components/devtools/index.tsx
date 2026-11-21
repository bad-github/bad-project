import {useMemo, useState} from 'react';
import {Panel} from '@xyflow/react';
import ChangeLogger from './change-logger';
import NodeInspector from './node-inspector';
import ViewportLogger from './viewport-logger';
import {Label, Checkbox} from '@badnpm/ui';

export default function DevTools() {
  const [checkList, setCheckList] = useState<string[]>([]);

  const toolOptions = useMemo(() => {
    return [
      {value: 'Change Logger', label: 'Change Logger'},
      {value: 'Node Inspector', label: 'Node Inspector'},
      {value: 'Viewport Logger', label: 'Viewport Logger'},
    ];
  }, []);

  return (
    <div className="react-flow__devtools">
      <Panel position="top-right" className="flex flex-col gap-2">
        {toolOptions.map((v) => (
          <div className="flex items-center gap-1">
            <Checkbox
              id={v.value}
              checked={checkList.includes(v.value)}
              onCheckedChange={(checked: boolean) =>
                checked ? setCheckList([...checkList, v.value]) : setCheckList(checkList.filter((w) => w !== v.value))
              }
            />
            <Label htmlFor={v.value} className="text-xs">
              {v.label}
            </Label>
          </div>
        ))}
      </Panel>
      {checkList.includes('Change Logger') && <ChangeLogger />}
      {checkList.includes('Node Inspector') && <NodeInspector />}
      {checkList.includes('Viewport Logger') && <ViewportLogger />}
    </div>
  );
}
