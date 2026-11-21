import {Checkbox, Switch, Toggle} from '@badnpm/ui';
import {inputAttributes, type EditorProps} from './types';

export default function BooleanEditor(props: EditorProps) {
  const {config, value, onChange, inputRef} = props;
  const attributes = inputAttributes(props);
  switch (config.type) {
    case 'switch':
      return <Switch {...attributes} ref={inputRef} checked={value === true} onCheckedChange={onChange} />;
    case 'checkbox':
      return <Checkbox {...attributes} ref={inputRef} checked={value === true} onCheckedChange={onChange} />;
    // Toggle 使用 pressed 而非 checked；这里统一转换成表单中的 boolean。
    case 'toggle':
      return (
        <Toggle
          {...attributes}
          ref={inputRef}
          type="button"
          variant="outline"
          pressed={value === true}
          onPressedChange={onChange}
        >
          {value === true ? '已开启' : '未开启'}
        </Toggle>
      );
    default:
      return null;
  }
}
