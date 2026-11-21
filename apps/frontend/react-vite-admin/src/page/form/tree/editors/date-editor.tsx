import {Button, Calendar, Popover, PopoverTrigger, PopoverContent} from '@badnpm/ui';
import {isDateRange} from '../schema';
import {inputAttributes, type EditorProps} from './types';

/** 只处理日历日期，不使用 toISOString()，避免本地午夜转换为 UTC 后日期回退。 */
function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function parseDate(value: string | null) {
  return value ? new Date(`${value}T12:00:00`) : undefined;
}

export default function DateEditor(props: EditorProps) {
  const {config, value, onChange, inputRef} = props;
  if (config.type !== 'date' && config.type !== 'date-range') return null;
  const range = isDateRange(value) ? value : {from: null, to: null};
  const date = typeof value === 'string' ? value : null;
  const label = config.type === 'date' ? date : [range.from, range.to].filter(Boolean).join(' ～ ');
  return (
    <Popover>
      <PopoverTrigger {...inputAttributes(props)} ref={inputRef} render={<Button type="button" variant="outline" />}>
        {label || '请选择日期'}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        {config.type === 'date' ? (
          <Calendar
            mode="single"
            selected={parseDate(date)}
            onSelect={(next) => onChange(next ? formatDate(next) : null)}
          />
        ) : (
          <Calendar
            mode="range"
            selected={range.from ? {from: parseDate(range.from), to: parseDate(range.to)} : undefined}
            onSelect={(next) =>
              onChange({from: next?.from ? formatDate(next.from) : null, to: next?.to ? formatDate(next.to) : null})
            }
          />
        )}
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => onChange(config.type === 'date' ? null : {from: null, to: null})}
        >
          清空
        </Button>
      </PopoverContent>
    </Popover>
  );
}
