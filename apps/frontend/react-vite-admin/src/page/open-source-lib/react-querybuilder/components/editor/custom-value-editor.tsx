import {useValueEditor, ValueEditor as DefaultValueEditor, type ValueEditorProps} from 'react-querybuilder';
import {Input, Label, Checkbox, Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@badnpm/ui';

const Editor = (props: ValueEditorProps) => {
  const {value, handleOnChange, values, type, inputType, fieldData} = props;
  const {valueAsArray} = useValueEditor(props);
  const placeholder = fieldData.placeholder;

  // console.log(props, valueAsArray, 'Editor');
  if (fieldData.customComponent) {
    const CustomComponent = fieldData.customComponent as React.ComponentType<ValueEditorProps>;
    return <CustomComponent {...props} />;
  }

  if (type === 'text') {
    return (
      <Input
        type={inputType || type}
        value={value}
        onChange={(e) => handleOnChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  }
  if (type === 'select') {
    return (
      <Select
        items={(values ?? []).map((v: any) => ({value: v.name, label: v.label}))}
        value={value || null}
        onValueChange={(value) => {
          if (value !== null) handleOnChange(value);
        }}
      >
        <SelectTrigger size="sm" className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {values?.map((v: any) => (
            <SelectItem key={v.name} value={v.name}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (type === 'multiselect') {
    return <DefaultValueEditor {...props} value={valueAsArray.filter(Boolean)} />;
  }
  if (type === 'checkbox') {
    return (
      <div className="flex items-center gap-4">
        {values?.map((v: any) => (
          <div className="flex gap-1" key={v.name}>
            <Label htmlFor={v.name}>{v.label}</Label>
            <Checkbox
              checked={valueAsArray?.includes(v.name)}
              id={v.name}
              onCheckedChange={(checked) => {
                /**
                 * 能让value存为数组的要求
                 * (1)操作符是：between,notBetween,in,notIn
                 * (2)开启listsAsArrays（不配置好像也行）
                 * 否则会将value更新为value[0]
                 */
                const newValue = checked
                  ? [...valueAsArray, v.name]
                  : valueAsArray.filter((val: string) => val !== v.name);
                handleOnChange(newValue.filter(Boolean));
              }}
            />
          </div>
        ))}
      </div>
    );
  }
  return <DefaultValueEditor {...props} />;
};

export default function CustomValueEditor(props: ValueEditorProps) {
  return (
    <div className="custom-value-editor flex-1">
      <Editor {...props} />
    </div>
  );
}
