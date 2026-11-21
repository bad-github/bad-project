# 基础表单

技术训练营报名示例。桌面端左侧展示全部字段，右侧展示表单状态与数据，直接在内容区域布局，不使用卡片、标签页或分步流程。两侧占满内容高度并独立滚动；可用宽度不足时上下排列，仍各自滚动。状态用表格展示，JSON 分区可展开收起，不设置嵌套滚动区。

## 组件

页面分为基本资料、报名信息、日期安排、学习与参与偏好、验证与确认五个分区。日期安排仅包含参加日期与学习周期；学习与参与偏好包含每周投入、兴趣方向、候补和通知；验证与确认包含邮箱验证码与条款同意。

表单控件使用 `@workspace/ui-base` 的基础组件，密码使用 MyInput 提供显隐切换，不使用 FilterInput、Questionnaire 或 Attachment；状态表格使用 MyTooltip 配合问号图标解释各状态的含义。

| 内容       | 组件                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 姓名、年龄 | Input                                                                                                                        |
| 邮箱       | InputGroup、InputGroupInput、InputGroupAddon、InputGroupText                                                                 |
| 密码       | MyInput，通过 Controller 接入并提供显隐切换                                                                                  |
| 自我介绍   | Textarea                                                                                                                     |
| 地区       | NativeSelect、NativeSelectOption、NativeSelectOptGroup                                                                       |
| 班次       | Select、SelectTrigger、SelectValue、SelectContent、SelectGroup、SelectLabel、SelectItem                                      |
| 机构搜索   | Combobox、ComboboxInput、ComboboxContent、ComboboxList、ComboboxItem、ComboboxEmpty                                          |
| 参与方式   | RadioGroup、RadioGroupItem、Label                                                                                            |
| 日期       | Popover + Calendar，点击选择单日或学习周期范围，值保存为本地 YYYY-MM-DD；范围保存为起止日期数组，半选时只有开始日期          |
| 学习投入   | Slider，RHF 保存数字，控件接收单元素数组                                                                                     |
| 学习方向   | ToggleGroup、ToggleGroupItem                                                                                                 |
| 候补与通知 | Toggle、Switch                                                                                                               |
| 验证码     | InputOTP、InputOTPGroup、InputOTPSlot、InputOTPSeparator                                                                     |
| 条款       | Checkbox                                                                                                                     |
| 布局与反馈 | Field、FieldGroup、FieldSet、FieldLegend、FieldContent、FieldLabel、FieldTitle、FieldDescription、FieldError、FieldSeparator |
| 操作       | Button                                                                                                                       |

## RHF API

- `useForm/defaultValues`：初始化完整数据；mode 为 onBlur，提交后按 onChange 重新校验。
- `register`：连接普通输入，使用 required、长度、pattern、validate 和 setValueAs。
- `Controller`：适配受控组件的 value、checked、pressed 和回调，转交 ref 与 onBlur。

- `FormProvider/useFormContext`：多个字段区共用一个实例。
- `useFormState/getFieldState`：字段局部错误反馈与观察姓名状态。
- `useWatch`：右侧实时订阅值，左侧不 watch 整表。
- `setValues`：填入一整份示例，标记 dirty 并校验。
- `setValue`：将姓名设为张三，指定 shouldValidate、shouldDirty、shouldTouch，观察单字段赋值后的状态。
- `getValues/getErrors`：按钮按下时读取快照，后续编辑不改变快照。
- `trigger`：手动校验整表或仅校验邮箱，同时设置 touched 并聚焦错误。
- `setError`：模拟邮箱已被注册的服务端错误，不发送请求；可直接从左侧字段看到提示。
- `clearErrors`：清除邮箱错误提示，不修改值或校验规则，也不主动重新计算 isValid；重新校验仍可能出现错误。
- `reset/resetField`：恢复整表初值或单独重置姓名。
- `setFocus`：选择姓名文本。
- `handleSubmit/formState`：校验后模拟异步提交，展示提交状态、次数及结果。

MyInput 的 ref 是包含 focus/select 的自定义句柄，密码字段通过 Controller 传递 value、onChange、onBlur 与 ref，不直接使用 register；回填、清空和重置由受控值同步到输入框。

## 数据边界

本页不发送网络请求，不保存到 localStorage，也不记录原始资料到日志。邮箱验证码固定为 `123456`，只用于演示字段校验，不代表真实身份验证。观察区、读取快照和提交结果中的密码与验证码统一脱敏。

输入过程中允许数值为空（null），0 不会被错误地当作空值；日期按本地日历处理，不使用 UTC 转换。

字段统一按标签、控件、说明、错误排列，说明文字不会推低同一行的控件；必填星号独立使用红色。学习周期需选择完整的起止日期，结束日期晚于开始日期，支持跨月跨年、清空和重置；右侧观察区可看到半选状态和校验反馈。

## 检查

在仓库根目录运行 `pnpm --filter react-vite-admin test`。本目录测试验证实际 RHF 的注册、校验、回填、提交、重置和快照行为；不替代浏览器中的浮层、键盘、焦点与响应式布局检查。
