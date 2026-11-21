import {Button, Input, Label, RadioGroup, RadioGroupItem} from '@badnpm/ui';

import {number} from '@workspace/utils';
import type {
  DockviewGroupPanelApi,
  DockviewPanelApi,
  DockviewPanelRenderer,
  GridConstraintChangeEvent,
  IDockviewPanelProps,
} from 'dockview';
import {useEffect, useState} from 'react';

type TParams = {
  key: string;
};
export default function CommonPanel(props: IDockviewPanelProps<TParams>) {
  const panelApi: DockviewPanelApi = props.api;
  const groupApi: DockviewGroupPanelApi = props.api.group.api;
  // console.log(panelApi, groupApi, containerApi);
  const [constraints, setConstraints] = useState<GridConstraintChangeEvent | null>(null);
  // 没找到合适的校验场景
  const [mode, setMode] = useState<DockviewPanelRenderer>(panelApi.renderer);
  const [count, setCount] = useState(0);
  const [width, setWidth] = useState(panelApi.width);

  const modeOptions = [
    {value: 'onlyWhenVisible', label: 'onlyWhenVisible'},
    {value: 'always', label: 'always'},
  ];

  useEffect(() => {
    console.log('Panel useEffect', panelApi.id);
    return () => {
      console.log('Panel unmount', panelApi.id);
    };
  }, []);

  useEffect(() => {
    const disposables = [
      // 为啥没触发
      groupApi.onDidConstraintsChange((event) => {
        setConstraints(event);
      }),
      groupApi.onDidDimensionsChange((event) => {
        setWidth(event.width);
      }),
      panelApi.onDidRendererChange((event) => {
        setMode(event.renderer);
      }),
    ];
    return () => {
      disposables.forEach((disposable) => disposable.dispose());
    };
  }, []);

  const handleConstraints = () => {
    groupApi.setConstraints({
      minimumWidth: 200,
      maximumHeight: 200,
    });
  };

  const handleUpdateParams = () => {
    panelApi.updateParameters({key: 'value' + number.getRandomInt(100)});
  };

  const handleUpdateTitle = () => {
    panelApi.setTitle('Panel' + number.getRandomInt(100));
  };

  return (
    <div className="h-full overflow-auto">
      <div className="flex flex-wrap gap-2 p-2 [&>Label]:rounded-md [&>Label]:border [&>Label]:p-2">
        {constraints && (
          <>
            {typeof constraints.minimumWidth === 'number' && <div>最小宽度:{constraints.minimumWidth}</div>}
            {typeof constraints.maximumHeight === 'number' && <div>最大高度:{constraints.maximumHeight}</div>}
          </>
        )}
        <Label>
          params: {JSON.stringify(props.params)}
          <Button onClick={handleUpdateParams}>update</Button>
        </Label>
        <Label className="flex flex-wrap">
          <span>渲染模式：</span>
          <RadioGroup
            className="flex flex-wrap"
            defaultValue={mode}
            onValueChange={(value) => setMode(value as DockviewPanelRenderer)}
          >
            {modeOptions.map((v) => (
              <div className="flex items-center gap-1" key={v.value}>
                <RadioGroupItem id={`mode-${v.value}`} value={v.value} />
                <Label htmlFor={`mode-${v.value}`}>{v.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </Label>
        <Label>
          width: <Input className="w-30" type="number" value={width} onChange={(e) => setWidth(+e.target.value)} />
          <Button onClick={() => panelApi.setSize({width})}>设置panel</Button>
          <Button onClick={() => groupApi.setSize({width})}>设置group</Button>
        </Label>
        <Button onClick={handleConstraints}>设置约束</Button>
        <Button onClick={handleUpdateTitle}>update title</Button>
        <Button onClick={() => setCount(count + 1)}>count: {count}</Button>
      </div>
    </div>
  );
}
