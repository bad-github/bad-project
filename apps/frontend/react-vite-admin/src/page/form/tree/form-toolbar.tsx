import {memo, useState} from 'react';
import {Button, NativeSelect, NativeSelectOption} from '@badnpm/ui';
import type {ControlType} from './schema';
import {controlTypes} from './tool';

type Props = {onSelectType: (type: ControlType) => void; onAdd: (type: ControlType) => void};

/** 类型选择只影响工具栏自身；不为了修改新增类型而让所有表格单元格重渲染。 */
function FormToolbar({onSelectType, onAdd}: Props) {
  const [type, setType] = useState<ControlType>('input');
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="tree-new-control">新增控件类型</label>
      <NativeSelect
        id="tree-new-control"
        value={type}
        onChange={(event) => {
          const next = controlTypes.find((item) => item === event.target.value);
          if (next) {
            setType(next);
            onSelectType(next);
          }
        }}
      >
        {controlTypes.map((item) => (
          <NativeSelectOption key={item} value={item}>
            {item}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Button type="button" variant="outline" onClick={() => onAdd(type)}>
        添加根节点
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => onAdd(controlTypes[Math.floor(Math.random() * controlTypes.length)]!)}
      >
        随机添加
      </Button>
      <Button type="submit">校验并提交</Button>
    </div>
  );
}
export default memo(FormToolbar);
