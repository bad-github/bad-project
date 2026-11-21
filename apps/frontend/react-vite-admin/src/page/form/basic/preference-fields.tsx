import {Controller, useFormContext} from 'react-hook-form';
import {
  Checkbox,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Slider,
  Switch,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from '@badnpm/ui';
import FormField from './form-field';
import DateFields from './date-fields';
import {rules, topics, type RegistrationValues} from './form-model';

/**
 * 适配 Slider 的数组、Toggle 的 pressed、Switch/Checkbox 的 checked 等不同值协议。
 * 值只在 RHF 中保存，不再另建一份 React 值状态，否则回填和 reset 容易不同步。
 */
export default function PreferenceFields() {
  const {control} = useFormContext<RegistrationValues>();

  return (
    <>
      <FieldSet>
        <FieldLegend className="text-primary border-primary mb-4 border-l-3 pl-3 font-semibold">日期安排</FieldLegend>
        <FieldGroup className="grid items-start gap-5 @md/field-group:grid-cols-2">
          <DateFields />
        </FieldGroup>
      </FieldSet>
      <FieldSeparator />
      <FieldSet>
        <FieldLegend className="text-primary border-primary mb-4 border-l-3 pl-3 font-semibold">
          学习与参与偏好
        </FieldLegend>
        <FieldGroup className="grid items-start gap-5 @md/field-group:grid-cols-2">
          <FormField name="hours" label="每周学习投入" group description="1–30 小时，保存为数字。">
            {(attributes) => (
              <Controller
                name="hours"
                control={control}
                rules={rules.hours}
                render={({field}) => (
                  <div className="grid gap-3 py-1">
                    <Slider
                      {...attributes}
                      ref={field.ref}
                      name={field.name}
                      // Slider 接收单元素数组，业务字段保存 number，双向转换要保持对称。
                      value={[field.value]}
                      min={1}
                      max={30}
                      step={1}
                      onBlur={field.onBlur}
                      onValueChange={(value) => field.onChange(Array.isArray(value) ? value[0] : value)}
                    />
                    <output className="text-muted-foreground text-xs tabular-nums">{field.value} 小时 / 周</output>
                  </div>
                )}
              />
            )}
          </FormField>
          <FormField name="topics" label="感兴趣的方向" group description="可多选，也可以不选。">
            {(attributes) => (
              <Controller
                name="topics"
                control={control}
                rules={rules.topics}
                render={({field}) => (
                  <ToggleGroup
                    {...attributes}
                    // 多选返回完整新数组，不原地修改 field.value，确保订阅与 dirty 比较正常。
                    multiple
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    className="flex-wrap"
                  >
                    {topics.map((topic, index) => (
                      <ToggleGroupItem
                        key={topic}
                        ref={index === 0 ? field.ref : undefined}
                        type="button"
                        value={topic}
                        variant="outline"
                        size="sm"
                      >
                        {topic}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
              />
            )}
          </FormField>
          <FormField name="waitlist" label="接受候补名额">
            {(attributes) => (
              <Controller
                name="waitlist"
                control={control}
                render={({field}) => (
                  <div>
                    <Toggle
                      {...attributes}
                      ref={field.ref}
                      type="button"
                      variant="outline"
                      // Toggle 使用 pressed，onPressedChange 返回 boolean，而非字符串 value。
                      pressed={field.value}
                      onPressedChange={field.onChange}
                      onBlur={field.onBlur}
                    >
                      {field.value ? '已接受候补' : '不接受候补'}
                    </Toggle>
                  </div>
                )}
              />
            )}
          </FormField>
          <FormField name="notify" label="接收开营提醒" description="通过联系邮箱接收通知。">
            {(attributes) => (
              <Controller
                name="notify"
                control={control}
                render={({field}) => (
                  <div>
                    <Switch
                      {...attributes}
                      name={field.name}
                      ref={field.ref}
                      // Switch 保存 boolean；false 也是有效值，不能用 || undefined 丢掉它。
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </div>
                )}
              />
            )}
          </FormField>
        </FieldGroup>
      </FieldSet>
      <FieldSeparator />
      <FieldSet>
        <FieldLegend className="text-primary border-primary mb-4 border-l-3 pl-3 font-semibold">验证与确认</FieldLegend>
        <FieldGroup className="grid items-start gap-5 @md/field-group:grid-cols-2">
          <FormField name="verificationCode" label="邮箱验证码" required description="本页验证码为 123456。">
            {(attributes) => (
              <Controller
                name="verificationCode"
                control={control}
                rules={rules.verificationCode}
                render={({field}) => (
                  <InputOTP
                    {...attributes}
                    ref={field.ref}
                    name={field.name}
                    // 六个槽位共用一个字符串字段。输入限制不能替代 rules 中的完整校验。
                    maxLength={6}
                    pattern="[0-9]*"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2].map((index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      {[3, 4, 5].map((index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
            )}
          </FormField>
          <FormField name="agreement" label="同意训练营报名条款" required className="self-center">
            {(attributes) => (
              <Controller
                name="agreement"
                control={control}
                rules={rules.agreement}
                render={({field}) => (
                  <div>
                    {/* 取消勾选写入 false；是否必须勾选由 rules.agreement 判断。 */}
                    <Checkbox
                      {...attributes}
                      ref={field.ref}
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </div>
                )}
              />
            )}
          </FormField>
        </FieldGroup>
      </FieldSet>
    </>
  );
}
