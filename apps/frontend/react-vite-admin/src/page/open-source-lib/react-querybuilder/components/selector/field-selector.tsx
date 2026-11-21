import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@badnpm/ui';
import type {FieldSelectorProps} from 'react-querybuilder';

export default function FieldSelector(props: FieldSelectorProps) {
  const {value, options, handleOnChange, schema} = props;
  const selectedRules = schema.getQuery()?.rules || [];

  // return <ValueSelector {...props} />;
  return (
    <div className="custom-field-selector w-40 shrink-0">
      <Select
        items={options.map((v: any) => ({value: v.name, label: v.label}))}
        value={value || null}
        onValueChange={(value) => {
          if (value !== null) handleOnChange(value);
        }}
      >
        <SelectTrigger size="sm" className="w-full">
          <SelectValue placeholder="Field" />
        </SelectTrigger>
        <SelectContent>
          {options.map((v: any) => (
            // 可对已经选择的进行过滤或禁用
            <SelectItem key={v.name} value={v.name} disabled={selectedRules.some((r: any) => r.field === v.name)}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
