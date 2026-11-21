import {useState} from 'react';
import type {UseFormReturn} from 'react-hook-form';
import {Input, Textarea, NativeSelect, NativeSelectOption} from '@badnpm/ui';
import type {FormSchema, TreeNode} from '../schema';
import FieldFeedback from '../field-feedback';
import {parseNumberInput} from '../value-adapters';

type Props = {node: TreeNode; form: UseFormReturn<FormSchema>};

export default function UncontrolledEditor({node, form}: Props) {
  const config = node.control;
  const name = `values.${node.id}` as const;
  const id = `tree-control-${node.id}`;
  // 每次重新挂载都从 RHF 取“最新值”，而不是从节点工厂重新取默认值。
  // 只在本次挂载初始化一次，错误提示更新不会改变输入的 defaultValue。
  const [initialValue] = useState(() => form.getValues(name));
  const registration = form.register(name, {
    ...(config.type === 'number' ? {setValueAs: parseNumberInput} : {}),
    ...(config.type === 'native-select' ? {setValueAs: (value: string) => value || null} : {}),
  });
  const defaultValue = typeof initialValue === 'string' || typeof initialValue === 'number' ? initialValue : '';

  return (
    <FieldFeedback form={form} name={name} id={id}>
      {({invalid, describedBy}) => {
        const attributes = {id, 'aria-label': node.label, 'aria-invalid': invalid, 'aria-describedby': describedBy};
        switch (config.type) {
          case 'input':
          case 'password':
            // 使用 Input 而非带增强交互的 BadInput，减少输入时的 React 渲染。
            // 此处不传 value/onValueChange；ref/onChange/onBlur/name 全部由 register 接管。
            return (
              <Input
                {...registration}
                {...attributes}
                type={config.type === 'password' ? 'password' : 'text'}
                placeholder={config.placeholder}
                defaultValue={defaultValue}
              />
            );
          case 'number':
            return (
              <Input
                {...registration}
                {...attributes}
                type="number"
                min={config.min}
                max={config.max}
                step={config.step}
                defaultValue={defaultValue}
              />
            );
          case 'textarea':
            return <Textarea {...registration} {...attributes} rows={config.rows} defaultValue={defaultValue} />;
          case 'native-select':
            return (
              <NativeSelect {...registration} {...attributes} defaultValue={defaultValue}>
                <NativeSelectOption value="">请选择</NativeSelectOption>
                {config.options.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            );
          default:
            return null;
        }
      }}
    </FieldFeedback>
  );
}
