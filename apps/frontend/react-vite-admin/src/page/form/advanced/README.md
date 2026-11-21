# 高级表单

以账户与企业资料设置为场景。左侧控件平铺，不设置分区标题或分隔线；右侧观察，两侧独立滚动。直接在内容区域布局，窄屏上下排列，无卡片、标签页或步骤流程。

## 场景与 API

| 场景                 | RHF 能力                                          | 操作                                                                   |
| -------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| 异步初始化           | defaultValues、isLoading                          | 进入页面等待 800ms 加载既有资料                                        |
| 用户名查重           | 异步 resolver、isValidating、validatingFields     | 失焦或点击仅查重用户名；admin、test、root 被占用                       |
| 条件企业字段         | useWatch、shouldUnregister                        | 个人切换企业后填写名称与代码；切回个人自动注销                         |
| 省市联动             | 嵌套路径、setValue、useController                 | 省份变化清空城市，450ms 后显示新选项                                   |
| 条件密码与跨字段校验 | Zod superRefine、deps、shouldUnregister           | 开启修改密码，输入不一致的密码；新密码失焦重新校验确认值               |
| 刷新保留编辑         | reset、keepDirtyValues、dirtyFields               | 修改邮箱后刷新，对比保留修改开关开/关的行为                            |
| 服务端字段错误       | handleSubmit、setError                            | 选择邮箱冲突，或使用 used@example.com，错误显示在邮箱下                |
| 表单级错误           | setError('root.server')                           | 选择服务异常，错误显示在保存按钮附近，可切换场景重试                   |
| 成功后的数据基准     | reset、defaultValues                              | 保存结果成为新的默认值，清理 dirty 与密码                              |
| 派生摘要             | useWatch.compute                                  | 右侧显示身份、城市与修改密码摘要                                       |
| 模拟自动草稿         | subscribe、取消订阅、800ms 防抖                   | 开启后编辑，观察脱敏的草稿结果；关闭、刷新、提交和卸载时取消待处理任务 |
| 状态与快照           | useFormState、getValues、getErrors、getFieldState | 表格展示状态，问号解释含义，JSON 可独立折叠                            |

新密码和确认密码使用 MyInput，通过 Controller 传递受控值、事件和自定义 ref 句柄，复用显隐切换。新密码的 deps 与确认密码的跨字段规则保持不变，关闭修改密码仍会注销这两个字段。

刷新、重置本地修改及保存后的回填统一使用 form-actions.ts 的 resetProfile，设置 keepFieldsRef: true。当前 RHF 的 shouldUnregister 模式会在 reset 时清空内部值；保留字段引用可同步已挂载字段的值，避免输入框显示资料但提交时提示缺字段。

## 企业 Logo 自定义控件

切换企业身份后显示选填的 Logo 控件，支持上传、预览、更换和删除。LogoUpload 不依赖 RHF，通过 upload 属性注入异步接口，对外提供 value、onChange、onBlur、disabled、readOnly、上传状态/错误事件和指向上传按钮的 ref，通过 Controller 接入。选择时先检查格式与大小，通过后展示 loading，1 秒上传完成后才写入表单和展示新图片。删除后立即更新并校验，离开控件时更新 touched；表单提交期间禁用，错误聚焦到上传按钮。

上传期间保留原表单值，展示 loading 替代预览；可取消上传，旧请求结果会被忽略。上传失败保留原值并显示错误。上传中禁止保存、刷新和重置；重置、禁用、切换个人身份或卸载也会使在途结果失效。草稿订阅仍能接收成功上传后提交的新值。

规则为非空 PNG/JPEG 文件、最大 2MB，基于文件 MIME 类型和大小检查。原生 accept 仅用于文件选择过滤，不能代替校验。取消选择不修改值，相同文件可以重新选择。Logo 为选填，删除后不产生必填错误。

值包含唯一 id、文件元数据以及本地 File 或已有图片 URL，显式 id 避免仅依赖 File 比较 dirty。受控值支持回填和重置，成功保存后仍可恢复本地图片；切换个人身份注销此字段。预览通过临时 Object URL 展示，在更换、删除和卸载时释放；JSON、快照和草稿只包含元数据，不包含 File、Base64 或临时 URL。当前接口不实际上传图片。

## 模拟接口说明

所有模拟接口都在 api.ts，使用 `import {time} from '@workspace/utils'` 后调用 `time.sleep`。该方法第三个参数是成功概率，本页统一传入 1，避免随机失败；失败由输入或“提交场景”显式决定。

- getProfile：800ms，每次刷新返回不同的用户名、邮箱和地址。
- checkUsername：600ms，忽略大小写与两侧空格检查占用；格式不合法不发起查重。
- getCities：450ms，省份变化后丢弃旧请求结果。
- uploadCompanyLogo：1000ms，校验文件后返回 Logo 数据，界面在完成前展示上传状态。
- saveProfile：900ms，返回成功、字段错误或全局错误；保存时再次检查用户名和邮箱。
- saveDraft：350ms，只返回脱敏预览，没有网络、日志、localStorage 或真实持久化。

订阅 isValid 会让 RHF 为计算整表有效性重新执行字段校验。用户名校验对同一值复用结果、合并在途请求，避免编辑其他字段时重复查重；用户名变化或请求失败后才重新请求。并发时共同等待最新请求，输入变化但还没再次失焦时忽略旧结果。提交会执行字段校验，保存接口独立再次检查占用。省市选项请求使用 effect 清理避免旧响应覆盖新省份。

校验统一放在 schema.ts，使用 Zod + zodResolver，组件只注册字段与依赖。当前 RHF 版本的内置异步字段规则会在动态 register 时同步通知 isValidating，可能造成跨组件渲染更新警告；resolver 路径将注册触发的有效性检查延后，避免这个问题，保留真实的校验状态。企业代码仅演示格式规则，不代表真实性或校验码验证。提交场景、保留编辑选项和自动草稿开关均不属于业务表单数据。Logo 标识使用时间戳加递增序号，不依赖安全上下文中的 crypto.randomUUID。

## 验证

advanced.test.ts 使用虚拟计时器验证模拟接口的结果、并发查重、跨字段校验、真实 RHF 的保留修改/重置与注销行为，以及快照脱敏；不替代浏览器的键盘和浮层交互检查。
