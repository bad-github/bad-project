import type {ControllerRenderProps} from 'react-hook-form';
import type {ControlConfig, FieldValue, FormSchema} from '../schema';

/** 所有编辑器遵守同一个值协议，具体组件的事件签名只在适配器内部处理。 */
export type EditorProps = {
  config: ControlConfig;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  onBlur: () => void;
  inputRef: ControllerRenderProps<FormSchema>['ref'];
  id: string;
  name: string;
  label: string;
  invalid: boolean;
  describedBy?: string;
};

/** 原生输入和 Base UI 根控件共用的可访问性信息，不把 RHF 的 field 整包透传。 */
export function inputAttributes(props: EditorProps) {
  return {
    id: props.id,
    name: props.name,
    'aria-label': props.label,
    'aria-invalid': props.invalid,
    'aria-describedby': props.describedBy,
    onBlur: props.onBlur,
  };
}
