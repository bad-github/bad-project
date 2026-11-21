import {Controller, useFormContext} from 'react-hook-form';
import {MailIcon} from 'lucide-react';

import {
  FieldGroup,
  FieldLegend,
  FieldSet,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
  Textarea,
  BadInput,
} from '@badnpm/ui';
import FormField from './form-field';
import {regions, rules, type RegistrationValues} from './form-model';

/** 普通输入演示 register，密码演示带自定义 ref 句柄的受控组件接入。 */
export default function ProfileFields() {
  // 从 Provider 获取实例，不能在子分区再次 useForm，否则字段会分属不同的提交上下文。
  const {register, control} = useFormContext<RegistrationValues>();

  return (
    <FieldSet>
      <FieldLegend className="text-primary border-primary mb-4 border-l-3 pl-3 font-semibold">基本资料</FieldLegend>
      <FieldGroup className="grid items-start gap-5 @md/field-group:grid-cols-2">
        <FormField name="name" label="姓名" required>
          {/* register 提供 name/onChange/onBlur/ref：缺少 ref 会影响取值、重置与错误聚焦。 */}
          {(attributes) => (
            <Input {...attributes} {...register('name', rules.name)} autoComplete="name" placeholder="你的姓名" />
          )}
        </FormField>
        <FormField name="age" label="年龄" required>
          {/* type=number 的原生事件仍可能给出字符串；rules.age.setValueAs 统一转成 number|null。 */}
          {(attributes) => (
            <Input
              {...attributes}
              {...register('age', rules.age)}
              type="number"
              min={16}
              max={80}
              step={1}
              placeholder="16–80"
            />
          )}
        </FormField>
        <FormField name="email" label="联系邮箱" required>
          {(attributes) => (
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>
                  <MailIcon aria-hidden="true" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                {...attributes}
                {...register('email', rules.email)}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </InputGroup>
          )}
        </FormField>
        <FormField name="password" label="账号密码" required description="密码长度为 8–64 位。">
          {/* BadInput 的 ref 是 focus/select 句柄，不能当原生 input 节点交给 register。
              Controller 传递受控 value、onChange、onBlur 和 ref；不再对密码额外 register。 */}
          {(attributes) => (
            <Controller
              name="password"
              control={control}
              rules={rules.password}
              render={({field}) => (
                <BadInput
                  {...attributes}
                  {...field}
                  // 始终传字符串，防止 undefined 引发受控/非受控切换；显隐只由 BadInput 管理。
                  value={field.value ?? ''}
                  type="password"
                  autoComplete="new-password"
                  placeholder="至少 8 位"
                />
              )}
            />
          )}
        </FormField>
        <FormField name="region" label="所在地区" required>
          {(attributes) => (
            <NativeSelect {...attributes} {...register('region', rules.region)} className="w-full">
              <NativeSelectOption value="">请选择地区</NativeSelectOption>
              <NativeSelectOptGroup label="可选地区">
                {regions.map((region) => (
                  <NativeSelectOption key={region} value={region}>
                    {region}
                  </NativeSelectOption>
                ))}
              </NativeSelectOptGroup>
            </NativeSelect>
          )}
        </FormField>
        <FormField
          name="introduction"
          label="自我介绍"
          description="选填，最多 200 个字符。"
          className="@md/field-group:col-span-2"
        >
          {(attributes) => (
            <Textarea
              {...attributes}
              {...register('introduction', rules.introduction)}
              rows={3}
              placeholder="你的技术背景，以及希望在训练营收获什么…"
            />
          )}
        </FormField>
      </FieldGroup>
    </FieldSet>
  );
}
