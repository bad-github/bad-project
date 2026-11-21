import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@badnpm/ui';
import type {CombinatorSelectorProps} from 'react-querybuilder';

export default function CombinatorSelector(props: CombinatorSelectorProps) {
  const {value, options, handleOnChange} = props;
  // return <ValueSelector {...props} />;
  return (
    <Select
      items={options.map((v: any) => ({value: v.name, label: v.label}))}
      value={value || null}
      onValueChange={(value) => {
        if (value !== null) handleOnChange(value);
      }}
    >
      <SelectTrigger size="sm" className="w-40">
        <SelectValue placeholder="Combinator" />
      </SelectTrigger>
      <SelectContent>
        {options.map((v: any) => (
          <SelectItem key={v.name} value={v.name}>
            {v.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
