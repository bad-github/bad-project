import {Controller, useFormContext} from 'react-hook-form';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  FieldGroup,
  FieldLegend,
  FieldSet,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@badnpm/ui';
import FormField from './form-field';
import {courses, organizations, rules, type RegistrationValues} from './form-model';

/**
 * 组合控件使用 Controller 适配，不要求它们产生原生 input change 事件。
 * value 负责回填/重置，onChange 写入 RHF，onBlur 驱动 touched 和失焦校验。
 * ref 必须指向可 focus 的元素，以支持 setFocus 和提交时的错误聚焦。
 */
export default function EnrollmentFields() {
  const {control} = useFormContext<RegistrationValues>();

  return (
    <FieldSet>
      <FieldLegend className="text-primary border-primary mb-4 border-l-3 pl-3 font-semibold">报名信息</FieldLegend>
      <FieldGroup className="grid items-start gap-5 @md/field-group:grid-cols-2">
        <FormField name="course" label="报名班次" required>
          {(attributes) => (
            <Controller
              name="course"
              control={control}
              rules={rules.course}
              render={({field}) => (
                // onValueChange 返回直接值，field.onChange 同样支持这种值，不必伪造 DOM 事件。
                <Select name={field.name} items={courses} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger {...attributes} ref={field.ref} onBlur={field.onBlur} className="w-full">
                    <SelectValue placeholder="请选择班次" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>技术训练营</SelectLabel>
                      {courses.map((course) => (
                        <SelectItem key={course.value} value={course.value}>
                          {course.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
        <FormField name="organization" label="学校或公司" description="选填，支持搜索和清空。">
          {(attributes) => (
            <Controller
              name="organization"
              control={control}
              rules={rules.organization}
              render={({field}) => (
                // 搜索词与选中值分开；清空返回 null，与默认值和选填规则保持一致。
                <Combobox name={field.name} items={organizations} value={field.value} onValueChange={field.onChange}>
                  <ComboboxInput
                    {...attributes}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    placeholder="搜索机构"
                    showClear
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>没有匹配的机构</ComboboxEmpty>
                    <ComboboxList>
                      {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
            />
          )}
        </FormField>
        <FormField name="attendance" label="参与方式" required group className="@md/field-group:col-span-2">
          {(attributes) => (
            <Controller
              name="attendance"
              control={control}
              rules={rules.attendance}
              render={({field}) => (
                <RadioGroup
                  {...attributes}
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  className="flex flex-wrap gap-6"
                >
                  <div className="flex items-center gap-2">
                    {/* 组只有一个字段，ref 指向首个按钮；每个选项不再重复注册。 */}
                    <RadioGroupItem
                      id="basic-attendance-online"
                      ref={field.ref}
                      value="online"
                      aria-describedby={attributes['aria-describedby']}
                    />
                    <Label htmlFor="basic-attendance-online">线上参与</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      id="basic-attendance-offline"
                      value="offline"
                      aria-describedby={attributes['aria-describedby']}
                    />
                    <Label htmlFor="basic-attendance-offline">线下参与</Label>
                  </div>
                </RadioGroup>
              )}
            />
          )}
        </FormField>
      </FieldGroup>
    </FieldSet>
  );
}
