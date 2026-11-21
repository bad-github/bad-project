import {useState} from 'react';
import {Controller, useFormContext} from 'react-hook-form';
import {zhCN} from 'date-fns/locale';
import {CalendarIcon} from 'lucide-react';
import {Button, Calendar, Popover, PopoverContent, PopoverTrigger} from '@badnpm/ui';
import FormField from './form-field';
import {formatDate, parseDate, rules, type RegistrationValues} from './form-model';

/**
 * UI 接收 Date/DateRange，RHF 保存可序列化的本地日期字符串。
 * 单日空值为 null；范围空值为 []，半选为 [开始日期]，完整为 [开始日期, 结束日期]。
 * 弹窗开关只是界面状态，不属于报名数据，不影响 dirtyFields。
 */
export default function DateFields() {
  const {control} = useFormContext<RegistrationValues>();
  const [dateOpen, setDateOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);

  return (
    <>
      <FormField name="date" label="可参加日期" required description="选择一个可以参加入营交流的日期。">
        {(attributes) => (
          <Controller
            name="date"
            control={control}
            rules={rules.date}
            render={({field}) => (
              <Popover
                open={dateOpen}
                onOpenChange={(open) => {
                  setDateOpen(open);
                  // 关闭弹窗视为交互结束：标记 touched，并按 onBlur 模式校验。
                  if (!open) field.onBlur();
                }}
              >
                <PopoverTrigger
                  {...attributes}
                  // 错误聚焦回到触发按钮；日历位于 Portal 内，不作为字段 ref。
                  ref={field.ref}
                  onBlur={field.onBlur}
                  render={<Button type="button" variant="outline" className="w-full justify-start font-normal" />}
                >
                  <CalendarIcon aria-hidden="true" className="text-muted-foreground" />
                  <span className={field.value ? undefined : 'text-muted-foreground'}>
                    {field.value ?? '请选择参加日期'}
                  </span>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0" aria-label="选择参加日期">
                  <Calendar
                    mode="single"
                    autoFocus
                    locale={zhCN}
                    defaultMonth={parseDate(field.value)}
                    selected={parseDate(field.value)}
                    onSelect={(date) => {
                      // 先写值再失焦，确保校验读到本次选择的日期。
                      field.onChange(date ? formatDate(date) : null);
                      field.onBlur();
                      setDateOpen(false);
                    }}
                  />
                  <div className="flex justify-end border-t p-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        field.onChange(null);
                        field.onBlur();
                        setDateOpen(false);
                      }}
                    >
                      清空
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          />
        )}
      </FormField>
      <FormField name="period" label="计划学习周期" required description="选择开始和结束日期，结束日期需晚于开始日期。">
        {(attributes) => (
          <Controller
            name="period"
            control={control}
            rules={rules.period}
            render={({field}) => {
              // 保留半选状态，不能第一下点击就自动补齐结束日期。
              const [from, to] = field.value;
              return (
                <Popover
                  open={periodOpen}
                  onOpenChange={(open) => {
                    setPeriodOpen(open);
                    if (!open) field.onBlur();
                  }}
                >
                  <PopoverTrigger
                    {...attributes}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    render={<Button type="button" variant="outline" className="w-full justify-start font-normal" />}
                  >
                    <CalendarIcon aria-hidden="true" className="text-muted-foreground shrink-0" />
                    <span className={from ? 'truncate' : 'text-muted-foreground truncate'}>
                      {from ? `${from} 至 ${to ?? '请选择结束日期'}` : '请选择学习起止日期'}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-auto max-w-[calc(100vw-2rem)] p-0"
                    aria-label="选择学习周期"
                  >
                    <Calendar
                      mode="range"
                      autoFocus
                      locale={zhCN}
                      // UI 限制至少跨一天，rules.period 继续防守程序赋值/回填的非法范围。
                      min={1}
                      numberOfMonths={2}
                      defaultMonth={parseDate(from ?? null)}
                      selected={from ? {from: parseDate(from), to: parseDate(to ?? null)} : undefined}
                      // 选择过程只写值；完成或关闭时 onBlur，避免每一步都算编辑结束。
                      onSelect={(range) =>
                        field.onChange(
                          range?.from ? [formatDate(range.from), ...(range.to ? [formatDate(range.to)] : [])] : []
                        )
                      }
                    />
                    <div className="flex items-center justify-between gap-3 border-t p-2">
                      <Button type="button" size="sm" variant="ghost" onClick={() => field.onChange([])}>
                        清空
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!from || !to}
                        onClick={() => {
                          field.onBlur();
                          setPeriodOpen(false);
                        }}
                      >
                        完成
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }}
          />
        )}
      </FormField>
    </>
  );
}
