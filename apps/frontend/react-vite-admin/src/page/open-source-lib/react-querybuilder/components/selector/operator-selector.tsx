import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@badnpm/ui';
import type {OperatorSelectorProps} from 'react-querybuilder';

export default function OperatorSelector(props: OperatorSelectorProps) {
  const {value, options, handleOnChange} = props;
  // return <ValueSelector {...props} />;
  return (
    <div className="custom-operator w-40 shrink-0">
      <Select
        items={options.map((v: any) => ({value: v.name, label: v.label}))}
        value={value || null}
        onValueChange={(value) => {
          if (value !== null) handleOnChange(value);
        }}
      >
        <SelectTrigger size="sm" className="w-full">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {options.map((v: any) => (
            <SelectItem key={v.name} value={v.name}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
