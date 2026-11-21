import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  RadioGroup,
  RadioGroupItem,
  Checkbox,
  ToggleGroup,
  ToggleGroupItem,
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@badnpm/ui';
import {inputAttributes, type EditorProps} from './types';

export default function ChoiceEditor(props: EditorProps) {
  const {config, value, onChange, inputRef, id, onBlur} = props;
  if (!('options' in config)) return null;
  const attributes = inputAttributes(props);
  const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  const single = typeof value === 'string' ? value : null;

  switch (config.type) {
    case 'select':
    case 'multi-select': {
      // 两个分支明确 multiple 的字面值，让 Base UI 正确推导 onValueChange 的值类型。
      const content = (
        <>
          <SelectTrigger {...attributes} ref={inputRef} className="w-full">
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            {config.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </>
      );
      return config.type === 'multi-select' ? (
        <Select multiple items={config.options} value={selected} onValueChange={onChange}>
          {content}
        </Select>
      ) : (
        <Select items={config.options} value={single} onValueChange={onChange}>
          {content}
        </Select>
      );
    }
    case 'radio-group':
      return (
        <RadioGroup {...attributes} value={single ?? ''} onValueChange={onChange}>
          {config.options.map((option, index) => (
            <label key={option.value} className="flex items-center gap-2">
              <RadioGroupItem ref={index === 0 ? inputRef : undefined} value={option.value} />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      );
    case 'checkbox-group':
      return (
        <div {...attributes} role="group" className="flex flex-wrap gap-3">
          {config.options.map((option, index) => (
            <label key={option.value} className="flex items-center gap-2">
              <Checkbox
                ref={index === 0 ? inputRef : undefined}
                checked={selected.includes(option.value)}
                onBlur={onBlur}
                onCheckedChange={(checked) =>
                  onChange(checked ? [...selected, option.value] : selected.filter((item) => item !== option.value))
                }
                aria-invalid={props.invalid}
                aria-describedby={props.describedBy}
              />
              {option.label}
            </label>
          ))}
        </div>
      );
    case 'toggle-group':
      return (
        <ToggleGroup {...attributes} multiple value={selected} onValueChange={onChange}>
          {config.options.map((option, index) => (
            <ToggleGroupItem
              key={option.value}
              ref={index === 0 ? inputRef : undefined}
              type="button"
              variant="outline"
              value={option.value}
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      );
    case 'combobox':
      return (
        <Combobox
          items={config.options.map((option) => option.value)}
          value={single}
          onValueChange={onChange}
          itemToStringLabel={(item) => config.options.find((option) => option.value === item)?.label ?? item}
        >
          <ComboboxInput {...attributes} id={id} ref={inputRef} placeholder="搜索选项" showClear />
          <ComboboxContent>
            <ComboboxEmpty>没有匹配选项</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {config.options.find((option) => option.value === item)?.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      );
    default:
      return null;
  }
}
