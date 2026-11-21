import {Slider} from '@badnpm/ui';
import {inputAttributes, type EditorProps} from './types';

export default function RangeEditor(props: EditorProps) {
  const {config, value, onChange, inputRef} = props;
  if (config.type !== 'slider' && config.type !== 'range-slider') return null;
  // 当前 ui-base Slider 按数组长度生成滑块；即使是单值，也传 [value] 以生成一个滑块。
  const values =
    config.type === 'slider'
      ? [typeof value === 'number' ? value : config.min]
      : Array.isArray(value) && value.every((item) => typeof item === 'number')
        ? value
        : [config.min, config.max];
  return (
    <div className="grid gap-3 py-2">
      <Slider
        {...inputAttributes(props)}
        ref={inputRef}
        value={values}
        min={config.min}
        max={config.max}
        step={config.step}
        onValueChange={(next) => {
          const array = Array.isArray(next) ? next : [next];
          onChange(config.type === 'slider' ? array[0]! : array);
        }}
      />
      <output className="text-muted-foreground text-xs">{values.join(' ～ ')}</output>
    </div>
  );
}
