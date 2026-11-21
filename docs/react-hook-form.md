# React Hook Form 知识点与实践指南

## 阅读范围与版本约定

本文统一按 **React Hook Form 7.90.0** 总结知识点。这是 **2026-10-19** 核对时的最新稳定版，以官方版本源码、类型声明和发布记录为依据。

| 项目        | 版本与约定                                                          |
| ----------- | ------------------------------------------------------------------- |
| 核心库      | React Hook Form 7.90.0，全文采用这一版本的 API 和语义               |
| 示例环境    | React 19、TypeScript、Vite                                          |
| Schema 校验 | 可选使用 `@hookform/resolvers` 与 Zod，示例保留 Zod 3/4 通用写法    |
| 预发布版本  | 不把 React Hook Form 8 的 beta 特性纳入稳定版指南                   |
| 项目关联    | 后台与 UI 包已统一使用 7.90.0，树形表单章节结合仓库实现说明设计思路 |

本文覆盖公开 API、配置项、状态、字段类型、动态表单、性能、测试和工程场景。`control._subjects` 等私有成员只用于理解边界，不作为业务 API 学习。独立生态包会明确标注，需要按各包的兼容要求安装。

代码块分为独立组件和局部片段。独立组件可以放入 `.tsx` 文件；局部片段中的 `form` 表示所在组件通过 `useForm<对应类型>()` 创建的实例。涉及后端的 `/api/*` 地址是接口约定示例，需要由实际服务实现。每个示例有自己的表单类型，不要求把所有代码拼在一个文件中。

建议先学习数据模型与基础表单，再学习字段接入和校验，随后学习状态订阅、动态数组，最后阅读虚拟列表和项目源码。文档中的标题均不使用编号。

版本来源：[7.90.0 官方发布说明](https://github.com/react-hook-form/react-hook-form/releases/tag/v7.90.0)、[7.90.0 源码与类型](https://github.com/react-hook-form/react-hook-form/tree/v7.90.0/src)。实际依赖版本由项目清单与锁文件管理。

### 内容导航

- [表单模型与工作原理](#表单模型与工作原理)
- [基础表单与 useForm](#基础表单与-useform)
- [字段注册与值适配](#字段注册与值适配)
- [受控组件接入](#受控组件接入)
- [校验体系](#校验体系)
- [表单状态与订阅](#表单状态与订阅)
- [读取、修改与重置数据](#读取修改与重置数据)
- [错误处理与提交](#错误处理与提交)
- [组件拆分、上下文与外部控制器](#组件拆分上下文与外部控制器)
- [动态数组与嵌套表单](#动态数组与嵌套表单)
- [特殊控件与工程场景](#特殊控件与工程场景)
- [TypeScript 组件设计](#typescript-组件设计)
- [大表单性能与虚拟列表](#大表单性能与虚拟列表)
- [测试与调试](#测试与调试)
- [项目中的树形表单如何应用这些知识](#项目中的树形表单如何应用这些知识)
- [官方生态与可选扩展](#官方生态与可选扩展)
- [常见误区与学习练习](#常见误区与学习练习)
- [官方资料与版本核对入口](#官方资料与版本核对入口)

## 表单模型与工作原理

### React Hook Form 管理什么

React Hook Form，简称 RHF，管理字段注册、当前值、默认值、校验错误、交互状态和提交流程。组件负责界面，RHF 负责表单状态；网络请求、服务端数据缓存、路由和业务权限仍由应用处理。

理解一条完整链路：

```text
defaultValues 建立初始值与比较基线
  ↓
register / Controller 把控件连接到表单
  ↓
onChange / onBlur 更新值与交互状态
  ↓
按 mode 执行校验，更新 errors 和有效性状态
  ↓
handleSubmit 执行提交校验
  ↓
通过：调用 onValid；失败：调用 onInvalid
```

### 非受控字段与受控字段

非受控输入主要由 DOM 保存显示值。RHF 通过 `ref` 和事件读取、设置输入，不要求每次输入都让表单根组件重新渲染。原生 `input`、`textarea`、`select` 通常使用 `register`。

受控输入由 React 的 `value` 或 `checked` 决定显示值。只提供 `onValueChange`、`onCheckedChange` 等接口的组件，通常使用 `Controller` 或 `useController`。

| 控件特征                            | 接入方式              | 典型场景                    |
| ----------------------------------- | --------------------- | --------------------------- |
| 支持标准 `name/ref/onChange/onBlur` | `register`            | 原生输入、自定义 Input 外壳 |
| 使用 `value/onValueChange`          | `Controller`          | Select、Combobox            |
| 使用 `checked/onCheckedChange`      | `Controller`          | Switch、Checkbox            |
| 封装成反复复用的受控字段            | `useController`       | 业务日期字段、金额字段      |
| 无实际 DOM，仅保存程序生成的数据    | 手动注册与 `setValue` | 表单设计器、外部编辑器      |

非受控不等于完全不渲染：订阅错误、dirty 状态或值的组件仍会根据需要更新。不要把同一字段同时交给 RHF 和另一份 `useState` 管理。

### 字段名称就是数据路径

```ts
type Order = {
  customer: {name: string};
  items: {sku: string; quantity: number}[];
};

// register('customer.name') → {customer: {name: '张三'}}
// register('items.0.quantity') → {items: [{quantity: 2}]}
```

嵌套结构使用点路径，数组下标也使用点路径。TypeScript 中优先写 `items.0.sku`，不要依赖 `items[0].sku` 的类型推导。名称应稳定；名字变化通常代表字段身份变化。同一单选组或复选框组可以共享名称。

业务 ID 若包含 `.`，直接拼入字段名称会被解释为路径分隔符。应先编码、建立映射，或生成不含路径特殊字符的稳定 ID。

## 基础表单与 useForm

### 一个完整的注册表单

适用场景：理解注册、默认值、校验、错误显示和异步提交的最小完整流程。

```tsx
import {useForm, type SubmitHandler} from 'react-hook-form';

type SignupValues = {
  email: string;
  password: string;
  newsletter: boolean;
};

export default function SignupForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: {errors, isSubmitting},
  } = useForm<SignupValues>({
    defaultValues: {email: '', password: '', newsletter: false},
    mode: 'onBlur',
  });

  const onSubmit: SubmitHandler<SignupValues> = async (values) => {
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('注册失败，请重试');
    } catch (error) {
      setError('root.server', {
        type: 'server',
        message: error instanceof Error ? error.message : '网络错误',
      });
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="signup-email">邮箱</label>
      <input
        id="signup-email"
        type="email"
        autoComplete="email"
        aria-invalid={Boolean(errors.email)}
        aria-describedby={errors.email ? 'signup-email-error' : undefined}
        {...register('email', {
          required: '请输入邮箱',
          pattern: {value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确'},
        })}
      />
      {errors.email && (
        <p id="signup-email-error" role="alert">
          {errors.email.message}
        </p>
      )}

      <label htmlFor="signup-password">密码</label>
      <input
        id="signup-password"
        type="password"
        autoComplete="new-password"
        {...register('password', {
          required: '请输入密码',
          minLength: {value: 8, message: '至少输入八位'},
        })}
      />
      {errors.password && <p role="alert">{errors.password.message}</p>}

      <label>
        <input type="checkbox" {...register('newsletter')} />
        订阅通知
      </label>
      {errors.root?.server && <p role="alert">{errors.root.server.message}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '提交中…' : '注册'}
      </button>
    </form>
  );
}
```

`noValidate` 关闭浏览器提交时的默认校验提示，让 RHF 的错误 UI 主导体验。邮箱正则只是教学示例，真实邮箱规则和最终可用性仍由服务端校验。

### useForm 配置项总览

下表覆盖 `7.90.0` 的 `UseFormProps`。后续章节给出具体用法。

| 配置                        | 默认或含义                              | 适用场景                              |
| --------------------------- | --------------------------------------- | ------------------------------------- |
| `mode`                      | 默认 `onSubmit`                         | 首次提交前的自动校验时机              |
| `reValidateMode`            | 默认 `onChange`                         | 提交后的自动重新校验策略              |
| `defaultValues`             | 对象或异步函数，初始化后缓存            | 创建表单、加载编辑数据                |
| `values`                    | 外部传入的响应式表单值                  | 服务端数据驱动表单                    |
| `errors`                    | 外部错误对象                            | 注入服务端字段错误，保持引用稳定      |
| `resetOptions`              | 自动更新值时采用的 reset 保留策略       | 数据刷新但保留用户编辑                |
| `resolver`                  | 外部校验适配函数                        | Zod、Yup、自定义 schema               |
| `context`                   | 传给 resolver 的上下文                  | 动态规则、权限、业务状态              |
| `validate`                  | 表单级校验                              | 不使用 resolver 时校验字段组合        |
| `criteriaMode`              | 默认 `firstError`，可选 `all`           | 每个字段收集一条或多条错误            |
| `delayError`                | 错误展示延迟，毫秒                      | 降低输入期间错误闪烁                  |
| `shouldFocusError`          | 默认 `true`                             | 提交失败聚焦首个可聚焦错误字段        |
| `shouldUnregister`          | 默认 `false`                            | 控制卸载后是否删除字段数据            |
| `shouldUseNativeValidation` | 默认 `false`                            | 使用浏览器 Constraint Validation 提示 |
| `progressive`               | 默认 `false`                            | 把规则转发为原生 HTML 校验属性        |
| `disabled`                  | 默认 `false`                            | 禁用整个表单，受控组件需转交 disabled |
| `formControl`               | 由 `createFormControl` 创建的外部控制器 | 在 React 之外创建表单状态             |

### mode 与 reValidateMode

| mode        | 自动校验时机                   | 适用场景                     |
| ----------- | ------------------------------ | ---------------------------- |
| `onSubmit`  | 提交时                         | 初次学习、较大表单           |
| `onBlur`    | 失去焦点时                     | 输入过程中不打扰用户         |
| `onChange`  | 值变化时                       | 实时反馈，需关注校验成本     |
| `onTouched` | 首次 blur 后，再随 change 校验 | 首次输入宽松、触碰后及时反馈 |
| `all`       | blur 和 change 都校验          | 需要非常及时的反馈           |

```tsx
const form = useForm<{name: string}>({
  defaultValues: {name: ''},
  mode: 'onBlur',
  reValidateMode: 'onChange',
  delayError: 250,
});
```

`trigger` 和 `handleSubmit` 是显式发起校验，不受“尚未达到 mode 事件”的限制。使用 `Controller` 时必须传递 `field.onBlur`，否则 `onBlur/onTouched` 相关行为会缺失。`delayError` 延迟的是错误反馈，不是网络请求防抖。

### defaultValues、异步初始化与 isLoading

适用场景：编辑已有用户，首次进入页面加载数据。

```tsx
import {useForm} from 'react-hook-form';

type Profile = {name: string; city: string};

export function AsyncProfile() {
  const {
    register,
    handleSubmit,
    formState: {isLoading},
  } = useForm<Profile>({
    defaultValues: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('加载资料失败');
      const data = (await response.json()) as Partial<Profile>;
      return {name: data.name ?? '', city: data.city ?? ''};
    },
  });

  if (isLoading) return <p>加载中…</p>;
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input aria-label="姓名" {...register('name')} />
      <input aria-label="城市" {...register('city')} />
      <button type="submit">保存</button>
    </form>
  );
}
```

异步初始化失败需要应用提供加载错误边界、重试或预加载机制；不要假设 `formState.errors` 自动包含初始化网络异常。

`defaultValues` 被缓存，父组件重新传入另一个对象不会自动重新初始化。切换编辑记录通常用 `reset(newRecord)`，或者让表单组件以记录 ID 为 `key` 重新创建。默认值也是 `isDirty` 的比较基线，应尽量提供完整结构。

受控字段避免用 `undefined` 作为默认值或变更值。文本常用 `''`，开关用 `false`，多选用 `[]`；`null` 是否适用取决于控件和 schema。带原型方法的业务对象不适合作为默认值，日期对象与文件的脏值比较也需要额外设计。

### values、errors 与 resetOptions

适用场景：父层查询数据刷新，表单接收服务器更新，但不覆盖用户已修改的字段。

```tsx
import {useForm, type FieldErrors} from 'react-hook-form';

type Profile = {name: string; city: string};

export function SyncedProfile({
  serverValues,
  serverErrors,
}: {
  serverValues: Profile;
  serverErrors: FieldErrors<Profile>;
}) {
  const {
    register,
    formState: {errors, dirtyFields},
  } = useForm<Profile>({
    defaultValues: {name: '', city: ''},
    values: serverValues,
    errors: serverErrors,
    resetOptions: {keepDirtyValues: true, keepErrors: true},
  });

  return (
    <section>
      <input aria-label="姓名" {...register('name')} />
      <input aria-label="城市" {...register('city')} />
      <p>{errors.name?.message}</p>
      <p>{dirtyFields.name ? '姓名已修改' : '姓名未修改'}</p>
    </section>
  );
}
```

`values` 是持续同步入口，会按内部 reset 逻辑更新数据；默认也会更新默认值基线，除非设置 `keepDefaultValues`。`errors` 由外部维护时应保持引用稳定，例如存放在 state 或查询缓存中，不要每次 render 都构造新错误对象。

`keepDirtyValues` 依赖 dirtyFields 状态，应在 render 中订阅它。它只解决“哪些字段被覆盖”，不会自动解决多人编辑冲突、记录版本冲突和深层数组合并。

官方参考：[useForm](https://react-hook-form.com/docs/useform)、[useForm 官方文档源文件](https://github.com/react-hook-form/documentation/blob/master/src/content/docs/useform.mdx)。

## 字段注册与值适配

### register 的返回值与选项

`register(name, options)` 返回 `name`、`ref`、`onChange`、`onBlur`，特定配置下也返回原生校验属性。只传 `name` 或只传事件都不等于完整接入。

| 选项                     | 用途                                        |
| ------------------------ | ------------------------------------------- |
| `required`               | 必填，支持布尔值、消息、`{value, message}`  |
| `min`、`max`             | 数值或相应原生输入的范围                    |
| `minLength`、`maxLength` | 字符串或支持长度的数据校验                  |
| `pattern`                | 正则校验，避免带状态的 `/g` 正则            |
| `validate`               | 同步、异步、自定义多规则                    |
| `valueAsNumber`          | 在校验前转换为数字，空输入可能得到 `NaN`    |
| `valueAsDate`            | 在校验前转换为 `Date`，失败可能得到无效日期 |
| `setValueAs`             | 自定义输入转换；启用前两者时不会再采用它    |
| `value`                  | 注册时提供字段值，频繁重注册可能反复更新它  |
| `disabled`               | 禁用该字段，提交值处理与启用时不同          |
| `shouldUnregister`       | 为字段指定卸载清理行为                      |
| `onChange`、`onBlur`     | 注册层附加事件处理器                        |
| `deps`                   | 当前字段变化时需要一起重新校验的依赖字段    |

### 原生文本、单选、多选与复选框

适用场景：设置页中混合使用多种 HTML 控件。

```tsx
import {useForm} from 'react-hook-form';

type Preferences = {
  introduction: string;
  country: string;
  roles: string[];
  theme: string;
  topics: string[];
  enabled: boolean;
};

export function PreferencesForm() {
  const {register, handleSubmit} = useForm<Preferences>({
    defaultValues: {
      introduction: '',
      country: 'cn',
      roles: [],
      theme: 'light',
      topics: [],
      enabled: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <textarea aria-label="简介" {...register('introduction')} />
      <select aria-label="国家" {...register('country')}>
        <option value="cn">中国</option>
        <option value="jp">日本</option>
      </select>
      <select multiple aria-label="角色" {...register('roles')}>
        <option value="reader">读者</option>
        <option value="editor">编辑</option>
      </select>
      <label>
        <input type="radio" value="light" {...register('theme')} />
        浅色
      </label>
      <label>
        <input type="radio" value="dark" {...register('theme')} />
        深色
      </label>
      <label>
        <input type="checkbox" value="react" {...register('topics')} />
        React
      </label>
      <label>
        <input type="checkbox" value="typescript" {...register('topics')} />
        TypeScript
      </label>
      <label>
        <input type="checkbox" {...register('enabled')} />
        启用
      </label>
      <button type="submit">保存</button>
    </form>
  );
}
```

单个无业务 `value` 的 checkbox 通常对应布尔值；同名复选框组通常对应选中 value 的数组；radio 对应一个 value。是否允许 `false` 是业务问题：接受协议要求 `true`，普通开关则通常允许 `false`，不能一律使用同一种 required 规则。

### 数字、空值、日期与转换时机

适用场景：金额允许清空、零是合法输入，提交时希望得到 `number | null`。

```tsx
import {useForm} from 'react-hook-form';

type Invoice = {amount: number | null; issueDate: string};

function toNullableNumber(raw: unknown): number | null {
  if (raw === '' || raw === null || raw === undefined) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function InvoiceForm() {
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<Invoice>({
    defaultValues: {amount: null, issueDate: ''},
  });
  return (
    <form noValidate onSubmit={handleSubmit(console.log)}>
      <input
        aria-label="金额"
        type="number"
        step="0.01"
        {...register('amount', {
          setValueAs: toNullableNumber,
          validate: (value) => (value !== null && value >= 0) || '请输入非负金额',
        })}
      />
      <p>{errors.amount?.message}</p>
      <input aria-label="开票日期" type="date" {...register('issueDate', {required: '请选择日期'})} />
      <button type="submit">保存</button>
    </form>
  );
}
```

`valueAsNumber/valueAsDate/setValueAs` 不是默认值清洗器，服务端数据应在进入 `defaultValues/reset` 之前整理。`setValueAs` 的空值策略应与字段类型和 schema 保持一致。不要用 `Number(raw) || null`，它会把合法的 `0` 变成空值。

HTML 日期输入天然提供 `YYYY-MM-DD` 字符串。只有业务明确需要 `Date` 时才使用 `valueAsDate`，并处理无效日期和时区；生日、账期等本地日期通常更适合保留字符串。

### 自定义 Input、事件合并与 ref

适用场景：封装样式组件，仍保留原生非受控输入的性能与聚焦能力。

```tsx
import {forwardRef, type ComponentPropsWithoutRef} from 'react';
import {useForm} from 'react-hook-form';

const TextInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(function TextInput(props, ref) {
  return <input {...props} ref={ref} className="rounded border px-3 py-2" />;
});

export function CustomInputExample() {
  const {register} = useForm<{name: string}>({defaultValues: {name: ''}});
  const registration = register('name');
  return (
    <TextInput
      aria-label="姓名"
      {...registration}
      onChange={(event) => {
        void registration.onChange(event);
        console.log('附加逻辑', event.target.value);
      }}
    />
  );
}
```

React 19 也可以用 ref prop 方式封装，关键是最终把 RHF 的 ref 传给实际可输入节点。不要在展开 `register` 后覆盖事件却忘记调用原事件。若组件使用 `inputRef`，应将 `registration.ref` 映射到 `inputRef`。

### 手动注册与无 DOM 字段

适用场景：地图选点、独立代码编辑器，外部系统只给出业务值。

```tsx
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';

export function ManualField() {
  const {register, unregister, setValue, handleSubmit} = useForm<{coordinates: string}>({
    defaultValues: {coordinates: ''},
  });
  useEffect(() => {
    register('coordinates', {required: '请选择位置'});
    return () => unregister('coordinates');
  }, [register, unregister]);

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <button
        type="button"
        onClick={() =>
          setValue('coordinates', '121.47,31.23', {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          })
        }
      >
        模拟选点
      </button>
      <button type="submit">提交</button>
    </form>
  );
}
```

没有实际 ref 就无法自动聚焦，原生校验也无法作用于这个字段。常规可见受控控件优先使用 `Controller`。

官方参考：[register](https://react-hook-form.com/docs/useform/register)。

## 受控组件接入

### Controller 的 field、fieldState 与 formState

`Controller` 用 render prop 连接一个受控字段。

| 返回对象     | 主要成员                                       | 作用                 |
| ------------ | ---------------------------------------------- | -------------------- |
| `field`      | `value/onChange/onBlur/name/ref/disabled`      | 接到实际控件         |
| `fieldState` | `invalid/isDirty/isTouched/isValidating/error` | 当前字段状态         |
| `formState`  | 整表状态                                       | 只读取实际需要的状态 |

配置包括 `name`、`control`、`rules`、`defaultValue`、`shouldUnregister`、`disabled`、`exact` 和 `render`。已由 `useForm.defaultValues` 提供默认值时，通常不再单独设置 `defaultValue`。`rules` 支持字段校验，但不提供 `valueAsNumber/valueAsDate/setValueAs`，受控值应在 `onChange` 适配。

适用场景：组件用 `checked/onCheckedChange` 接口，而不是原生事件。下面自行实现最小 Switch，避免依赖某个 UI 库。

```tsx
import {Controller, useForm} from 'react-hook-form';
import type {Ref} from 'react';

function Switch({
  checked,
  onCheckedChange,
  onBlur,
  disabled,
  buttonRef,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  onBlur: () => void;
  disabled?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label="通知"
      aria-checked={checked}
      disabled={disabled}
      ref={buttonRef}
      onBlur={onBlur}
      onClick={() => onCheckedChange(!checked)}
    >
      {checked ? '开启通知' : '关闭通知'}
    </button>
  );
}

export function NotificationForm() {
  const {control, handleSubmit} = useForm<{notifications: boolean}>({
    defaultValues: {notifications: false},
  });
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <Controller
        control={control}
        name="notifications"
        render={({field}) => (
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
            disabled={field.disabled}
            buttonRef={field.ref}
          />
        )}
      />
      <button type="submit">保存</button>
    </form>
  );
}
```

不要在 `Controller` 中再次对同名字段调用 `register`。控件变化时直接用 `field.onChange`，一般不需要再调用 `setValue`。

### useController 封装业务字段

适用场景：多个页面重复使用相同的受控金额输入。

```tsx
import {useController, useForm, type Control} from 'react-hook-form';

type Payment = {amount: number | null};

function AmountField({control}: {control: Control<Payment>}) {
  const {field, fieldState} = useController({
    control,
    name: 'amount',
    rules: {validate: (value) => (value !== null && value >= 0) || '请输入非负金额'},
  });
  return (
    <label>
      金额
      <input
        type="number"
        name={field.name}
        ref={field.ref}
        disabled={field.disabled}
        value={field.value ?? ''}
        onBlur={field.onBlur}
        onChange={(event) => {
          const raw = event.target.value;
          const value = raw === '' ? null : Number(raw);
          field.onChange(value === null || Number.isFinite(value) ? value : null);
        }}
        aria-invalid={fieldState.invalid}
      />
      {fieldState.error && <span role="alert">{fieldState.error.message}</span>}
    </label>
  );
}

export function PaymentForm() {
  const {control, handleSubmit} = useForm<Payment>({defaultValues: {amount: null}});
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <AmountField control={control} />
      <button type="submit">保存</button>
    </form>
  );
}
```

`useController` 必须遵守 Hooks 规则，不能在条件分支或循环中调用。动态控件类型应拆成独立子组件，每种子组件在顶层调用对应 Hook。

官方参考：[Controller](https://react-hook-form.com/docs/usecontroller/controller)、[useController](https://react-hook-form.com/docs/usecontroller)。

## 校验体系

### 内置规则与多条错误

适用场景：无需 schema 库的简单表单，需要同时展示密码的多项规则。

```tsx
import {useForm} from 'react-hook-form';

export function PasswordRules() {
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<{password: string}>({
    defaultValues: {password: ''},
    mode: 'onBlur',
    criteriaMode: 'all',
  });
  return (
    <form noValidate onSubmit={handleSubmit(console.log)}>
      <input
        aria-label="密码"
        type="password"
        {...register('password', {
          required: '请输入密码',
          validate: {
            length: (value) => value.length >= 8 || '至少八位',
            number: (value) => /\d/.test(value) || '至少包含一个数字',
            letter: (value) => /[a-z]/i.test(value) || '至少包含一个字母',
          },
        })}
      />
      {Object.entries(errors.password?.types ?? {}).map(([rule, message]) => (
        <p key={rule} role="alert">
          {String(message)}
        </p>
      ))}
      <button type="submit">保存</button>
    </form>
  );
}
```

`validate` 返回 `true` 或 `undefined` 表示通过，返回字符串表示失败消息；返回 `false` 也表示失败，但没有可读消息。多规则对象的 key 会成为错误类型。`criteriaMode: 'all'` 只改变错误收集方式，不会把 `mode` 改成实时校验。

### 跨字段校验与 deps

适用场景：确认密码需要与原密码一致，而且原密码变化后确认密码要重新校验。

```tsx
import {useForm} from 'react-hook-form';

type Passwords = {password: string; confirm: string};

export function ConfirmPassword() {
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<Passwords>({
    defaultValues: {password: '', confirm: ''},
    mode: 'onChange',
  });
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input aria-label="密码" type="password" {...register('password', {required: '请输入密码', deps: ['confirm']})} />
      <input
        aria-label="确认密码"
        type="password"
        {...register('confirm', {
          required: '请确认密码',
          validate: (value, values) => value === values.password || '两次密码不一致',
        })}
      />
      <p role="alert">{errors.confirm?.message}</p>
      <button type="submit">保存</button>
    </form>
  );
}
```

这里把 `deps: ['confirm']` 放在变化源 `password` 上：password 的变更需要触发 confirm 校验。`deps` 不是一个自动推导的依赖图，复杂联动可以显式调用 `trigger('confirm')`。使用 resolver 时，跨字段关系应在 schema 或自定义 resolver 中定义，并测试局部重新校验能否更新目标错误。

### 异步校验

适用场景：离开用户名输入框时检查名称是否可用。

```tsx
import {useForm} from 'react-hook-form';

type Account = {username: string};

export function UsernameForm() {
  const {
    register,
    handleSubmit,
    formState: {errors, validatingFields},
  } = useForm<Account>({
    defaultValues: {username: ''},
    mode: 'onBlur',
  });
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input
        aria-label="用户名"
        {...register('username', {
          required: '请输入用户名',
          validate: async (value) => {
            if (!value.trim()) return '请输入用户名';
            try {
              const response = await fetch(`/api/usernames/check?name=${encodeURIComponent(value)}`);
              if (!response.ok) return '暂时无法校验，请稍后重试';
              const result = (await response.json()) as {available: boolean};
              return result.available || '用户名已被使用';
            } catch {
              return '网络异常，无法校验用户名';
            }
          },
        })}
      />
      {validatingFields.username && <p role="status">检查中…</p>}
      <p role="alert">{errors.username?.message}</p>
      <button type="submit">提交</button>
    </form>
  );
}
```

RHF 不会自动为请求防抖。高频校验还需要设计请求取消、缓存、过期结果处理与提交等待；不要简单加一个 `setTimeout` 就认为异步校验的并发问题已经解决。服务端仍必须在实际写入时检查唯一性。

### resolver 与 Zod

适用场景：字段较多、需要统一类型与规则，或有嵌套和跨字段约束。

```tsx
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';

const schema = z
  .object({
    email: z.string().email('邮箱格式不正确'),
    password: z.string().min(8, '密码至少八位'),
    confirm: z.string(),
    age: z.number().int('请输入整数').min(18, '必须年满十八岁'),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirm) {
      ctx.addIssue({code: 'custom', path: ['confirm'], message: '两次密码不一致'});
    }
  });

type Values = z.infer<typeof schema>;

export function SchemaForm() {
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {email: '', password: '', confirm: '', age: 18},
  });
  return (
    <form noValidate onSubmit={handleSubmit(console.log)}>
      <input aria-label="邮箱" {...register('email')} />
      <input aria-label="密码" type="password" {...register('password')} />
      <input aria-label="确认密码" type="password" {...register('confirm')} />
      <input aria-label="年龄" type="number" {...register('age', {valueAsNumber: true})} />
      <p>{errors.email?.message}</p>
      <p>{errors.confirm?.message}</p>
      <p>{errors.age?.message}</p>
      <button type="submit">保存</button>
    </form>
  );
}
```

使用 resolver 后，应把校验规则集中到 schema，不依赖 RHF 内置规则与 resolver 叠加执行。`register` 中的输入转换仍是另一件事，示例的 `valueAsNumber` 负责把 DOM 字符串转换成 schema 需要的数字。

`zodResolver(schema, schemaOptions, resolverOptions)` 的第三个参数支持 `mode: 'async' | 'sync'` 和 `raw`。默认异步解析并返回解析结果；`raw: true` 表示成功后返回原始输入，不采用 schema 转换后的输出。含异步 refinement 的 schema 不可使用同步解析。

解析器支持 Zod、Yup、Joi、Ajv、Valibot 等多种生态，但不同解析器的类型推导与 `criteriaMode: 'all'` 支持不同，需要查看对应适配器说明。升级 Zod 时还应核对 schema API、错误定制和 resolver 的输入输出类型，不能仅升级 RHF 就假设其余依赖也已同步升级。

### 输入类型与输出类型不同

适用场景：界面编辑文本，校验成功后输出规范化值。

```tsx
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';

const schema = z.object({
  email: z
    .string()
    .trim()
    .email('邮箱不合法')
    .transform((value) => value.toLowerCase()),
  amount: z
    .string()
    .min(1, '请输入金额')
    .refine((value) => Number.isFinite(Number(value)), '请输入合法数字')
    .transform((value) => Number(value)),
});
type Input = z.input<typeof schema>;
type Output = z.output<typeof schema>;

export function TransformForm() {
  const {register, handleSubmit} = useForm<Input, undefined, Output>({
    resolver: zodResolver(schema),
    defaultValues: {email: '', amount: ''},
  });
  return (
    <form
      onSubmit={handleSubmit((data) => {
        // data.amount 是 number；getValues/watch 仍针对 Input。
        console.log(data.amount.toFixed(2), data.email);
      })}
    >
      <input aria-label="邮箱" {...register('email')} />
      <input aria-label="金额" {...register('amount')} />
      <button type="submit">保存</button>
    </form>
  );
}
```

### 自定义 resolver 与 context

适用场景：规则依赖权限、订单状态，或动态表单需要自定义校验。

```tsx
import {useForm, type Resolver, type ResolverResult} from 'react-hook-form';

type Values = {amount: number};
type ValidationContext = {limit: number};

const resolver: Resolver<Values, ValidationContext> = (values, context, options): ResolverResult<Values> => {
  const limit = context?.limit ?? 100;
  // options 包括 names、fields、criteriaMode、shouldUseNativeValidation。
  // 此示例无论触发范围如何，都校验完整数据。
  if (!Number.isFinite(values.amount) || values.amount > limit || values.amount < 0) {
    return {
      values: {},
      errors: {amount: {type: 'limit', message: `金额必须在 0 到 ${limit} 之间`}},
    };
  }
  return {values, errors: {}};
};

export function ContextForm() {
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<Values, ValidationContext>({
    resolver,
    context: {limit: 500},
    defaultValues: {amount: 0},
  });
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input aria-label="金额" type="number" {...register('amount', {valueAsNumber: true})} />
      <p>{errors.amount?.message}</p>
      <button type="submit">保存</button>
    </form>
  );
}
```

成功返回 `{values: 解析后的值, errors: {}}`，失败返回 `{values: {}, errors: 嵌套错误对象}`。错误结构应匹配数据结构，例如 `errors.items[0].sku`，不要把 `items.0.sku` 当作 errors 对象的平面 key。

`options.names` 不可靠地表示“提交还是单字段编辑”：提交时也可能只包含已注册字段。虚拟列表中还有尚未挂载的字段，不能用 names 数量推断是否可以跳过整表校验。

### 表单级 validate

适用场景：不使用 resolver，希望对整个表单组合做额外业务检查。它与 `register(..., {validate})` 不同：前者看整表，后者看单字段。

```tsx
import {useForm} from 'react-hook-form';

export function AllocationForm() {
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<{a: number; b: number}>({
    defaultValues: {a: 50, b: 50},
    validate: ({formValues}) => formValues.a + formValues.b === 100 || '分配比例之和必须为 100',
  });
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input aria-label="比例 A" type="number" {...register('a', {valueAsNumber: true})} />
      <input aria-label="比例 B" type="number" {...register('b', {valueAsNumber: true})} />
      <p role="alert">{errors.form?.message}</p>
      <button type="submit">保存</button>
    </form>
  );
}
```

回调接收 `{formValues, formState, eventType, name}`，可返回 Promise。返回 `true` 表示通过，返回字符串作为 `errors.form.message`，返回 `false` 表示失败但没有自定义消息。也可以返回按字段组织的 `{type, message}` 对象，错误位于 `form` 命名空间，而不是直接写入对应字段的 errors。复杂嵌套校验可使用 resolver。

配置 resolver 时，表单级 `validate` 不会同时执行。需要组合规则时，应在一个 schema/resolver 中完成。

适用场景：把组合规则失败归属到某个字段对应的表单级错误，并分别展示。

```tsx
import {get, useForm} from 'react-hook-form';

export function AllocationFieldErrors() {
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<{a: number; b: number}>({
    defaultValues: {a: 50, b: 50},
    validate: ({formValues}) => {
      if (formValues.a + formValues.b !== 100) {
        return {a: {type: 'total', message: '请调整比例 A，使总和等于 100'}};
      }
      return true;
    },
  });
  const formError = get(errors, 'form.a.message') as string | undefined;
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input aria-label="比例 A" type="number" {...register('a', {valueAsNumber: true})} />
      <input aria-label="比例 B" type="number" {...register('b', {valueAsNumber: true})} />
      <p role="alert">{formError}</p>
      <button type="submit">保存</button>
    </form>
  );
}
```

此时读取 `form.a`，不是 `a`。7.90.0 的 `errors.form` 类型主要描述全局错误，访问其动态子路径可以使用 `get`，避免为展示消息把整张表单的类型改成 any。

### 浏览器原生校验与 progressive

适用场景：轻量原生表单，或服务端渲染后、JavaScript 接管前仍需要 HTML 约束。

```tsx
import {useForm} from 'react-hook-form';

export function NativeValidationForm() {
  const {register, handleSubmit} = useForm<{name: string}>({
    shouldUseNativeValidation: true,
    progressive: true,
  });
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input
        aria-label="姓名"
        {...register('name', {
          required: '请输入姓名',
          minLength: {value: 2, message: '至少两个字符'},
        })}
      />
      <button type="submit">保存</button>
    </form>
  );
}
```

`shouldUseNativeValidation` 使用 `setCustomValidity/reportValidity`，要求字段有真实 DOM ref、错误消息为字符串，官方推荐配合 `onSubmit/onChange`。`progressive` 把 required、min、max、长度和 pattern 等规则作为 DOM 属性转发，两者作用不同，可以组合。

官方参考：[校验配置](https://react-hook-form.com/docs/useform)、[resolvers](https://github.com/react-hook-form/resolvers)。

## 表单状态与订阅

### formState 的全部状态

| 属性                 | 含义与注意事项                                                      |
| -------------------- | ------------------------------------------------------------------- |
| `isDirty`            | 当前整表值相对 defaultValues 是否发生变化，改回默认值可以恢复 false |
| `dirtyFields`        | 被标记为脏的字段结构，不能直接等同于 isDirty                        |
| `touchedFields`      | 已触碰字段，常在 blur 或 shouldTouch 时更新                         |
| `errors`             | 字段与全局错误                                                      |
| `isValid`            | 校验有效性；不应仅按 errors 的数量自行推导                          |
| `isValidating`       | 正在校验                                                            |
| `validatingFields`   | 正在异步校验的字段                                                  |
| `isSubmitting`       | handleSubmit 的提交处理尚未完成                                     |
| `isSubmitted`        | 已经执行过提交                                                      |
| `isSubmitSuccessful` | RHF 提交处理成功完成，不代表应用已确认服务器持久化成功              |
| `submitCount`        | 提交次数                                                            |
| `isLoading`          | 异步 defaultValues 正在加载，不代表所有网络请求                     |
| `isReady`            | useForm 的状态订阅初始化就绪                                        |
| `disabled`           | 全表禁用状态                                                        |
| `defaultValues`      | 当前默认值基线，可由 reset 等更新                                   |

`setError` 可使当前有效性变为失败，但后续 `isValid` 仍由校验结果更新；`clearErrors` 不会替你证明数据有效。若在 onSubmit 中吞掉网络异常且未形成 RHF 错误，`isSubmitSuccessful` 也不能作为服务器成功的唯一信号。业务成功状态可以显式记录，或用成功响应驱动后续 UI。

### Proxy 与按需订阅

RHF 使用 Proxy 跟踪读取了哪些 formState 属性。应在组件 render 中读取需要的属性，才能建立对应订阅。

```tsx
const {formState} = useForm<{name: string}>({defaultValues: {name: ''}});
const {isDirty, isValid, isSubmitting} = formState;

// 在 render 阶段读取所有依赖，再计算按钮状态。
const disabled = !isDirty || !isValid || isSubmitting;
```

避免只在点击回调里首次读取状态，然后期待 UI 自动订阅；也避免通过短路表达式跳过尚需订阅的属性。不要把整个 formState 展开或 JSON.stringify 后放在大型表单根节点，这会扩大订阅范围。

### watch、useWatch、getValues、subscribe 的选择

| API         | 获得什么               | 是否订阅 | 更新位置                      | 适用场景                   |
| ----------- | ---------------------- | -------- | ----------------------------- | -------------------------- |
| `watch`     | 渲染时的字段值         | 是       | 通常触发 useForm 所在组件更新 | 小表单的条件显示           |
| `useWatch`  | 订阅的字段值或派生结果 | 是       | 调用该 Hook 的组件            | 局部联动、实时金额         |
| `getValues` | 调用瞬间的数据         | 否       | 不会主动触发渲染              | 点击按钮时取值             |
| `subscribe` | 变更通知               | 是       | 不通过它驱动 React render     | 外部同步、日志、草稿持久化 |

### watch 的重载

适用场景：小表单根据开关显示补充说明。

```tsx
import {useForm} from 'react-hook-form';

export function ConditionalForm() {
  const {register, watch, handleSubmit} = useForm<{hasNote: boolean; note: string}>({
    defaultValues: {hasNote: false, note: ''},
  });
  const hasNote = watch('hasNote');
  // watch(['hasNote', 'note']) 返回数组；watch() 返回整表。
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <label>
        <input type="checkbox" {...register('hasNote')} />
        填写备注
      </label>
      {hasNote && <textarea aria-label="备注" {...register('note')} />}
      <button type="submit">保存</button>
    </form>
  );
}
```

没有默认值时，首轮 watch 可能得到 `undefined`；可以提供 `watch('field', fallback)`，更常见的做法是提供完整 defaultValues。

旧式 `watch(callback)` 返回 `{unsubscribe}`，适合识别旧代码，但新代码优先用 `subscribe`。不要把 `watch()` 每次返回的对象直接作为 effect 依赖，再在 effect 中无条件写入表单或 setState，容易形成循环。

### useWatch 与 compute

适用场景：只有总价组件需要随数量和单价变化更新。

```tsx
import {useForm, useWatch, type Control} from 'react-hook-form';

type Cart = {price: number; quantity: number; memo: string};

function Total({control}: {control: Control<Cart>}) {
  const total = useWatch({
    control,
    name: ['price', 'quantity'] as const,
    exact: true,
    compute: ([price, quantity]) => {
      const result = price * quantity;
      return Number.isFinite(result) ? result : 0;
    },
  });
  return <output>合计：{total.toFixed(2)}</output>;
}

export function CartForm() {
  const {register, control} = useForm<Cart>({
    defaultValues: {price: 10, quantity: 1, memo: ''},
  });
  return (
    <section>
      <input aria-label="单价" type="number" {...register('price', {valueAsNumber: true})} />
      <input aria-label="数量" type="number" {...register('quantity', {valueAsNumber: true})} />
      <input aria-label="备注" {...register('memo')} />
      <Total control={control} />
    </section>
  );
}
```

配置包括 `control/name/defaultValue/disabled/exact/compute`。不传 name 时订阅整表；单 name 返回单值，数组 name 返回对应值数组。`compute` 应是纯函数，用来派生所需结果，不要在其中修改表单。

`exact: true` 精确匹配字段名；它不是跨字段依赖解析器。订阅父对象但想响应其子字段变化时，不应盲目开启 exact。

在订阅建立前就调用 `setValue`，可能错过通知。应先建立订阅，再执行更新；需要处理提前更新的复杂组件，可以结合 `getValues` 获取当前快照，但不要把不订阅的快照当作响应式数据源。

### useFormState 与 getFieldState

适用场景：每个字段只显示自己的错误，不让表单根组件订阅所有 errors。

```tsx
import {useForm, useFormState, type UseFormReturn} from 'react-hook-form';

type Values = {email: string; note: string};

function EmailError({form}: {form: UseFormReturn<Values>}) {
  const state = useFormState({control: form.control, name: 'email', exact: true});
  const field = form.getFieldState('email', state);
  return field.error ? <p role="alert">{field.error.message}</p> : null;
}

export function LocalErrors() {
  const form = useForm<Values>({defaultValues: {email: '', note: ''}});
  return (
    <form onSubmit={form.handleSubmit(console.log)}>
      <input aria-label="邮箱" {...form.register('email', {required: '请输入邮箱'})} />
      <EmailError form={form} />
      <textarea aria-label="备注" {...form.register('note')} />
      <button type="submit">保存</button>
    </form>
  );
}
```

`useFormState` 支持 `control/name/exact/disabled`，返回完整 formState 形状，但订阅应放在消费状态的最小组件中。name 限定字段相关通知，不是把所有整表状态变成该字段的状态。

`getFieldState(name, formState?)` 返回 `invalid/isDirty/isTouched/isValidating/error`。它本身不是新的 React 订阅 Hook；应已有对应状态订阅，或传入已由 `useFormState` 建立订阅的状态。

### subscribe 与副作用

适用场景：编辑时延迟保存本地草稿，不让每次输入都更新表单根组件。

```tsx
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';

export function DraftForm() {
  const {register, subscribe} = useForm<{title: string; body: string}>({
    defaultValues: {title: '', body: ''},
  });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribe({
      formState: {values: true},
      callback: ({values}) => {
        // 在回调里截取本次快照，避免延时后读取到被继续修改的对象。
        const draft = JSON.stringify(values);
        clearTimeout(timer);
        timer = setTimeout(() => localStorage.setItem('article-draft', draft), 500);
      },
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [subscribe]);
  return (
    <section>
      <input aria-label="标题" {...register('title')} />
      <textarea aria-label="正文" {...register('body')} />
    </section>
  );
}
```

`subscribe` 支持 `name`、`exact`、`formState` 和 `callback`，返回取消订阅函数。可选择 `values/defaultValues/isDirty/dirtyFields/touchedFields/errors/isValid/isValidating/validatingFields/isSubmitted/submitCount` 等声明支持的状态。选择器不是 formState 全部属性的任意集合，例如不能直接添加 `isSubmitting: true`。

回调仅用于观察和外部副作用，不在其中调用 `setValue/reset/trigger` 或用 setState 驱动 React UI；需要 UI 更新使用 `useWatch/useFormState`。真正的远程自动保存还需处理请求顺序、版本冲突、失败重试和保存中状态。

### 订阅默认值基线

适用场景：自动保存或服务器回填后，外部缓存需要知道表单的默认值基线发生了变化。

```tsx
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';

export function DefaultValuesSubscription() {
  const {register, subscribe, resetDefaultValues, getValues} = useForm<{title: string}>({
    defaultValues: {title: ''},
  });
  useEffect(
    () =>
      subscribe({
        formState: {defaultValues: true},
        callback: ({defaultValues}) => console.log('默认值基线', defaultValues),
      }),
    [subscribe]
  );

  return (
    <section>
      <input aria-label="标题" {...register('title')} />
      <button type="button" onClick={() => resetDefaultValues(getValues())}>
        以当前内容作为基线
      </button>
    </section>
  );
}
```

effect 直接返回 subscribe 的取消订阅函数。此示例只演示订阅；实际“保存成功后更新基线”必须以服务器确认保存的数据为准，不能点击按钮就认为已经持久化。

### Watch 与 FormState 组件

适用场景：希望在 JSX 局部订阅，不额外拆一个使用 Hook 的子组件。

```tsx
import {useForm, Watch, FormState} from 'react-hook-form';

export function SubscriptionComponents() {
  const {register, control} = useForm<{name: string}>({defaultValues: {name: ''}});
  return (
    <section>
      <input aria-label="姓名" {...register('name', {required: '请输入姓名'})} />
      <Watch control={control} name="name" render={(name) => <p>你好，{name}</p>} />
      <FormState
        control={control}
        name="name"
        exact
        render={({errors}) => <p role="alert">{errors.name?.message}</p>}
      />
    </section>
  );
}
```

`Watch` 对应 useWatch，也支持 compute、默认值、disabled 等。使用 `name`，旧的 `names` prop 已标记弃用。`FormState` 对应 useFormState，支持 control、name、exact、disabled 和 render；`FormStateSubscribe` 及对应 Props 类型仅作为已弃用的兼容别名保留。

官方参考：[formState](https://react-hook-form.com/docs/useform/formstate)、[watch](https://react-hook-form.com/docs/useform/watch)、[useWatch](https://react-hook-form.com/docs/usewatch)、[subscribe](https://react-hook-form.com/docs/useform/subscribe)、[useFormState](https://react-hook-form.com/docs/useformstate)、[getFieldState](https://react-hook-form.com/docs/useform/getfieldstate)。

## 读取、修改与重置数据

### getValues 读取快照

适用场景：点击预览、构造请求、校验函数读取其他字段，不需要触发渲染。

```tsx
// 假设 form = useForm<{profile: {name: string}; email: string}>(...)
const all = form.getValues();
const name = form.getValues('profile.name');
const [nameAgain, email] = form.getValues(['profile.name', 'email']);
const dirtyOnly = form.getValues(undefined, {dirtyFields: true});
const touchedOnly = form.getValues(undefined, {touchedFields: true});
```

筛选 dirty/touched 时应建立相应状态订阅，并按返回的嵌套结构处理数据。这类筛选适合构建 PATCH，但不会自动等同后端的更新协议；尤其删除数组项不能仅依靠 dirty 字段表达。

### getErrors：不订阅的错误读取

适用场景：按钮点击时导出当前校验报告，而不在 UI 中持续订阅 errors。

```tsx
import {useForm} from 'react-hook-form';

export function ErrorSnapshot() {
  const {register, trigger, getErrors} = useForm<{email: string}>({
    defaultValues: {email: ''},
  });
  return (
    <section>
      <input aria-label="邮箱" {...register('email', {required: '请输入邮箱'})} />
      <button
        type="button"
        onClick={async () => {
          await trigger();
          console.log(getErrors());
          console.log(getErrors('email'));
          console.log(getErrors(['email', 'root.server']));
        }}
      >
        生成校验报告
      </button>
    </section>
  );
}
```

它不触发校验，也不订阅错误变化。若需要最新校验结果先 await trigger；若需要响应式错误 UI，仍使用 useFormState 或 ErrorMessage。

### setValue 的更新选项

适用场景：用户点击“填入推荐地址”，需要修改数据、标记编辑并重新校验。

```tsx
form.setValue('profile.name', '张三', {
  shouldDirty: true,
  shouldTouch: true,
  shouldValidate: true,
});
```

这些状态与校验开关默认不会全部自动启用。`shouldDirty` 是请求相对默认值重新计算 dirty，并非永远设为 true；填回默认值后可以变干净。`shouldTouch` 更新 touched，`shouldValidate` 发起校验并更新有关状态。

`SetValueConfig` 还支持 `delayError`：与 `shouldValidate: true` 以及 `useForm({delayError: 毫秒数})` 配合，让程序化更新采用延迟显示校验错误的策略。它是布尔开关，延迟时长在 useForm 中配置；setValues 使用同一套配置类型。

```tsx
import {useForm} from 'react-hook-form';

export function DelayedProgrammaticValidation() {
  const {
    register,
    setValue,
    formState: {errors},
  } = useForm<{name: string}>({
    defaultValues: {name: ''},
    delayError: 400,
  });
  return (
    <section>
      <input aria-label="姓名" {...register('name', {required: '请输入姓名'})} />
      <button
        type="button"
        onClick={() =>
          setValue('name', '', {
            shouldDirty: true,
            shouldValidate: true,
            delayError: true,
          })
        }
      >
        清空并校验
      </button>
      <p role="alert">{errors.name?.message}</p>
    </section>
  );
}
```

优先更新叶子路径，避免用巨大父对象触发大量无关更新。字段数组结构增删使用 `useFieldArray`；不要依赖 `setValue` 自动创建不存在的数组行。值不要传 `undefined`。

### setValues：批量改值

适用场景：一次填充多个字段，不希望改变整张表的默认值基线。

```tsx
// 局部片段，form 的数据类型为：
// {name: string; city: string; profile: {nickname: string; language: string}}
form.setValues(
  {name: '张三', city: '上海'},
  {
    shouldDirty: true,
    shouldTouch: true,
    shouldValidate: true,
  }
);

form.setValues(
  (current) => ({
    ...current,
    profile: {...current.profile, nickname: '新昵称'},
  }),
  {shouldDirty: true}
);
```

对象输入是顶层部分合并，不应假设它是任意深度的递归合并。更新嵌套对象应保留需要保留的兄弟属性，或继续用 setValue 的叶子路径。函数形式应返回新数据，不修改 current 本身。

它与 `reset` 的目标不同：setValues 更新当前数据，reset 通常还涉及基线和状态重置。

### reset 与默认值基线

适用场景：切换编辑记录、保存成功后更新基线、放弃修改、后台刷新数据。

```tsx
// 初始 defaultValues = {name: '', city: ''}
form.reset({name: '服务器姓名', city: '上海'});
// 通常同时更新当前值和默认值基线，表单回到未编辑状态。

form.reset(); // 回到当前默认值基线。

form.reset({name: '后台新姓名', city: '北京'}, {keepDirtyValues: true});
// 用户修改过的字段保留，未修改字段接受服务器新值。

form.reset({name: '导入姓名', city: '广州'}, {keepDefaultValues: true});
// 保留原基线，对导入数据重新计算 dirty。

form.reset((current) => ({...current, city: '杭州'}));
// 函数返回整表数据；同样要考虑默认值基线变化。
```

| reset 选项               | 含义                                                 |
| ------------------------ | ---------------------------------------------------- |
| `keepErrors`             | 保留错误，不代表数据仍然有效或无效                   |
| `keepDirty`              | 保留 dirty 标记，不能据此认为输入值也被保留          |
| `keepDirtyValues`        | 保留脏字段的当前值，更新其他字段                     |
| `keepValues`             | 保留当前输入值                                       |
| `keepDefaultValues`      | 保留原默认值基线                                     |
| `keepTouched`            | 保留 touched 标记                                    |
| `keepIsSubmitted`        | 保留已提交标记                                       |
| `keepIsSubmitSuccessful` | 保留提交成功标记                                     |
| `keepSubmitCount`        | 保留提交次数                                         |
| `keepIsValid`            | 暂时保留有效性状态，后续仍由校验更新                 |
| `keepIsValidating`       | 保留校验中状态，通常不需要                           |
| `keepFieldsRef`          | 保留字段引用，属于进阶选项，应先验证具体控件生命周期 |

不要在 useForm 订阅未就绪时调用 reset。加载数据后通常在 effect 中执行；依赖数组引用 `reset` 等实际方法，不把整个 `form` 对象作为无差别 effect 依赖。

### resetDefaultValues：只更新比较基线

适用场景：自动保存完成时，用户在请求期间已经继续输入，希望更新“已保存的基线”但不覆盖新输入。

```tsx
// 局部片段，form = useForm<{title: string; body: string}>(...)。
async function saveSnapshot() {
  const submitted = structuredClone(form.getValues());
  const response = await fetch('/api/article', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(submitted),
  });
  if (!response.ok) throw new Error('保存失败');

  // 当前输入保持不变，dirty 相对于这次保存的快照重新计算。
  form.resetDefaultValues(submitted);
}
```

支持 `keepDirty/keepIsValid` 选项。若服务端规范化了数据，应使用真正保存后的完整基线；多次并发保存还需要防止较旧请求晚返回覆盖较新基线。

### resetField、unregister 与卸载的区别

适用场景：重置单个输入，或删除动态字段。

```tsx
form.resetField('profile.name');
form.resetField('profile.name', {
  defaultValue: '新的默认姓名',
  keepTouched: true,
  keepError: false,
  keepDirty: false,
});

form.unregister('profile.name');
form.unregister(['profile.name', 'email'], {
  keepValue: true,
  keepDefaultValue: true,
  keepError: true,
});
```

`resetField` 保留字段注册，重置值与状态；传入 `defaultValue` 也更新该字段基线。应操作已经注册的字段。

`unregister` 删除字段注册，可通过 `keepValue/keepDefaultValue/keepError/keepDirty/keepTouched/keepIsValid` 等选择保留内容；实际可用选项以对应版本类型为准。若组件仍渲染并继续调用 register，字段会再次注册，所以删除操作还必须更新 UI 结构。

单纯卸载的行为由 `shouldUnregister` 决定。删除注册不会自动修改 Zod schema：schema 仍要求该字段时，resolver 仍可能报错，需要一起更新业务规则。

### trigger 与 setFocus

适用场景：分步表单的下一步按钮、联动校验、主动聚焦。

```tsx
const stepValid = await form.trigger(['profile.name', 'email'], {shouldFocus: true});
if (stepValid) console.log('可以进入下一步');

await form.trigger('email'); // 指定一个字段。
await form.trigger(); // 整表校验。
form.setFocus('email', {shouldSelect: true});
```

`trigger` 的选项还支持 `shouldTouch`。适用场景是用户点击“检查当前步骤”时，把此次检查的字段也标记为已触碰：

```tsx
const valid = await form.trigger(['profile.name', 'email'], {
  shouldFocus: true,
  shouldTouch: true,
});
```

`trigger` 返回 `Promise<boolean>`，不会调用提交回调，也不等同于提交一次。聚焦需要字段已挂载并提供真实 ref；刚 reset 或刚增加行后，ref 可能尚未准备好。虚拟列表还需先滚动、挂载，再聚焦。

官方参考：[getValues](https://react-hook-form.com/docs/useform/getvalues)、[setValue](https://react-hook-form.com/docs/useform/setvalue)、[reset](https://react-hook-form.com/docs/useform/reset)、[resetField](https://react-hook-form.com/docs/useform/resetfield)、[unregister](https://react-hook-form.com/docs/useform/unregister)、[trigger](https://react-hook-form.com/docs/useform/trigger)、[setFocus](https://react-hook-form.com/docs/useform/setfocus)。

## 错误处理与提交

### setError、clearErrors 与错误命名空间

适用场景：提交后服务器返回邮箱已存在或全局服务异常。

```tsx
form.setError('email', {type: 'server', message: '邮箱已被注册'}, {shouldFocus: true});
form.setError('root.server', {type: '503', message: '服务暂不可用'});

form.clearErrors('email');
form.clearErrors(['email', 'profile.name']);
form.clearErrors('root.server');
form.clearErrors();
```

字段错误通常可被该字段之后的成功校验覆盖。未绑定注册字段的手动错误可能需要显式清理；`root.*` 是全局错误的约定位置，提交周期内的清理行为与普通字段不同，不应把它当作永久通知存储。

`errors.form` 用于表单级 validate；`errors.root.server` 适合服务端总错误；动态数组的内置规则还可能使用 `errors.items.root`。显示错误时按它们各自结构读取。

`clearErrors` 只清错误，不删除校验规则，也不会重新校验。若想判断修正后的数据是否有效，调用 `trigger`。

### ErrorMessage 组件

适用场景：每个字段在局部订阅自己的错误，并统一错误文本布局。它已经由 `react-hook-form` 核心包导出，不需要为了使用这个组件再安装同名生态包。

```tsx
import {ErrorMessage, useForm} from 'react-hook-form';

export function PasswordErrorMessage() {
  const {register, control, handleSubmit} = useForm<{password: string}>({
    defaultValues: {password: ''},
    criteriaMode: 'all',
    mode: 'onBlur',
  });
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <label>
        密码
        <input
          type="password"
          {...register('password', {
            required: '请输入密码',
            validate: {
              length: (value) => value.length >= 8 || '至少八位',
              digit: (value) => /\d/.test(value) || '至少一个数字',
            },
          })}
        />
      </label>
      <ErrorMessage
        control={control}
        name="password"
        render={({message, messages}) => (
          <div role="alert">
            {messages ? (
              Object.entries(messages).map(([key, value]) => <p key={key}>{String(value)}</p>)
            ) : (
              <p>{message}</p>
            )}
          </div>
        )}
      />
      <button type="submit">保存</button>
    </form>
  );
}
```

配置包括 `control/name/as/render`；未传 control 时可使用最近的 FormProvider。只展示单条错误时可写 `<ErrorMessage control={control} name="password" as="p" />`，没有错误时不输出内容。name 支持字段路径和 `root` 命名空间；表单级 `form.*` 消息可以按前述示例单独读取展示。

### handleSubmit 与异步请求

```tsx
const submit = form.handleSubmit(
  async (values, event) => {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(values),
    });
    if (!response.ok) throw new Error('保存失败');
    console.log('已保存', event?.type);
  },
  (errors) => {
    console.log('客户端校验失败', errors);
  }
);

// JSX：<form onSubmit={submit}>...</form>
// 也可在事件处理器中显式执行：await submit();
```

`handleSubmit(onValid, onInvalid?)` 返回异步事件处理器。只有校验通过才执行 onValid；onInvalid 处理客户端表单错误，不是网络异常处理器。

RHF 不会吞掉 onValid 内抛出的异常。应用应在回调中捕获并用 setError 呈现，或在调用边界处理 rejection。异步函数必须返回或 await 请求，否则 `isSubmitting` 可能在真正请求结束前就恢复 false。

按钮使用 `disabled={isSubmitting}` 可以降低重复点击，但不是服务端幂等保证。表单内部非提交按钮应显式写 `type="button"`。

### 提交回调的返回值

适用场景：工具栏主动提交表单，校验与保存成功后使用服务器返回的 ID 进行后续操作。

```tsx
import {useForm} from 'react-hook-form';

export function SubmitResultForm() {
  const {register, handleSubmit} = useForm<{title: string}>({defaultValues: {title: ''}});
  const save = handleSubmit(async (values) => {
    const response = await fetch('/api/articles', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(values),
    });
    if (!response.ok) throw new Error('保存失败');
    const result = (await response.json()) as {id: string};
    return result.id;
  });
  return (
    <section>
      <input aria-label="标题" {...register('title', {required: '请输入标题'})} />
      <button
        type="button"
        onClick={async () => {
          try {
            const articleId = await save(); // string | undefined。
            if (articleId !== undefined) console.log('可打开文章', articleId);
          } catch (error) {
            console.error('保存请求失败', error);
          }
        }}
      >
        保存并获取 ID
      </button>
    </section>
  );
}
```

7.90.0 的 `handleSubmit` 事件处理器返回 `Promise<Awaited<TResult> | undefined>`，会透传 onValid 的返回值；校验失败时不返回成功结果。`SubmitHandler<Values, TResult>` 可显式声明该结果类型，异步回调的 TResult 可写为 Promise 类型。仍需处理网络异常，不应把返回 undefined 当作请求失败的唯一判断。

### disabled、readOnly 与提交数据

适用场景：权限只读、提交时锁定操作。

```tsx
const form = useForm<{email: string}>({
  defaultValues: {email: 'reader@example.com'},
  disabled: false,
});

// 只读但需要保留提交值：
// <input readOnly {...form.register('email')} />

// 受控组件需要使用 field.disabled：
// <SomeSelect disabled={field.disabled} ... />
```

禁用字段可能从提交结果中被排除或呈现为 undefined，不能把 disabled 当作“不可编辑但一定提交”。只读文本通常使用 readOnly。只隐藏按钮或禁用控件不等于服务端权限检查。

### RHF Form 组件

适用场景：希望由 RHF 的组件统一进行校验、构建请求和处理响应。

```tsx
import {Form, useForm} from 'react-hook-form';

export function ManagedRequestForm() {
  const {
    register,
    control,
    formState: {errors},
  } = useForm<{name: string}>({
    defaultValues: {name: ''},
  });
  return (
    <Form
      control={control}
      action="/api/profile"
      method="post"
      headers={{'Content-Type': 'application/json'}}
      onSubmit={({data, formData, formDataJson}) => {
        console.log('校验后的数据', data, formData, formDataJson);
      }}
      onSuccess={({response}) => console.log('请求成功', response.status)}
      onError={({response, error}) => console.log('请求失败', response?.status, error)}
      validateStatus={(status) => status >= 200 && status < 300}
    >
      <input aria-label="姓名" {...register('name', {required: '请输入姓名'})} />
      <p role="alert">{errors.name?.message ?? errors.root?.server?.message}</p>
      <button type="submit">保存</button>
    </Form>
  );
}
```

主要配置有 `control/action/method/headers/encType/onSubmit/onSuccess/onError/validateStatus/render`，也支持原生 form 属性。`onSubmit` 接收对象 `{data, event, formData, formDataJson, method}`，与 `handleSubmit` 的参数签名不同。

提供 `action` 时组件会自行发请求，不要在 onSubmit 再发送一次同样请求。上传通常用 multipart，普通 JSON 请求按组件支持的 headers/encType 配置。`render={({submit}) => ...}` 可以采用无头方式自定义提交 UI。渐进增强需要正确的服务端 action 和渲染环境，不是加上 Form 就自动支持任意离线提交。

官方参考：[setError](https://react-hook-form.com/docs/useform/seterror)、[clearErrors](https://react-hook-form.com/docs/useform/clearerrors)、[handleSubmit](https://react-hook-form.com/docs/useform/handlesubmit)、[Form](https://react-hook-form.com/docs/useform/form)。

## 组件拆分、上下文与外部控制器

### FormProvider 与 useFormContext

适用场景：深层表单组件共享同一个表单实例，减少逐层传递 register/control。

```tsx
import {FormProvider, useForm, useFormContext} from 'react-hook-form';

type Address = {recipient: string; detail: string};

function AddressFields() {
  const {register} = useFormContext<Address>();
  return (
    <fieldset>
      <legend>收货地址</legend>
      <input aria-label="收件人" {...register('recipient', {required: '请输入收件人'})} />
      <input aria-label="详细地址" {...register('detail', {required: '请输入详细地址'})} />
    </fieldset>
  );
}

export function AddressForm() {
  const methods = useForm<Address>({defaultValues: {recipient: '', detail: ''}});
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(console.log)}>
        <AddressFields />
        <button type="submit">保存</button>
      </form>
    </FormProvider>
  );
}
```

`FormProvider` 传播已有实例，不会创建新表单。`useFormContext<T>()` 的泛型由调用者声明，不能验证上层 Provider 的运行时数据类型，因此团队应统一表单类型。

同一业务表单一般只建一个 Provider，避免无意义嵌套。多个独立表单应分别使用自己的 Provider 和 HTML form，不能嵌套 HTML form。Context 解决取用方式，局部性能仍通过 `useWatch/useFormState` 和组件边界设计。

### control 的职责

`control` 是供 `Controller/useController/useWatch/useFormState/useFieldArray` 等连接表单内部系统的控制器，不是当前值对象。

```tsx
// 适合按需给子组件传 control。
type ChildProps = {control: import('react-hook-form').Control<{name: string}>};
```

通过 `getValues/setValue` 访问值，通过公开订阅 API 观察变化。不要直接读写 `control._formValues/_fields/_subjects`，它们属于实现细节，升级后可能变化。

### createFormControl

适用场景：React 之外创建、订阅或测试表单状态，例如项目中的表单逻辑集成测试。

```tsx
import {useState} from 'react';
import {createFormControl, useForm} from 'react-hook-form';

export function ExternalControlForm() {
  // 每次组件实例只创建一次，不能每个 render 都创建新控制器。
  const [external] = useState(() =>
    createFormControl<{name: string}>({
      defaultValues: {name: ''},
    })
  );
  const {register, handleSubmit} = useForm({formControl: external.formControl});
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input aria-label="姓名" {...register('name')} />
      <button
        type="button"
        onClick={() =>
          external.setValue('name', '外部写入', {
            shouldDirty: true,
          })
        }
      >
        填入
      </button>
      <button type="submit">保存</button>
    </form>
  );
}
```

在 React 外也可以 `const external = createFormControl(...)`，调用其 `register/setValue/trigger/subscribe`。订阅应记得取消。SSR 服务端不能把有用户数据的全局实例跨请求复用；浏览器多个独立表单也要明确实例隔离。

createFormControl 路线可以显式传 control/formControl 给消费者，通常无需再混用 FormProvider 作为第二套连接机制。纯逻辑测试使用该 API，不代表已测试 React 组件渲染与浏览器行为。

### 导出的辅助函数与类型

除主要 API 外，核心库还公开导出 `get/set/appendErrors`。它们是低层辅助工具，适合构建通用表单库或自定义 resolver，业务页面通常不需要。

```ts
import {get, set, appendErrors} from 'react-hook-form';
import type {FieldErrors, InternalFieldErrors} from 'react-hook-form';

type Values = {profile: {email: string}};
const errors: FieldErrors<Values> = {};
set(errors, 'profile.email', {type: 'required', message: '请输入邮箱'});
const error = get(errors, 'profile.email');

const accumulated: InternalFieldErrors = {
  password: {type: 'minLength', message: '密码太短'},
};
const detail = appendErrors('password', true, accumulated, 'number', '至少一个数字');
console.log(error, detail);
```

`set` 会修改目标对象，不能拿它直接修改 React 状态或 RHF 内部 errors 来绕过通知。`appendErrors` 用于生成多规则错误信息，不等于调用 `setError`。

常用类型按用途学习即可，不需要记忆所有内部辅助类型。`FieldPathError/GetErrorsResult/ErrorNamespacePath` 用于类型安全的错误读取；`OpaqueTypes/OpaqueType` 用于复杂对象叶子类型注册，后文给出示例：

| 类型族                                                            | 用途                                 |
| ----------------------------------------------------------------- | ------------------------------------ |
| `FieldValues`、`DefaultValues<T>`                                 | 表单数据约束、默认值                 |
| `FieldPath<T>`、`FieldPathValue<T, P>`、`FieldPathValues<T, Ps>`  | 类型安全的字段路径与值               |
| `FieldPathByValue<T, V>`                                          | 限制只能传某种值类型的字段路径       |
| `FieldArrayPath<T>`、`FieldArray<T, P>`、`FieldArrayWithId<T, P>` | 动态数组路径、元素、带渲染 ID 的元素 |
| `UseFormProps/UseFormReturn/Control`                              | 表单配置、方法、控制器               |
| `UseControllerProps/UseControllerReturn/ControllerProps`          | 受控字段封装                         |
| `UseFieldArrayProps/UseFieldArrayReturn`                          | 动态数组封装                         |
| `UseFormStateProps/UseFormStateReturn`                            | 局部状态订阅                         |
| `RegisterOptions`、`Validate`、`ValidateForm`                     | 字段与表单校验                       |
| `Resolver/ResolverOptions/ResolverResult`                         | 自定义校验适配器                     |
| `FieldError/FieldErrors/ErrorOption/MultipleFieldErrors`          | 错误建模                             |
| `SubmitHandler/SubmitErrorHandler/FormSubmitHandler`              | 三种不同提交回调签名                 |
| `FormState/KeepStateOptions/SetValueConfig`                       | 状态、重置保留项、写值开关           |

`NestedValue` 已标记弃用，不用于新代码。不要为了暂时消除泛型错误就把所有 Control 或字段名改成 any；它往往是在提醒输入输出类型或数据路径不一致。

官方参考：[FormProvider](https://react-hook-form.com/docs/formprovider)、[useFormContext](https://react-hook-form.com/docs/useformcontext)、[createFormControl](https://react-hook-form.com/docs/createFormControl)、[TypeScript](https://react-hook-form.com/ts)。

## 动态数组与嵌套表单

### useFieldArray 的完整用法

适用场景：订单明细、联系人、动态添加的多行配置。

```tsx
import {useFieldArray, useForm} from 'react-hook-form';

type Order = {items: {sku: string; quantity: number}[]};

export function OrderForm() {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: {errors},
  } = useForm<Order>({
    defaultValues: {items: [{sku: '', quantity: 1}]},
  });
  const {fields, append, prepend, insert, remove, swap, move, update, replace} = useFieldArray({
    control,
    name: 'items',
    rules: {minLength: {value: 1, message: '至少保留一项'}},
  });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      {fields.map((field, index) => (
        <fieldset key={field.id}>
          <legend>商品 {index + 1}</legend>
          <input
            aria-label={`商品编码 ${index + 1}`}
            {...register(`items.${index}.sku` as const, {required: '请输入商品编码'})}
          />
          <input
            aria-label={`数量 ${index + 1}`}
            type="number"
            {...register(`items.${index}.quantity` as const, {valueAsNumber: true, min: 1})}
          />
          <p>{errors.items?.[index]?.sku?.message}</p>
          <button type="button" onClick={() => remove(index)}>
            删除
          </button>
          <button
            type="button"
            onClick={() =>
              setValue(`items.${index}.quantity`, 2, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            只修改数量
          </button>
        </fieldset>
      ))}
      <p role="alert">{errors.items?.root?.message}</p>
      <button type="button" onClick={() => append({sku: '', quantity: 1})}>
        末尾新增
      </button>
      <button type="button" onClick={() => prepend({sku: '', quantity: 1})}>
        开头新增
      </button>
      <button type="button" onClick={() => insert(0, {sku: 'inserted', quantity: 1})}>
        指定位置插入
      </button>
      <button type="button" disabled={fields.length < 2} onClick={() => swap(0, 1)}>
        交换前两项
      </button>
      <button type="button" disabled={fields.length < 2} onClick={() => move(0, 1)}>
        移动首项
      </button>
      <button type="button" disabled={!fields.length} onClick={() => update(0, {sku: 'updated', quantity: 3})}>
        替换首行
      </button>
      <button type="button" onClick={() => replace([{sku: 'new', quantity: 1}])}>
        替换全部
      </button>
      <button type="submit">保存订单</button>
    </form>
  );
}
```

| API 或选项              | 说明                                                      |
| ----------------------- | --------------------------------------------------------- |
| `fields`                | 数组结构快照与渲染 ID，不是每次输入后的实时值             |
| `append/prepend/insert` | 添加一个或多个完整元素；不要只传 `{}` 或缺少字段的对象    |
| `remove(index/indexes)` | 删除指定行；不传参数删除所有行                            |
| `swap/move`             | 交换或移动位置，同时维护关联状态                          |
| `update`                | 替换某行，可能卸载并重挂载该行；传完整元素                |
| `replace`               | 替换整个数组                                              |
| `name/control`          | 指定数组路径和表单实例                                    |
| `rules`                 | 数组级 required/minLength/maxLength/validate              |
| `shouldUnregister`      | 数组卸载后的保留策略                                      |
| `disabled`              | 数组级禁用配置；返回元素可携带 disabled，操作按钮另行控制 |
| `keyName`               | 支持自定义渲染 ID 属性名，新代码通常保持默认              |

新增方法的第二个参数支持 `{shouldFocus, focusIndex, focusName}`，例如 `append(row, {shouldFocus: false})`。

### FieldArray 的组件形式

适用场景：在 JSX 内部直接声明数组、错误和状态消费者。

```tsx
import {useForm, FieldArray, FormState, ErrorMessage} from 'react-hook-form';

type Values = {contacts: {name: string}[]};

export function ContactArrayForm() {
  const {control, register, handleSubmit} = useForm<Values>({
    defaultValues: {contacts: [{name: ''}]},
  });
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <FieldArray
        control={control}
        name="contacts"
        render={({fields, append, remove}) => (
          <section>
            {fields.map((item, index) => (
              <div key={item.id}>
                <input
                  aria-label={`联系人 ${index + 1}`}
                  {...register(`contacts.${index}.name` as const, {required: '请输入姓名'})}
                />
                <ErrorMessage control={control} name={`contacts.${index}.name`} as="p" />
                <button type="button" onClick={() => remove(index)}>
                  删除
                </button>
              </div>
            ))}
            <button type="button" onClick={() => append({name: ''})}>
              增加联系人
            </button>
          </section>
        )}
      />
      <FormState
        control={control}
        render={({isSubmitting}) => (
          <button type="submit" disabled={isSubmitting}>
            保存
          </button>
        )}
      />
    </form>
  );
}
```

`FormState` 是 useFormState 的组件形式；`FieldArray` 是 useFieldArray 的组件形式，render 必须返回 React 元素。它们没有替代底层 Hooks 的数据模型。

核心 `ErrorMessage` 支持 `control/name/as/render`，可从最近的 FormProvider 取 control。`render={({message, messages}) => ...}` 可自定义布局或展示 criteriaMode 为 all 时的多条错误。

旧生态包 `@hookform/error-message` 也叫 ErrorMessage，但其 API 通常接收 `errors` 等参数，不能把两个组件的示例混用。

### 数组禁用

适用场景：联系人列表暂时只读，统一提供数组字段禁用状态，同时明确处理自定义控件与操作按钮。

```tsx
import {useFieldArray, useForm} from 'react-hook-form';

export function DisabledContacts({disabled}: {disabled: boolean}) {
  const {control, register} = useForm<{contacts: {name: string}[]}>({
    defaultValues: {contacts: [{name: '张三'}]},
  });
  const {fields, append} = useFieldArray({control, name: 'contacts', disabled});
  return (
    <section>
      {fields.map((field, index) => (
        <input
          key={field.id}
          aria-label={`联系人 ${index + 1}`}
          {...register(`contacts.${index}.name` as const)}
          disabled={field.disabled}
        />
      ))}
      <button type="button" disabled={disabled} onClick={() => append({name: ''})}>
        增加联系人
      </button>
    </section>
  );
}
```

`useFieldArray` 接收 disabled，返回元素可携带 disabled 状态。自定义控件仍需按接口传递禁用值，数组操作按钮也要显式禁用；不要把此配置当作阻止所有程序化增删的权限机制。禁用后的提交值应按实际业务验证，需要“只读但保留提交”时设计对应的只读策略。

### 数组身份、实时值与业务 ID

React key 用 `field.id`，不能用 index，也不要每次 render 生成随机 key。数组字段路径仍用 index，这是路径与组件身份的分工，不能混为一谈。

服务器 ID 建议命名为 `serverId` 等业务字段，避免与 RHF 渲染用 id 混淆。提交时以 handleSubmit 返回的数据为准，不把 fields 直接作为请求体。

需要实时展示某行值时，使用 `useWatch({control, name: 'items'})` 或把每行拆成订阅单独路径的组件。局部修改一个单元格优先 `setValue('items.0.quantity', next)`，避免用 update 导致编辑控件重挂载和焦点丢失。

`useFieldArray` 不支持以 `string[]` 这样的平面数组作为常规字段数组模型，通常转换成 `{value: string}[]`。不要在同一表单对同一路径创建多个 useFieldArray 实例；也不要通过动态切换同一个 Hook 的 name 来复用不同数组。

### 嵌套数组与 Hooks 边界

适用场景：一个订单有多个分组，每个分组有多条明细。

```tsx
import {useFieldArray, useForm, type Control, type UseFormRegister} from 'react-hook-form';

type NestedOrder = {groups: {title: string; lines: {sku: string}[]}[]};

function GroupLines({
  index,
  control,
  register,
}: {
  index: number;
  control: Control<NestedOrder>;
  register: UseFormRegister<NestedOrder>;
}) {
  const {fields, append} = useFieldArray({control, name: `groups.${index}.lines` as const});
  return (
    <section>
      {fields.map((line, lineIndex) => (
        <input
          key={line.id}
          aria-label={`分组 ${index + 1} 商品 ${lineIndex + 1}`}
          {...register(`groups.${index}.lines.${lineIndex}.sku` as const)}
        />
      ))}
      <button type="button" onClick={() => append({sku: ''})}>
        增加明细
      </button>
    </section>
  );
}

export function NestedOrderForm() {
  const {control, register, handleSubmit} = useForm<NestedOrder>({
    defaultValues: {groups: [{title: '默认分组', lines: [{sku: ''}]}]},
  });
  const {fields} = useFieldArray({control, name: 'groups'});
  return (
    <form onSubmit={handleSubmit(console.log)}>
      {fields.map((group, index) => (
        <fieldset key={group.id}>
          <input aria-label="分组名" {...register(`groups.${index}.title` as const)} />
          <GroupLines index={index} control={control} register={register} />
        </fieldset>
      ))}
      <button type="submit">保存</button>
    </form>
  );
}
```

不能在父组件的 map 回调中直接调用 useFieldArray，应提取 GroupLines。复杂的父数组重排会引起路径重索引，需测试值、错误、dirty/touched 的归属，不只测试渲染数量。

### 条件字段与分步表单

适用场景：向导式填写资料，切换步骤时保留输入，下一步前验证当前步骤。

```tsx
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';

const schema = z.object({
  name: z.string().min(1, '请输入姓名'),
  email: z.string().email('邮箱格式错误'),
});
type WizardValues = z.infer<typeof schema>;

export function Wizard() {
  const [step, setStep] = useState(0);
  const {
    register,
    trigger,
    handleSubmit,
    formState: {errors},
  } = useForm<WizardValues>({
    defaultValues: {name: '', email: ''},
    resolver: zodResolver(schema),
    shouldUnregister: false,
  });
  return (
    <form noValidate onSubmit={handleSubmit(console.log, () => setStep(0))}>
      {step === 0 ? (
        <input aria-label="姓名" {...register('name')} />
      ) : (
        <input aria-label="邮箱" {...register('email')} />
      )}
      <p role="alert">{errors.name?.message ?? errors.email?.message}</p>
      {step === 0 ? (
        <button
          type="button"
          onClick={async () => {
            if (await trigger('name', {shouldFocus: true})) setStep(1);
          }}
        >
          下一步
        </button>
      ) : (
        <>
          <button type="button" onClick={() => setStep(0)}>
            上一步
          </button>
          <button type="submit">提交</button>
        </>
      )}
    </form>
  );
}
```

完整 schema 负责最终校验未挂载步骤的数据，`trigger('name')` 用于当前步的校验反馈。示例失败后返回第一步；真实业务应根据错误路径切换到首个有错步骤，挂载后再聚焦。

保留值不等于内置校验自动覆盖未挂载字段：默认 `shouldUnregister: false` 会保留值，但内置规则对未挂载字段的处理与 resolver 校验整份数据不同。对于跨路由步骤，若 useForm 所在组件也卸载，仍需把实例提升或把草稿存放到外层。

官方参考：[useFieldArray](https://react-hook-form.com/docs/usefieldarray)、[高级使用场景](https://react-hook-form.com/advanced-usage)。

## 特殊控件与工程场景

### 文件上传

适用场景：原生文件输入，提交时构造 FormData。

```tsx
import {useForm} from 'react-hook-form';

export function UploadForm() {
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<{attachment: FileList}>();
  return (
    <form
      onSubmit={handleSubmit(async ({attachment}) => {
        const file = attachment?.[0];
        if (!file) return;
        const body = new FormData();
        body.append('attachment', file);
        const response = await fetch('/api/upload', {method: 'POST', body});
        if (!response.ok) throw new Error('上传失败');
      })}
    >
      <input
        aria-label="附件"
        type="file"
        {...register('attachment', {
          validate: (files) => Boolean(files?.length) || '请选择文件',
        })}
      />
      <p role="alert">{errors.attachment?.message}</p>
      <button type="submit">上传</button>
    </form>
  );
}
```

示例省略上传进度 UI，异常应按提交章节接入页面错误反馈。不要手动设置 multipart 的 Content-Type，否则可能丢失 boundary。文件选择器不能像文本输入一样任意回填本地文件路径，取消选择、重置以及文件脏状态需由应用单独考虑。

### 接入 UI 库、React Native 与富文本编辑器

适用场景：迁移到其他组件库时判断适配点。

| 控件接口                  | RHF 映射                     | 注意事项                                             |
| ------------------------- | ---------------------------- | ---------------------------------------------------- |
| `value/onValueChange`     | `field.value/field.onChange` | 默认值与空值协议一致                                 |
| `checked/onCheckedChange` | `field.value/field.onChange` | 三态 checkbox 的中间态需归一化                       |
| `selected/onSelect`       | 选择值和回调适配             | 明确保存日期还是日期字符串                           |
| `value/onChangeText`      | `field.value/field.onChange` | React Native TextInput，不使用 DOM register 事件协议 |
| 富文本 `content/onUpdate` | 文档值与更新回调             | 区分首次加载、用户编辑、外部 reset                   |

```tsx
// React Native 片段：需在 RN 项目导入 TextInput，当前 Web 项目不执行此示例。
// <Controller control={control} name="name" render={({field}) => (
//   <TextInput value={field.value} onChangeText={field.onChange}
//     onBlur={field.onBlur} ref={field.ref} />
// )} />
```

富文本编辑器常把初始内容缓存到自己的实例中。仅修改 RHF 的 defaultValues 不会保证编辑器更新，需要根据控件公开 API 把 reset 的新值同步进去，同时避免外部同步又触发 onChange 的循环。

### 服务端渲染、StrictMode 与就绪时机

RHF Hooks 在使用 React Server Components 的框架中应放在客户端组件边界内。默认值应能让服务端和客户端首次渲染一致；localStorage 等浏览器 API 在 effect 或客户端事件中读取。

StrictMode 开发环境会重放部分生命周期，注册副作用和订阅必须有正确清理。不要在 render 中发请求、调用 setValue 或改变外部表单实例。

适用场景：子组件需要在父表单订阅就绪后写入值。

```tsx
import {useEffect} from 'react';
import {useFormContext} from 'react-hook-form';

export function InitializeChild() {
  const {
    setValue,
    formState: {isReady},
  } = useFormContext<{name: string}>();
  useEffect(() => {
    if (isReady) setValue('name', '初始化姓名');
  }, [isReady, setValue]);
  return null;
}
```

如果只是静态初值，应直接写入 defaultValues，避免不必要的 effect。上例适用于确实依赖子组件生命周期的初始化。

## TypeScript 组件设计

### 用字段路径约束通用输入

适用场景：希望封装通用文本字段，又不允许误传数字或对象字段名。

```tsx
import {useController, type Control, type FieldPathByValue, type FieldValues} from 'react-hook-form';

export function StringField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: FieldPathByValue<T, string>;
  label: string;
}) {
  const {field, fieldState} = useController({control, name});
  return (
    <label>
      {label}
      <input
        name={field.name}
        ref={field.ref}
        value={String(field.value ?? '')}
        onChange={field.onChange}
        onBlur={field.onBlur}
        disabled={field.disabled}
      />
      <span role="alert">{fieldState.error?.message}</span>
    </label>
  );
}

// type User = {name: string; age: number};
// <StringField control={control} name="name" label="姓名" /> 允许。
// name="age" 则应被 TypeScript 拒绝。
```

动态模板路径使用 `as const` 保留字面量类型，但不要用类型断言掩盖错误的业务路径。使用 schema transform 时，通用组件的 Control 还可能需要声明第三个输出类型泛型，避免把不同类型的控制器强行兼容。

### 类型与运行时规则的职责

`useForm<{age: number}>()` 不会把输入框字符串自动变成数字，也不会自动要求年龄非负。TypeScript 只检查代码，运行时需要 `valueAsNumber/setValueAs/schema`。同样，`FieldPath` 能检查已知结构路径，但不能证明运行时传入的动态节点 ID 一定有效。

### OpaqueTypes：把复杂对象视为类型叶子

适用场景：表单值使用 Dayjs、Decimal 等带有许多成员的第三方类型，不希望字段路径递归展开到它们的内部属性，也希望减少 TypeScript 推导成本。

下面用一个自定义金额类演示类型注册，无需额外依赖：

```ts
import type {DefaultValues, FieldPath} from 'react-hook-form';

class MoneyValue {
  readonly kind = 'money' as const;
  constructor(readonly cents: number) {}
  format() {
    return (this.cents / 100).toFixed(2);
  }
}

declare module 'react-hook-form' {
  interface OpaqueTypes {
    money: MoneyValue;
  }
}

type Values = {amount: MoneyValue; note: string};
const amountPath: FieldPath<Values> = 'amount';
const defaults: DefaultValues<Values> = {amount: new MoneyValue(1200), note: ''};
// amount.cents 不再是可用字段路径，amount 整体作为一个叶子值。
console.log(amountPath, defaults.amount?.format());
```

`OpaqueTypes` 是可通过声明合并扩展的类型注册表，`OpaqueType` 是注册类型的联合。FieldPath、DeepPartial、FieldErrors 等递归类型会把这些值当作叶子。实际项目通常把声明合并放到专门的 `.d.ts` 文件，并确保它属于 TypeScript include 范围。

这只影响类型系统，不会自动实现复杂对象的运行时复制、脏值比较、校验或 JSON 序列化。普通业务表单仍优先使用清晰的字符串、数字和普通对象协议；需要保存富对象时，要同时设计 defaultValues、控件适配和提交转换。

## 大表单性能与虚拟列表

### 订阅应尽量靠近消费者

适用场景：几百行可编辑表格，输入一个字符不应刷新所有行。

| 设计选择                               | 影响                               |
| -------------------------------------- | ---------------------------------- |
| 根组件 `watch()` 整表                  | 每次变更可能触发根组件更新         |
| 行内 useWatch 指定字段                 | 将值更新限制在需要它的区域         |
| 字段反馈组件 useFormState + name/exact | 只为相关错误变化更新反馈 UI        |
| 普通输入使用 register                  | 减少为同步 value 进行的 React 更新 |
| 稳定 row key、列定义与事件引用         | 避免无关控件卸载和丢失焦点         |
| schema、索引只在结构变化时重建         | 避免每个按键遍历整棵树             |

`React.memo` 不能代替正确订阅，它也不能阻止组件内部订阅触发的更新。不要为了减少渲染而直接操作 RHF 私有状态。

### 虚拟卸载与真正删除

适用场景：滚动表格时，屏幕外字段暂时卸载，但用户输入应保留。

```tsx
import {useState} from 'react';
import {useForm, type UseFormReturn} from 'react-hook-form';

type TreeValues = {values: Record<string, string>};

function VirtualTextField({form, id}: {form: UseFormReturn<TreeValues>; id: string}) {
  const name = `values.${id}` as const;
  const [initial] = useState(() => form.getValues(name) ?? '');
  return <input aria-label={id} defaultValue={initial} {...form.register(name)} />;
}

export function VirtualLifecycleDemo() {
  const form = useForm<TreeValues>({
    defaultValues: {values: {nodeA: '初始内容'}},
    shouldUnregister: false,
  });
  const [visible, setVisible] = useState(true);
  const [exists, setExists] = useState(true);
  return (
    <section>
      <button type="button" onClick={() => setVisible((value) => !value)}>
        模拟移入或移出视口
      </button>
      <button
        type="button"
        onClick={() => {
          form.unregister('values.nodeA');
          setExists(false);
        }}
      >
        真正删除
      </button>
      {exists && visible && <VirtualTextField form={form} id="nodeA" />}
      <button type="button" onClick={() => console.log(form.getValues())}>
        读取保留值
      </button>
    </section>
  );
}
```

上例模拟生命周期，没有实现真实虚拟滚动。`shouldUnregister: false` 保留暂时卸载的字段数据，真正删除才调用 unregister 并移除节点。重新挂载从 RHF 读取最新值，而不是再次使用节点工厂默认值。

内置校验不会因为值保留就自动覆盖未挂载控件。需要整树提交校验时，使用覆盖全部业务节点的 schema/resolver，并保证尚未挂载的节点也有数据。

### 编辑校验与提交校验范围

适用场景：动态树有上千字段，编辑一个字段只检查该字段，提交时检查全部节点。

```tsx
import {useRef, type SubmitEvent} from 'react';
import {useForm, type FieldErrors, type Resolver} from 'react-hook-form';

type Values = {values: Record<string, string>};
type ValidationContext = {validateAll: boolean};

export function ValidationScopeDemo() {
  const validationContext = useRef<ValidationContext>({validateAll: false});
  const nodeIds = ['nodeA', 'nodeB'];
  const resolver: Resolver<Values> = (values, _context, options) => {
    const ids = validationContext.current.validateAll
      ? nodeIds
      : (options.names ?? []).map((name) => name.replace(/^values\./, ''));
    const errors: FieldErrors<Values> = {};
    for (const id of ids) {
      if (!nodeIds.includes(id)) continue;
      if (!values.values?.[id]?.trim()) {
        errors.values ??= {};
        errors.values[id] = {type: 'required', message: '请输入内容'};
      }
    }
    return Object.keys(errors).length ? {values: {}, errors} : {values, errors: {}};
  };
  const form = useForm<Values>({
    defaultValues: {values: {nodeA: '', nodeB: ''}},
    resolver,
    mode: 'onChange',
    shouldUnregister: false,
    shouldFocusError: false,
  });
  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    validationContext.current.validateAll = true;
    try {
      await form.handleSubmit(console.log)(event);
    } finally {
      validationContext.current.validateAll = false;
    }
  };
  return (
    <form onSubmit={submit}>
      <input aria-label="节点 A" {...form.register('values.nodeA')} />
      <p>节点 B 没有挂载输入，但提交时仍需校验。</p>
      <button type="submit">提交整树</button>
    </form>
  );
}
```

示例突出校验范围，生产版本还应缓存节点索引、处理空树、展示全量错误，并约束并发提交。普通 `trigger()` 若也要求整树校验，应经过同样的全量入口，不能只在提交按钮中设置标志。

不要通过 `options.names.length === 节点数` 判断提交。已注册列表、折叠状态和虚拟视口都可能导致该推断失败。自定义增量 resolver 还必须处理跨字段依赖，并测试旧错误是否按预期保留或清除。

### 错误定位与可访问性

虚拟行尚未挂载时没有可聚焦 DOM，应先确定出错业务节点，再展开祖先、滚动到行、等待挂载，最后 setFocus。公共表格没有公开定位接口时，不应猜像素或访问私有 DOM 伪造可靠定位。

错误输入应提供 `aria-invalid`，通过 `aria-describedby` 关联错误文本；错误文本使用 `role="alert"` 或适当的 live region。只改变边框颜色不能完整传达错误。弹窗关闭和步骤切换后也要考虑焦点归属。

## 测试与调试

### 逻辑测试：Vitest 与 createFormControl

适用场景：验证 resolver、字段值清理、状态协议，不需要真实 DOM。

```ts
import {expect, test} from 'vitest';
import {createFormControl} from 'react-hook-form';

test('校验失败后修正字段，再删除字段', async () => {
  const form = createFormControl<{name: string}>({defaultValues: {name: ''}});
  const unsubscribe = form.subscribe({formState: {errors: true}, callback: () => {}});
  try {
    form.register('name', {required: '请输入姓名'});
    expect(await form.trigger('name')).toBe(false);
    expect(form.getFieldState('name').error?.message).toBe('请输入姓名');

    form.setValue('name', '张三');
    expect(await form.trigger('name')).toBe(true);
    form.unregister('name');
    expect(form.getValues('name')).toBeUndefined();
    expect(form.getFieldState('name').error).toBeUndefined();
  } finally {
    unsubscribe();
  }
});
```

测试应验证可观察行为，不读取 `_formValues` 等私有实现。当前项目已经具备 Vitest，可以运行：

```sh
pnpm --filter react-vite-admin test
pnpm --filter react-vite-admin test:watch
```

### 组件交互测试：Testing Library

适用场景：验证用户输入、点击提交和错误 UI。以下示例需要另外安装组件测试依赖并配置相应环境。

```tsx
// 示例依赖：@testing-library/react、@testing-library/user-event、jsdom。
// @vitest-environment jsdom
import {expect, test, vi} from 'vitest';
import {render, screen, waitFor, cleanup} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useForm} from 'react-hook-form';

function NameForm({onSave}: {onSave: (data: {name: string}) => void}) {
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<{name: string}>({
    defaultValues: {name: ''},
  });
  return (
    <form onSubmit={handleSubmit((data) => onSave(data))}>
      <label>
        姓名
        <input {...register('name', {required: '请输入姓名'})} />
      </label>
      {errors.name && <p role="alert">{errors.name.message}</p>}
      <button type="submit">保存</button>
    </form>
  );
}

test('先展示错误，再提交合法数据', async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  try {
    render(<NameForm onSave={onSave} />);
    await user.click(screen.getByRole('button', {name: '保存'}));
    expect((await screen.findByRole('alert')).textContent).toBe('请输入姓名');
    expect(onSave).not.toHaveBeenCalled();

    await user.type(screen.getByRole('textbox', {name: '姓名'}), '张三');
    await user.click(screen.getByRole('button', {name: '保存'}));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({name: '张三'}));
  } finally {
    cleanup();
  }
});
```

RHF 有异步状态更新，优先使用 findBy/waitFor 等待结果，不随意写固定 sleep。按角色和标签查控件，减少对 CSS 类名或 DOM 层级的依赖。

### 真实浏览器测试：Playwright

适用场景：真实滚动、虚拟行卸载、焦点、浮层位置和完整提交流程。jsdom 不提供可靠的真实布局测量。

```ts
// 未来引入 @playwright/test 并配置 webServer/baseURL 后使用。
import {expect, test} from '@playwright/test';

test('资料表单能够显示必填提示并保存', async ({page}) => {
  // /profile 以及控件可访问名称需映射到实际页面。
  await page.goto('/profile');
  await page.getByRole('button', {name: '保存'}).click();
  await expect(page.getByText('请输入姓名', {exact: true})).toBeVisible();
  await page.getByRole('textbox', {name: '姓名', exact: true}).fill('张三');
  await page.getByRole('button', {name: '保存'}).click();
  await expect(page.getByRole('status')).toHaveText('保存成功');
});
```

真实树表测试应另外覆盖“编辑一行 → 滚出视口 → 滚回 → 值仍保留”，以及删除后隐藏字段不阻止提交。不要把逻辑层模拟 ref 的测试结果当成真实滚动已验证。

### DevTools 与排错顺序

`@hookform/devtools` 是独立开发辅助包，并非 RHF 核心默认附带。需要时安装后把 `<DevTool control={control} />` 放在开发页面，生产环境按构建策略移除。当前项目未为本文额外安装它。

排错时先确认字段名称和默认值，再检查 ref/事件是否完整传递，随后检查校验入口与错误路径，最后看订阅范围。不要先用 watch 整表来掩盖“某个组件根本没有订阅所需状态”的问题。

参考：[Testing Library 原则](https://testing-library.com/docs/guiding-principles)、[Playwright 最佳实践](https://playwright.dev/docs/best-practices)、[RHF DevTools](https://react-hook-form.com/dev-tools)。

## 官方生态与可选扩展

### useLens 与嵌套结构复用

`useLens` 来自独立包 `@hookform/lenses`，不是核心包导出。适用场景：大型嵌套表单需要把“某一片数据结构”作为类型安全的子表单接口复用。

```tsx
// 可选生态示例：安装兼容版本的 @hookform/lenses 后使用。
import {useForm} from 'react-hook-form';
import {useLens, type Lens} from '@hookform/lenses';

function PersonFields({lens}: {lens: Lens<{name: string; city: string}>}) {
  return (
    <fieldset>
      <input aria-label="姓名" {...lens.focus('name').interop((control, name) => control.register(name))} />
      <input aria-label="城市" {...lens.focus('city').interop((control, name) => control.register(name))} />
    </fieldset>
  );
}

export function LensForm() {
  const {control, handleSubmit} = useForm<{billing: {name: string; city: string}}>({
    defaultValues: {billing: {name: '', city: ''}},
  });
  const lens = useLens({control});
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <PersonFields lens={lens.focus('billing')} />
      <button type="submit">保存</button>
    </form>
  );
}
```

主要概念是 `focus` 聚焦子路径、`reflect` 重组路径视图、`map` 配合数组建立子 Lens，以及 `interop` 转接 RHF 的 control/name。它不提供另一套值读写存储；响应式值仍用 useWatch，写值仍遵循 RHF 的 API。

如果只是两三个普通字段，传 control 和字段名已经足够，不必为了学习 RHF 一开始就引入 Lens。

参考：[Lenses 官方仓库与示例](https://github.com/react-hook-form/lenses)。

### Form Builder 与其他生态

官方 Form Builder 是生成表单配置或代码的辅助工具，不是替代 register、Controller 和 schema 的运行时模型。`@hookform/resolvers`、`@hookform/devtools`、`@hookform/error-message`、`@hookform/lenses` 都有独立版本和安装要求。

选择 UI 库、状态库、查询库或表单设计器时，RHF 只承担字段状态部分。服务端缓存继续交给查询层，复杂树结构继续交给业务模型，不需要把所有应用状态塞进表单。

## 常见误区与学习练习

### 常见问题对照

| 现象                               | 优先检查                                              |
| ---------------------------------- | ----------------------------------------------------- |
| defaultValues 换了但输入没更新     | 默认值缓存；考虑 reset、values 或重新创建表单         |
| 数字字段得到字符串或 NaN           | DOM 值转换、空值协议、schema 输入类型                 |
| Controller 失焦不校验              | 是否把 field.onBlur 传给实际控件                      |
| 错误无法聚焦                       | ref 是否指向真实节点，节点是否挂载或 disabled         |
| 改值后 isDirty 没更新              | 默认值基线、shouldDirty、状态是否被订阅               |
| 清掉 errors 但 isValid 未变为 true | clearErrors 不执行校验，应 trigger                    |
| 删除一行后另一行的值错位           | React key 是否使用 field.id，是否误用 fields 当实时值 |
| 滚动回来输入丢失                   | shouldUnregister、重新挂载初值、是否误执行 unregister |
| 字段删除后仍报必填                 | schema 是否仍要求该字段，业务节点是否同步删除         |
| 一个输入让整表更新                 | 根组件 watch 全表、订阅过宽、不稳定组件 key 或列定义  |
| 提交按钮很快恢复但请求还在执行     | onSubmit 是否 return/await 请求                       |
| onInvalid 没有收到网络错误         | 网络错误来自 onValid 的请求，应在请求边界处理         |
| SSR 用户数据相互污染               | 是否跨请求复用了全局 createFormControl 实例           |
| 新教程 API 报不存在                | 核对实际安装版本、核心包与独立生态包的区别            |

### 建议的练习路径

- 写一个邮箱和密码表单，先只用 register 与内置规则，能解释 handleSubmit 的两个回调。
- 加入确认密码与异步用户名检查，观察 mode、deps、validatingFields。
- 用 Controller 接入一个非原生开关，再用 useController 封装金额字段。
- 对比 watch、useWatch、getValues、subscribe，让总价和草稿保存各用合适的入口。
- 实现编辑页的 reset、后台刷新和 keepDirtyValues，观察默认值基线如何影响 isDirty。
- 实现 useFieldArray 联系人列表，验证交换、删除、update 对焦点和状态的影响。
- 阅读项目树形表单，解释折叠、滚出视口和真正删除为何使用不同的生命周期策略。
- 为关键逻辑写 Vitest 测试，再根据需求添加组件交互和真实浏览器验证。

### API 覆盖索引

| 知识范围             | 本文覆盖                                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 核心 Hook            | useForm、useController、useFormContext、useFormState、useWatch、useFieldArray                                                                                                                                       |
| 核心组件             | Controller、FormProvider、Form、Watch、FormState、FieldArray、ErrorMessage                                                                                                                                          |
| useForm 返回方法     | register、unregister、handleSubmit、watch、subscribe、getValues、getErrors、getFieldState、setValue、setValues、setError、clearErrors、trigger、reset、resetDefaultValues、resetField、setFocus、control、formState |
| useForm 配置         | UseFormProps 全部配置，包括 validate、progressive、formControl                                                                                                                                                      |
| 字段配置             | RegisterOptions 校验、转换、依赖、禁用与卸载选项                                                                                                                                                                    |
| 状态                 | FormState 全部状态、Proxy、局部订阅                                                                                                                                                                                 |
| 动态数组             | 全部数组操作、身份、嵌套、数组级规则                                                                                                                                                                                |
| 校验                 | 内置规则、跨字段、异步、表单级 validate、resolver、context、Zod、转换后输出类型                                                                                                                                     |
| 外部控制器与辅助工具 | createFormControl、get、set、appendErrors                                                                                                                                                                           |
| 进阶公开 API         | getErrors、setValues、resetDefaultValues、数组 disabled、默认值订阅、提交返回值、OpaqueTypes                                                                                                                        |
| 可选生态             | resolvers、DevTools、ErrorMessage、Lenses、Form Builder                                                                                                                                                             |
| 实际场景             | 编辑回填、草稿、分步、上传、SSR、React Native 适配、虚拟列表、动态树、性能、测试与无障碍                                                                                                                            |

## 官方资料与版本核对入口

- [官方文档总览](https://react-hook-form.com/docs)：用于查阅 API；在线文档可能随着版本更新。
- [7.90.0 源码](https://github.com/react-hook-form/react-hook-form/tree/v7.90.0/src)：本文全部核心 API 与行为的版本依据。
- [7.90.0 表单类型](https://github.com/react-hook-form/react-hook-form/blob/v7.90.0/src/types/form.ts)：配置、方法、状态、提交返回值和数据操作选项。
- [7.90.0 对象类型辅助定义](https://github.com/react-hook-form/react-hook-form/blob/v7.90.0/src/types/utils.ts)：OpaqueTypes、OpaqueType 及相关递归类型。
- [官方文档源码](https://github.com/react-hook-form/documentation/tree/master/src/content/docs)：官网不可访问时可读取 MDX。
- [官方 releases](https://github.com/react-hook-form/react-hook-form/releases)：核对稳定版与预发布版。
- [官方 resolvers](https://github.com/react-hook-form/resolvers)：各 schema 适配器及输入输出类型支持。
- [官方 Lenses](https://github.com/react-hook-form/lenses)：嵌套类型复用与互操作。

本文示例围绕 7.90.0 的公开 API 独立编写。运行前准备对应版本和必要依赖，按实际服务调整接口约定；维护文档时应以具体稳定版本的安装包、类型和源码为依据。
