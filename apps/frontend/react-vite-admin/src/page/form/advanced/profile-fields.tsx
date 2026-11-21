import {useEffect, useState} from 'react';
import {Controller, useController, useFormContext, useWatch} from 'react-hook-form';

import {
  FieldGroup,
  Input,
  Label,
  NativeSelect,
  NativeSelectOption,
  RadioGroup,
  RadioGroupItem,
  Switch,
  BadInput,
} from '@badnpm/ui';
import {getCities, uploadCompanyLogo} from './api';
import {citiesByProvince, type ProfileValues} from './form-model';
import FormField from './form-field';
import LogoUpload from './logo-upload';

/** useController 与 Controller 等价地接管字段，适合将接入逻辑封装在业务控件组件内。 */
function CityField({province}: {province: string}) {
  const {control} = useFormContext<ProfileValues>();
  // 校验由父表单 resolver 负责；这里不再给 city 配置一份重复的 validate。
  const {field} = useController({name: 'address.city', control});
  const [options, setOptions] = useState<{province: string; cities: string[]}>({province: '', cities: []});
  // 给选项附带所属省份，切换后的首帧即进入 loading，不会短暂展示上一个省的城市。
  const loading = Boolean(province) && options.province !== province;
  useEffect(() => {
    let active = true;
    void getCities(province).then((cities) => {
      if (active) setOptions({province, cities});
    });
    return () => {
      // 只忽略旧结果，不会取消 sleep 本身；快速切换省份时旧响应不能覆盖新选项。
      active = false;
    };
  }, [province]);
  return (
    <FormField
      name="address.city"
      label="城市"
      required
      description={loading ? '正在加载城市…' : '选项由本地异步接口返回。'}
    >
      {(attributes) => (
        <NativeSelect
          {...attributes}
          {...field}
          // 异步选项加载后必须使用受控 value 恢复选中项，不能只依赖首次 defaultValue。
          value={field.value ?? ''}
          disabled={!province || loading}
          className="w-full"
          aria-busy={loading}
        >
          <NativeSelectOption value="">{loading ? '正在加载…' : '请选择城市'}</NativeSelectOption>
          {!loading &&
            options.cities.map((city) => (
              <NativeSelectOption key={city} value={city}>
                {city}
              </NativeSelectOption>
            ))}
        </NativeSelect>
      )}
    </FormField>
  );
}

/**
 * 字段接入层不定义校验规则，统一交给 schema.ts；动态区域通过真正卸载触发注销。
 * 不在渲染函数中直接 setValue/reset/setError，联动赋值放到用户事件处理器中。
 */
export default function ProfileFields({onLogoUploadingChange}: {onLogoUploadingChange: (uploading: boolean) => void}) {
  const {register, control, setValue, setError, clearErrors} = useFormContext<ProfileValues>();
  // 按字段名局部订阅，身份、开关变化决定 JSX 是否挂载，不必在根页面 watch 整表。
  const identity = useWatch({control, name: 'identity'});
  const province = useWatch({control, name: 'address.province'});
  const changePassword = useWatch({control, name: 'security.changePassword'});

  return (
    <div className="@container/advanced-fields">
      <FieldGroup className="grid items-start gap-5 @md/advanced-fields:grid-cols-2">
        <FormField name="username" label="用户名" required description="失焦异步查重；admin、test、root 已被占用。">
          {(attributes) => (
            <Input {...attributes} {...register('username')} autoComplete="username" placeholder="4–20 位，字母开头" />
          )}
        </FormField>
        <FormField name="email" label="联系邮箱" required description="used@example.com 可触发提交时的邮箱冲突。">
          {(attributes) => <Input {...attributes} {...register('email')} type="email" autoComplete="email" />}
        </FormField>
        <div className="@md/advanced-fields:col-span-2">
          <FormField
            name="identity"
            label="账户身份"
            required
            description="切换为个人后，企业字段会注销，其值和错误会被移除。"
          >
            {(attributes) => (
              <Controller
                name="identity"
                control={control}
                render={({field}) => (
                  <RadioGroup
                    {...attributes}
                    aria-label="账户身份"
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem id="advanced-personal" ref={field.ref} value="personal" />
                      <Label htmlFor="advanced-personal">个人</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem id="advanced-company" value="company" />
                      <Label htmlFor="advanced-company">企业</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            )}
          </FormField>
        </div>
        {/* shouldUnregister=true 使这些实际卸载的字段移除值和错误；CSS 隐藏达不到同样效果。 */}
        {identity === 'company' && (
          <>
            <FormField name="company.name" label="企业名称" required>
              {(attributes) => <Input {...attributes} {...register('company.name')} placeholder="企业全称" />}
            </FormField>
            <FormField
              name="company.creditCode"
              label="统一社会信用代码"
              required
              description="仅进行格式校验，不验证企业真实性。"
            >
              {(attributes) => (
                <Input {...attributes} {...register('company.creditCode')} placeholder="18 位大写字母或数字" />
              )}
            </FormField>
          </>
        )}
        {identity === 'company' && (
          <div className="@md/advanced-fields:col-span-2">
            <FormField name="company.logo" label="企业 Logo" description="选填，支持 PNG、JPEG，最大 2MB。">
              {(attributes) => (
                <Controller
                  name="company.logo"
                  control={control}
                  // 初次挂载没有 Logo 时用 null，避免受控字段使用 undefined 表示清空。
                  defaultValue={null}
                  render={({field}) => (
                    <LogoUpload
                      {...attributes}
                      ref={field.ref}
                      name={field.name}
                      value={field.value ?? null}
                      disabled={field.disabled}
                      // 控件只接收上传函数，不直接导入 RHF/API，便于复用和替换真实服务。
                      upload={uploadCompanyLogo}
                      onUploadingChange={onLogoUploadingChange}
                      onUploadError={(message) => setError('company.logo', {type: 'upload', message})}
                      onBlur={field.onBlur}
                      onChange={(value) => {
                        // 控件只在上传成功（或删除/拒绝非法选择）时交值；等待中保留旧值。
                        // 写值后再 onBlur，使选择完成立即按 onBlur 模式校验并标记 touched。
                        field.onChange(value);
                        field.onBlur();
                      }}
                    />
                  )}
                />
              )}
            </FormField>
          </div>
        )}
        <FormField name="address.province" label="省份" required description="切换省份会清空城市，并重新加载选项。">
          {(attributes) => (
            <NativeSelect
              {...attributes}
              {...register('address.province', {
                onChange: () => {
                  // 省份变化先清空依赖字段，并更新其 dirty/touched。
                  // 暂不 shouldValidate，避免选项还在加载就立刻报“请选择城市”；同步删旧错误。
                  setValue('address.city', '', {shouldDirty: true, shouldTouch: true});
                  clearErrors('address.city');
                },
              })}
              className="w-full"
            >
              <NativeSelectOption value="">请选择省份</NativeSelectOption>
              {Object.keys(citiesByProvince).map((item) => (
                <NativeSelectOption key={item} value={item}>
                  {item}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <CityField province={province ?? ''} />
        <div className="@md/advanced-fields:col-span-2">
          <FormField
            name="security.changePassword"
            label="修改密码"
            description="关闭后注销密码字段；保存成功后也会清空密码。"
          >
            {(attributes) => (
              <Controller
                name="security.changePassword"
                control={control}
                render={({field}) => (
                  <div>
                    <Switch
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
        </div>
        {/* 关闭时两个 Controller 卸载并注销，密码不会作为隐藏残留值被提交。 */}
        {changePassword && (
          <>
            <FormField
              name="security.password"
              label="新密码"
              required
              description="修改后失焦，会同时重新校验确认密码。"
            >
              {(attributes) => (
                <Controller
                  name="security.password"
                  control={control}
                  rules={{
                    // 依赖方向是“新密码校验后，再校验确认密码”。schema 会比较两者，
                    // deps 让确认密码字段的错误也刷新，不必等用户再次点击确认密码框。
                    deps: ['security.confirmation'],
                  }}
                  render={({field}) => (
                    // BadInput 暴露 focus/select 句柄，使用 Controller 传 ref，不直接 register。
                    <BadInput
                      {...attributes}
                      {...field}
                      value={field.value ?? ''}
                      type="password"
                      autoComplete="new-password"
                      placeholder="至少 8 位"
                    />
                  )}
                />
              )}
            </FormField>
            <FormField name="security.confirmation" label="确认密码" required>
              {(attributes) => (
                <Controller
                  name="security.confirmation"
                  control={control}
                  render={({field}) => (
                    <BadInput
                      {...attributes}
                      {...field}
                      value={field.value ?? ''}
                      type="password"
                      autoComplete="new-password"
                      placeholder="再次输入新密码"
                    />
                  )}
                />
              )}
            </FormField>
          </>
        )}
      </FieldGroup>
    </div>
  );
}
